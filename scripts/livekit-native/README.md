# LiveKit Native Agent Test Scripts

This directory contains test scripts for validating the LiveKit Native Python agent implementation.

## Test Organization

Tests are organized into phases matching our implementation tracking in `/docs/LIVEKIT_REFERENCE_COMPARISON.md`:

### Phase 1: Core Architecture Tests
- `test-livekit-server-pattern.js` - Verify AgentServer pattern
- `test-livekit-inference.js` - Verify inference layer (STT/LLM/TTS)
- `test-livekit-userdata.js` - Verify typed userdata pattern
- `test-livekit-session-config.js` - Verify session configuration

### Phase 2: Function Tool Tests
- `test-tool-get-profile.js` - Test get_user_profile_tool
- `test-tool-find-food.js` - Test find_food_item_tool
- `test-tool-add-cart.js` - Test quick_add_to_cart_tool
- `test-all-tools-schema.js` - Validate all tool schemas

### Phase 3: Integration Tests
- `test-livekit-native-e2e-v2.js` - Enhanced end-to-end test
- `test-livekit-error-handling.js` - Error handling scenarios
- `test-livekit-performance.js` - Performance benchmarks

## Running Tests

**Individual test:**
```bash
node scripts/livekit-native/test-livekit-server-pattern.js
```

**All tests in sequence:**
```bash
npm run test:livekit-all
```

**Quick smoke test:**
```bash
npm run test:livekit-smoke
```

## Test Requirements

- Python agent must be running: `python agents/food_concierge_native.py dev`
- LiveKit Cloud credentials configured in `.env`
- Supabase database accessible
- Node.js dependencies installed

## Test Output

Tests log to console and optionally to:
- `/tmp/livekit-test-results.json` - Machine-readable results
- `/tmp/livekit-performance.csv` - Performance metrics

## Success Criteria

Each test should:
- ✅ Exit with code 0 on success
- ✅ Exit with code 1 on failure
- ✅ Print clear pass/fail status
- ✅ Include timing information
- ✅ Log errors with actionable guidance

## Writing New Tests

Use this template:

```javascript
#!/usr/bin/env node

const testName = 'Test Name';
console.log(`\n${'='.repeat(60)}`);
console.log(`🧪 ${testName}`);
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

async function runTest() {
  try {
    // Test logic here
    console.log('✅ Test assertion passed');
    passed++;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    failed++;
  }
}

// Run tests
await runTest();

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log(`${testName} Results:`);
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);
```

## Troubleshooting

**Test hangs:**
- Check if Python agent is running
- Verify LiveKit WebSocket connection

**Schema validation errors:**
- Review function parameter types
- Check for optional parameters with defaults

**Connection timeouts:**
- Verify LiveKit credentials
- Check network connectivity

---

For detailed implementation tracking, see: `/docs/LIVEKIT_REFERENCE_COMPARISON.md`
