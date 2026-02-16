#!/usr/bin/env node
/**
 * Test Cart Reset Functionality
 * 
 * Verifies that voice cart properly resets between sessions to prevent
 * the $100.98 carryover bug where items from previous sessions accumulate.
 * 
 * This test:
 * 1. Calls Python test_database.py which includes cart reset test
 * 2. Verifies cart is empty after reset
 * 3. Confirms no session carryover
 * 
 * Prerequisites:
 * - Python 3.x installed
 * - Python dependencies installed (supabase, dotenv, etc.)
 * - .env.local configured with Supabase credentials
 * 
 * Usage:
 *   node scripts/test-cart-reset.js
 * 
 * Related Issue: Agent announces $100.98 but order shows $11.98
 * Root Cause: In-memory voice_cart persisting between sessions
 * Fix: reset_voice_cart() called at session start
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(70));
  log('bold', `  ${title}`);
  console.log('='.repeat(70) + '\n');
}

async function runPythonTest() {
  return new Promise((resolve) => {
    header('🧪 Testing Voice Cart Reset Functionality');
    
    log('blue', '📍 Running Python test_database.py (includes cart reset test)...\n');
    
    const pythonScript = path.join(__dirname, '..', 'agents', 'test_database.py');
    const agentsDir = path.join(__dirname, '..', 'agents');
    
    const python = spawn('python3', [pythonScript], {
      cwd: agentsDir,
      env: process.env
    });
    
    let stdout = '';
    let stderr = '';
    let hasCartResetTest = false;
    let cartResetPassed = false;
    
    python.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
      
      // Check for cart reset test
      if (output.includes('Test 4: Cart Reset')) {
        hasCartResetTest = true;
      }
      
      // Check if cart reset passed
      if (output.includes('Cart reset successful - prevents $100.98 bug!')) {
        cartResetPassed = true;
      }
    });
    
    python.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(colors.red + output + colors.reset);
    });
    
    python.on('close', (code) => {
      console.log('\n' + '─'.repeat(70));
      
      if (code === 0 && hasCartResetTest && cartResetPassed) {
        log('green', '\n✅ SUCCESS: Cart reset test passed!');
        log('green', '   ✓ Voice cart properly clears between sessions');
        log('green', '   ✓ Prevents $100.98 carryover bug');
        log('green', '   ✓ Each session starts with empty cart');
      } else if (code === 0 && hasCartResetTest) {
        log('yellow', '\n⚠️  WARNING: Tests passed but cart reset verification unclear');
        log('yellow', '   Check output above for cart reset results');
      } else if (code === 0) {
        log('yellow', '\n⚠️  WARNING: Tests passed but no cart reset test found');
        log('yellow', '   Cart reset test may not be implemented');
      } else {
        log('red', '\n❌ FAILED: Cart reset test failed');
        log('red', `   Exit code: ${code}`);
        if (stderr) {
          log('red', '   Check errors above');
        }
      }
      
      resolve({
        passed: code === 0 && hasCartResetTest && cartResetPassed,
        exitCode: code,
        hasCartResetTest,
        cartResetPassed,
        stdout,
        stderr
      });
    });
  });
}

async function verifyAgentFiles() {
  const fs = require('fs').promises;
  
  header('📂 Verifying Agent Files');
  
  const files = [
    '../agents/database.py',
    '../agents/food_concierge_agentserver.py',
    '../agents/food_concierge_native.py',
    '../agents/test_database.py'
  ];
  
  let allExist = true;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    try {
      await fs.access(filePath);
      log('green', `✓ ${file}`);
    } catch (error) {
      log('red', `✗ ${file} - NOT FOUND`);
      allExist = false;
    }
  }
  
  if (!allExist) {
    log('red', '\n❌ Missing required files');
    return false;
  }
  
  return true;
}

async function checkResetImplementation() {
  const fs = require('fs').promises;
  
  header('🔍 Verifying reset_voice_cart() Implementation');
  
  try {
    const databasePath = path.join(__dirname, '..', 'agents', 'database.py');
    const databaseContent = await fs.readFile(databasePath, 'utf-8');
    
    const hasResetFunction = databaseContent.includes('def reset_voice_cart()');
    const agentServerPath = path.join(__dirname, '..', 'agents', 'food_concierge_agentserver.py');
    const agentServerContent = await fs.readFile(agentServerPath, 'utf-8');
    const hasAgentServerCall = agentServerContent.includes('reset_voice_cart()');
    
    const agentNativePath = path.join(__dirname, '..', 'agents', 'food_concierge_native.py');
    const agentNativeContent = await fs.readFile(agentNativePath, 'utf-8');
    const hasAgentNativeCall = agentNativeContent.includes('reset_voice_cart()');
    
    log('cyan', 'Checking implementation:');
    log(hasResetFunction ? 'green' : 'red', 
        `  ${hasResetFunction ? '✓' : '✗'} reset_voice_cart() defined in database.py`);
    log(hasAgentServerCall ? 'green' : 'red', 
        `  ${hasAgentServerCall ? '✓' : '✗'} Called in food_concierge_agentserver.py`);
    log(hasAgentNativeCall ? 'green' : 'red', 
        `  ${hasAgentNativeCall ? '✓' : '✗'} Called in food_concierge_native.py`);
    
    if (hasResetFunction && hasAgentServerCall && hasAgentNativeCall) {
      log('green', '\n✅ Cart reset properly implemented in all agents');
      return true;
    } else {
      log('red', '\n❌ Cart reset implementation incomplete');
      return false;
    }
  } catch (error) {
    log('red', `❌ Error checking files: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(colors.bold + '\n🎯 Cart Reset Test Suite' + colors.reset);
  console.log('Testing fix for: Agent announces $100.98 but order shows $11.98\n');
  
  // Step 1: Verify files exist
  const filesExist = await verifyAgentFiles();
  if (!filesExist) {
    process.exit(1);
  }
  
  // Step 2: Check implementation
  const implementationOk = await checkResetImplementation();
  if (!implementationOk) {
    log('yellow', '\n⚠️  Continuing to test anyway...');
  }
  
  // Step 3: Run Python tests
  const result = await runPythonTest();
  
  // Final summary
  header('📊 Test Summary');
  
  if (result.passed) {
    log('green', '✅ All checks passed!');
    log('green', '   The $100.98 carryover bug should be fixed.');
    log('cyan', '\n💡 Next steps:');
    log('cyan', '   1. Restart Python agent: cd agents && python food_concierge_agentserver.py dev');
    log('cyan', '   2. Start new voice session');
    log('cyan', '   3. Add 1 item and checkout');
    log('cyan', '   4. Verify agent announces correct total ($11.98)');
    process.exit(0);
  } else {
    log('red', '❌ Tests failed');
    log('yellow', '\n🔧 Troubleshooting:');
    log('yellow', '   • Ensure Python dependencies installed: pip install -r agents/requirements.txt');
    log('yellow', '   • Check .env.local has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    log('yellow', '   • Verify Supabase is running (local or remote)');
    process.exit(1);
  }
}

main().catch(error => {
  log('red', `\n❌ Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
