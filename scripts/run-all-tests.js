#!/usr/bin/env node

/**
 * Test Runner - AI-SDK & LiveKit Pipeline Validation
 * 
 * Runs all test scripts in sequence and provides comprehensive report.
 * 
 * Test Order:
 * 1. LiveKit Regression (baseline - should PASS)
 * 2. AI-SDK Get Context (should FAIL before fixes, PASS after)
 * 3. AI-SDK Orlando Search (should FAIL before fixes, PASS after)
 * 4. AI-SDK End-to-End Flow (should FAIL before fixes, PASS after)
 * 5. LiveKit Regression (retest - should still PASS)
 * 
 * Usage:
 *   node scripts/run-all-tests.js
 *   npm run test:pipelines
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'LiveKit Regression (Baseline)',
    script: 'test-livekit-regression.js',
    critical: true,
    description: 'Ensures voice pipeline works before testing AI-SDK'
  },
  {
    name: 'AI-SDK Get Context',
    script: 'test-ai-sdk-get-context.js',
    critical: false,
    description: 'Tests profile/preferences loading'
  },
  {
    name: 'AI-SDK Orlando Search',
    script: 'test-ai-sdk-orlando-search.js',
    critical: false,
    description: 'Tests restaurant search in Orlando'
  },
  {
    name: 'AI-SDK End-to-End Flow',
    script: 'test-ai-sdk-end-to-end.js',
    critical: false,
    description: 'Tests complete conversational ordering flow'
  },
  {
    name: 'LiveKit Regression (Final)',
    script: 'test-livekit-regression.js',
    critical: true,
    description: 'Confirms voice pipeline still works after AI-SDK tests'
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, test.script);
    const child = spawn('node', [scriptPath]);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        name: test.name,
        script: test.script,
        passed: code === 0,
        critical: test.critical,
        stdout,
        stderr,
        exitCode: code
      });
    });
  });
}

async function runAllTests() {
  console.log('🚀 Running All Pipeline Tests\n');
  console.log('='.repeat(70));
  console.log('Purpose: Validate AI-SDK fixes and LiveKit isolation');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n\n[${ i + 1}/${tests.length}] ${test.name}`);
    console.log('─'.repeat(70));
    console.log(`📝 ${test.description}`);
    console.log('─'.repeat(70));
    
    const result = await runTest(test);
    results.push(result);
    
    // Print test output
    console.log(result.stdout);
    if (result.stderr) {
      console.error('STDERR:', result.stderr);
    }
    
    // If critical test fails, stop execution
    if (test.critical && !result.passed) {
      console.error(`\n🚨 CRITICAL TEST FAILED: ${test.name}`);
      console.error('Cannot continue with remaining tests.');
      break;
    }
  }
  
  // Summary report
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\nTotal Tests Run: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);
  
  console.log('Individual Results:');
  console.log('─'.repeat(70));
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const critical = result.critical ? '🔴 CRITICAL' : '  ';
    console.log(`${index + 1}. ${status} ${critical} ${result.name}`);
  });
  
  console.log('\n' + '='.repeat(70));
  
  // Analysis
  const livekitBaseline = results.find(r => r.script === 'test-livekit-regression.js' && r === results[0]);
  const livekitFinal = results.find(r => r.script === 'test-livekit-regression.js' && r === results[results.length - 1]);
  const aiSdkTests = results.filter(r => r.script.includes('ai-sdk'));
  
  console.log('\n📈 ANALYSIS:\n');
  
  // LiveKit isolation check
  if (livekitBaseline && livekitFinal) {
    const isolated = livekitBaseline.passed && livekitFinal.passed;
    if (isolated) {
      console.log('✅ ISOLATION VERIFIED: LiveKit pipeline unaffected by AI-SDK');
    } else if (livekitBaseline.passed && !livekitFinal.passed) {
      console.log('🚨 REGRESSION DETECTED: AI-SDK changes broke LiveKit!');
    } else if (!livekitBaseline.passed) {
      console.log('⚠️  LiveKit was already broken (not a regression)');
    }
  }
  
  // AI-SDK status
  const aiSdkPassed = aiSdkTests.every(t => t.passed);
  const aiSdkFailed = aiSdkTests.every(t => !t.passed);
  
  if (aiSdkPassed) {
    console.log('✅ AI-SDK READY: All conversational flow tests passing');
  } else if (aiSdkFailed) {
    console.log('❌ AI-SDK BROKEN: All tests failing (pre-existing bugs confirmed)');
    console.log('   → Next step: Apply fixes from AI_SDK_ANALYSIS.md');
  } else {
    console.log('⚠️  AI-SDK PARTIAL: Some tests passing, some failing');
    console.log('   → Review individual test results above');
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Next steps
  if (failed > 0) {
    console.log('\n📋 RECOMMENDED NEXT STEPS:\n');
    
    if (aiSdkTests.some(t => !t.passed)) {
      console.log('1. Review AI_SDK_ANALYSIS.md for detailed bug explanations');
      console.log('2. Apply fixes one at a time from app/api/food-chat/tools.ts:');
      console.log('   - Fix #1: Remove rating column from fetchRecentOrders');
      console.log('   - Fix #2: Change FALLBACK_PREFERENCES to FALLBACK_PREFERENCE_RECORD');
      console.log('   - Fix #3: Add null coalescing (recentOrders ?? [])');
      console.log('3. Run tests after each fix to validate improvement');
      console.log('4. Ensure LiveKit regression test still passes');
    }
    
    if (livekitFinal && !livekitFinal.passed && livekitBaseline && livekitBaseline.passed) {
      console.log('\n🚨 CRITICAL: Rollback AI-SDK changes immediately!');
      console.log('   LiveKit regression detected - voice pipeline broken');
    }
  } else {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ Both pipelines working correctly:');
    console.log('   - AI-SDK: Exploratory conversational ordering');
    console.log('   - LiveKit: Direct voice commands');
    console.log('   - Isolated: No conflicts between pipelines');
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test runner failed:', error);
  process.exit(1);
});
