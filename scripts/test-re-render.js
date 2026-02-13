const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Test script to validate infinite re-render fixes
 * Tests the specific scenario that was causing infinite loops:
 * 1. Load AI SDK concierge page
 * 2. Click "Talk" button 
 * 3. Send "Can you help me find something to eat"
 * 4. Monitor for infinite re-render errors
 */

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  maxAcceptableRenderCycles: 50, // Normal React apps re-render < 50x per interaction
};

async function testInfiniteReRenderFix() {
  console.log('🧪 Testing Infinite Re-render Fix\n');
  console.log('='.repeat(50));
  
  let browser;
  let passed = false;
  let errorDetails = null;
  
  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Track console errors and warnings
    const errors = [];
    const renderCounts = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      
      // Track render-related logs
      if (text.includes('renderToolOutput called')) {
        renderCounts.push(Date.now());
      }
      
      // Track errors
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });
    
    // Track uncaught exceptions
    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });
    
    // Step 1: Load the AI SDK concierge page
    console.log('📖 Loading AI SDK concierge page...');
    await page.goto(`${TEST_CONFIG.baseUrl}/food/concierge`, { 
      waitUntil: 'networkidle0',
      timeout: TEST_CONFIG.timeout 
    });
    
    // Wait for React to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for immediate infinite loop errors
    if (errors.some(err => err.includes('Too many re-renders'))) {
      throw new Error('Infinite re-render detected on page load');
    }
    
    console.log('✅ Page loaded without immediate infinite re-renders');
    
    // Step 2: Click the "Talk" button
    console.log('🎤 Looking for Talk button...');
    
    // Wait for Talk button or text input
    try {
      await page.waitForSelector('button, input[type="text"], textarea', { timeout: 10000 });
    } catch (e) {
      throw new Error('No interactive elements found on page');
    }
    
    const talkButtonFound = await page.evaluate(() => {
      // Find button containing "Talk" or "Voice" or similar
      const buttons = Array.from(document.querySelectorAll('button'));
      const talkButton = buttons.find(btn => 
        btn.textContent.toLowerCase().includes('talk') ||
        btn.textContent.toLowerCase().includes('voice') ||
        btn.textContent.toLowerCase().includes('mic')
      );
      if (talkButton) {
        talkButton.click();
        return true;
      }
      return false;
    });
    
    if (!talkButtonFound) {
      console.log('⚠️  Talk button not found, trying text input instead...');
      
      // Fallback: use text input directly
      await page.waitForSelector('input[type="text"], textarea', { timeout: 5000 });
      await page.focus('input[type="text"], textarea');
    } else {
      console.log('✅ Talk button clicked');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Clear render count tracking
    renderCounts.length = 0;
    
    // Step 3: Send the problematic query
    console.log('💬 Sending test query: "Can you help me find something to eat"');
    
    // Either type in input or use speech simulation
    const queryText = "Can you help me find something to eat";
    
    const inputSent = await page.evaluate((text) => {
      // Try to find text input
      const input = document.querySelector('input[type="text"], textarea');
      if (input) {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Find and click send button (fix selector)
        const buttons = Array.from(document.querySelectorAll('button'));
        const sendButton = buttons.find(btn => 
          btn.type === 'submit' || 
          btn.textContent.toLowerCase().includes('send') ||
          btn.textContent.toLowerCase().includes('submit')
        );
        
        if (sendButton) {
          sendButton.click();
          return true;
        }
        
        // Or press Enter
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        return true;
      }
      return false;
    }, queryText);
    
    if (!inputSent) {
      throw new Error('Could not send test query - input/form not found');
    }
    
    console.log('✅ Query sent, monitoring for infinite re-renders...');
    
    // Step 4: Monitor for infinite re-renders over 10 seconds
    const monitorStart = Date.now();
    const monitorDuration = 10000; // 10 seconds
    
    while (Date.now() - monitorStart < monitorDuration) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check for "Too many re-renders" error
      if (errors.some(err => err.includes('Too many re-renders'))) {
        throw new Error('INFINITE RE-RENDER DETECTED: React error occurred');
      }
      
      // Check for excessive render cycles
      const recentRenders = renderCounts.filter(time => Date.now() - time < 5000);
      if (recentRenders.length > TEST_CONFIG.maxAcceptableRenderCycles) {
        throw new Error(`EXCESSIVE RENDERS: ${recentRenders.length} renders in 5 seconds`);
      }
      
      console.log(`⏱️  Monitoring... (${Math.round((Date.now() - monitorStart) / 1000)}s, ${recentRenders.length} renders)`);
    }
    
    console.log('✅ Test completed successfully - no infinite re-renders detected!');
    console.log(`📊 Total renders during test: ${renderCounts.length}`);
    console.log(`📊 Total errors during test: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors detected (but not infinite re-renders):');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }
    
    passed = true;
    
  } catch (error) {
    errorDetails = error.message;
    console.log(`\n❌ TEST FAILED: ${error.message}`);
    
    if (error.message.includes('INFINITE RE-RENDER') || error.message.includes('EXCESSIVE RENDERS')) {
      console.log('\n🔧 INFINITE RE-RENDER ISSUE STILL EXISTS!');
      console.log('   The fix was not successful. Please check:');
      console.log('   1. All useEffect dependencies are stable');
      console.log('   2. No callbacks are recreated on every render');
      console.log('   3. Debug tracker deduplication is working');
    }
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return { passed, errorDetails };
}

// Add to package.json integration
function generatePackageScript() {
  console.log('\n📦 Add this to your package.json scripts:');
  console.log('```json');
  console.log('"test:re-render": "node scripts/test-re-render.js"');
  console.log('```');
}

// Run test if called directly
if (require.main === module) {
  testInfiniteReRenderFix()
    .then(({ passed, errorDetails }) => {
      console.log('\n' + '='.repeat(50));
      if (passed) {
        console.log('🎉 INFINITE RE-RENDER FIX VERIFIED WORKING!');
        console.log('✅ Ready for production use');
        process.exit(0);
      } else {
        console.log('❌ INFINITE RE-RENDER FIX FAILED');
        console.log(`❌ Error: ${errorDetails}`);
        generatePackageScript();
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { testInfiniteReRenderFix };