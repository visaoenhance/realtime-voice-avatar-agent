const puppeteer = require('puppeteer');

/**
 * Simplified test to detect infinite re-render issues
 * Just loads the page and monitors console for the specific error
 */

async function testInfiniteReRenderFix() {
  console.log('🧪 Testing Infinite Re-render Fix (Simplified)\n');
  console.log('='.repeat(60));
  
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Monitor for the specific infinite re-render error
    let infiniteRenderDetected = false;
    const errors = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Too many re-renders')) {
        infiniteRenderDetected = true;
        errors.push(`INFINITE RENDER: ${text}`);
      }
      if (msg.type() === 'error') {
        errors.push(`ERROR: ${text}`);
      }
    });
    
    page.on('pageerror', (error) => {
      if (error.message.includes('Too many re-renders')) {
        infiniteRenderDetected = true;
      }
      errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    console.log('📖 Loading AI SDK concierge page...');
    await page.goto('http://localhost:3000/food/concierge', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded, waiting 5 seconds for any delayed errors...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (infiniteRenderDetected) {
      console.log('❌ INFINITE RE-RENDER DETECTED!');
      console.log('❌ The fix is NOT working');
      errors.forEach(err => console.log(`   ${err}`));
      return false;
    }
    
    console.log('✅ No infinite re-render errors detected on page load');
    
    // Try to trigger a simple interaction by clicking anywhere safe
    console.log('🖱️  Testing basic interaction...');
    await page.click('body');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (infiniteRenderDetected) {
      console.log('❌ INFINITE RE-RENDER DETECTED after interaction!');
      return false;
    }
    
    console.log('✅ No infinite re-render after basic interaction');
    
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} other errors detected (but no infinite re-render):`);
      errors.slice(0, 3).forEach(err => console.log(`   ${err}`));
      if (errors.length > 3) console.log(`   ... and ${errors.length - 3} more`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Manual test instructions
function printManualTestInstructions() {
  console.log('\n📋 MANUAL TEST REQUIRED:');
  console.log('To fully validate the fix, please manually:');
  console.log('1. Go to http://localhost:3000/food/concierge');
  console.log('2. Click the "Talk" button');  
  console.log('3. Say or type: "Can you help me find something to eat"');
  console.log('4. Watch for infinite re-render errors in browser console');
  console.log('5. Verify the response completes without errors');
}

// Run test
if (require.main === module) {
  testInfiniteReRenderFix()
    .then((passed) => {
      console.log('\n' + '='.repeat(60));
      if (passed) {
        console.log('🎉 AUTOMATED TEST PASSED');
        console.log('✅ No infinite re-render detected on page load');
        printManualTestInstructions();
      } else {
        console.log('❌ AUTOMATED TEST FAILED');
        console.log('❌ Infinite re-render issue still exists');
        console.log('🔧 Need to debug further');
      }
    })
    .catch(console.error);
}

module.exports = { testInfiniteReRenderFix };