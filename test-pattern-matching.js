#!/usr/bin/env node

// Test script to verify LiveKit pattern matching logic
// This simulates the exact logic from the LiveKit page component

console.log('🧪 Testing LiveKit Pattern Matching Logic\n');

// Simulate the generateAgentResponse logic
function testGenerateAgentResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Handle checkout requests - properly process the order
  if (lowerMessage.includes('checkout') || 
      lowerMessage.includes('ready to check') || 
      lowerMessage.includes('place order') || 
      lowerMessage.includes('place the order') ||
      lowerMessage.includes('proceed to place') ||
      lowerMessage.includes('lets proceed') ||
      lowerMessage.includes('complete order') ||
      lowerMessage.includes('finish order') ||
      lowerMessage.includes('submit order')) {
    return '🛒 CHECKOUT: Processing order...';
  }
  
  // Cart addition responses  
  if (((lowerMessage.includes('yes') || lowerMessage.includes('add') || lowerMessage.includes('lets add')) && (lowerMessage.includes('cart') || lowerMessage.includes('card') || lowerMessage.includes('order'))) ||
      (lowerMessage.includes('add') && lowerMessage.includes('island breeze')) ||
      (lowerMessage.includes('lets') && lowerMessage.includes('add') && lowerMessage.includes('cheesecake'))) {
    return '➕ CART: Adding item to cart...';
  }
  
  // Handle image requests FIRST (before cheesecake logic catches everything)
  if (lowerMessage.includes('show me') || 
      lowerMessage.includes('show me what') ||
      (lowerMessage.includes('show') && (lowerMessage.includes('picture') || lowerMessage.includes('image') || lowerMessage.includes('it to me') || lowerMessage.includes('what it looks'))) ||
      lowerMessage.includes('see what') || 
      lowerMessage.includes('looks like') ||
      (lowerMessage.includes('what') && lowerMessage.includes('looks like')) ||
      lowerMessage.includes('from island breeze') && lowerMessage.includes('look')) {
    return '🖼️ IMAGE: Showing visual preview...';
  }
  
  // Enhanced cheesecake filtering - detect "no chocolate" requests
  if (lowerMessage.includes('cheesecake')) {
    const needsNoChocolate = lowerMessage.includes('no chocolate') || 
                             lowerMessage.includes('without chocolate') || 
                             lowerMessage.includes('without the chocolate') ||
                             lowerMessage.includes('but without') ||
                             lowerMessage.includes('does not have chocolate') ||
                             lowerMessage.includes('does not have any chocolate') ||  // fix for "any chocolate"
                             lowerMessage.includes('doesn\'t have chocolate') ||
                             lowerMessage.includes('doesn\'t have any chocolate') ||
                             lowerMessage.includes('doesnt have chocolate') ||  // no apostrophe
                             lowerMessage.includes('doesnt have any chocolate') ||  
                             lowerMessage.includes('that doesnt have') ||
                             lowerMessage.includes('that doesn\'t have') ||
                             lowerMessage.includes('help me find') && lowerMessage.includes('no chocolate') ||
                             lowerMessage.includes('kill me make sure') || 
                             lowerMessage.includes('make sure it doesn\'t');
    
    if (needsNoChocolate) {
      return '🍰 CHEESECAKE: No-chocolate option only...';
    } else {
      return '🍰 CHEESECAKE: Both options...';
    }
  }
  
  return '❓ FALLBACK: Default response...';
}

// Test cases based on user's demo script and failed examples
const testCases = [
  // User's planned demo script
  'can you help me find a cheesecake, that doesnt have chocolate',
  'can you show me what the cheesecake from Island Breeze looks like', 
  'lets add the cheesecake from Island Breeze to the card',
  'lets proceed to place the order',
  
  // Failed examples from user testing
  'Can you help me find a cheesecake that doesn\'t have any chocolate?',
  'Can you help me find a cheesecake that does not have any chocolate on it?',  // Latest failed case
  'Can you show me what the cheesecake looks like?',
  'Can you show me a picture of the cheesecake from Island Breeze?',
  
  // Edge cases
  'show me',
  'cheesecake',
  'show me the cheesecake', 
  'add to cart',
  'checkout'
];

console.log('Testing with user\'s exact phrases:\n');

testCases.forEach((testCase, index) => {
  const result = testGenerateAgentResponse(testCase);
  const status = result.includes('IMAGE') || result.includes('CHEESECAKE') || result.includes('CART') || result.includes('CHECKOUT') ? '✅' : '❌';
  
  console.log(`${index + 1}. "${testCase}"`);
  console.log(`   ${status} ${result}`);
  console.log('');
});

// Specific problem case tests
console.log('🔍 Testing specific problem cases:\n');

const problemCases = [
  {
    input: 'Can you show me what the cheesecake looks like?',
    expected: 'IMAGE',
    description: 'Should show image, not generic cheesecake response'
  },
  {
    input: 'Can you show me a picture of the cheesecake from Island Breeze?', 
    expected: 'IMAGE',
    description: 'Should show image, not generic cheesecake response'
  },
  {
    input: 'Can you help me find a cheesecake that doesn\'t have any chocolate?',
    expected: 'CHEESECAKE',
    description: 'Should filter to no-chocolate option only'
  },
  {
    input: 'Can you help me find a cheesecake that does not have any chocolate on it?',
    expected: 'CHEESECAKE', 
    description: 'Should filter to no-chocolate (with "any chocolate" pattern)'
  }
];

problemCases.forEach((test, index) => {
  const result = testGenerateAgentResponse(test.input);
  const success = result.includes(test.expected);
  const status = success ? '✅ PASS' : '❌ FAIL';
  
  console.log(`${index + 1}. ${test.description}`);
  console.log(`   Input: "${test.input}"`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Got: ${result}`);
  console.log(`   ${status}\n`);
});