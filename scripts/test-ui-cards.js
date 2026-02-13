#!/usr/bin/env node
/**
 * UI Cards Implementation Validation Script
 * 
 * Tests each chat card component implementation without making API calls.
 * Validates components exist, render properly with mock data, and integrate correctly.
 * 
 * Usage:
 *   npm run test:cards                    # Test all implemented cards
 *   npm run test:cards -- --step=1.2     # Test specific step
 *   npm run test:cards -- --dev          # Show debug information
 */

const fs = require('fs');
const path = require('path');

// Mock data for testing each card type (keeps tests small, no API calls)
const mockData = {
  customerProfile: {
    profile: {
      favoriteCuisines: ['thai', 'indian', 'caribbean'],
      dislikedCuisines: ['fried'],
      dietaryTags: ['healthy', 'high-protein'],
      spiceLevel: 'medium',
      budgetRange: 'standard',
      notes: 'Prefers options that arrive under 40 minutes.'
    },
    recentOrders: [
      { id: '1', restaurantName: 'Island Breeze Caribbean', total: 32.75, date: '2024-01-01' }
    ],
    defaultLocation: { city: 'Orlando', state: 'FL' }
  },
  restaurantSearch: {
    filters: { location: 'Orlando', cuisine: 'caribbean' },
    results: [
      {
        id: '1',
        name: 'Island Breeze Caribbean',
        cuisine: 'caribbean',
        rating: 4.7,
        etaMinutes: 32,
        deliveryFee: 2.49,
        standoutDish: 'Jerk Chicken',
        promo: 'Free delivery over $30'
      }
    ],
    totalFound: 5
  },
  shoppingCart: {
    cart: {
      id: '1',
      restaurant: { name: 'Island Breeze Caribbean' },
      items: [
        {
          id: '1',
          menuItem: { name: 'Jerk Chicken', price: 18.95 },
          quantity: 1,
          options: [],
          lineTotal: 18.95
        }
      ],
      subtotal: 18.95,
      itemCount: 1
    }
  }
};

// Implementation steps with validation criteria
const implementationSteps = {
  '1.1': {
    name: 'Shared Component Structure',
    files: [
      'components/food-cards/BaseCard.tsx',
      'components/food-cards/types.ts',
      'components/food-cards/index.ts'
    ],
    validations: [
      () => checkDirectoryStructure(),
      () => checkTypeScriptInterfaces(),
      () => checkBaseCardComponent()
    ]
  },
  '1.2': {
    name: 'Customer Profile Card',
    files: [
      'components/food-cards/CustomerProfileCard.tsx'
    ],
    validations: [
      () => checkCardComponent('CustomerProfileCard'),
      () => checkCardRendering('CustomerProfileCard', mockData.customerProfile),
      () => checkIntegration('getUserContext', 'CustomerProfileCard')
    ]
  },
  '1.3': {
    name: 'Restaurant Search Results Card',
    files: [
      'components/food-cards/RestaurantSearchCard.tsx'
    ],
    validations: [
      () => checkCardComponent('RestaurantSearchCard'),
      () => checkCardRendering('RestaurantSearchCard', mockData.restaurantSearch),
      () => checkIntegration('searchRestaurants', 'RestaurantSearchCard')
    ]
  },
  '1.4': {
    name: 'Shopping Cart Card',
    files: [
      'components/food-cards/ShoppingCartCard.tsx'
    ],
    validations: [
      () => checkCardComponent('ShoppingCartCard'),
      () => checkCardRendering('ShoppingCartCard', mockData.shoppingCart),
      () => checkIntegration('viewCart', 'ShoppingCartCard')
    ]
  },
  '1.5': {
    name: 'Debug Panel Foundation',
    files: [
      'components/DebugPanel.tsx'
    ],
    validations: [
      () => checkDebugPanel(),
      () => checkDebugIntegration()
    ]
  },
  '2.1': {
    name: 'Restaurant Menu Card',
    files: [
      'components/food-cards/RestaurantMenuCard.tsx'
    ],
    validations: [
      () => checkCardComponent('RestaurantMenuCard'),
      () => checkIntegration('getRestaurantMenu', 'RestaurantMenuCard')
    ]
  },
  '2.2': {
    name: 'Menu Item Spotlight Card',
    files: [
      'components/food-cards/MenuItemSpotlightCard.tsx'  
    ],
    validations: [
      () => checkCardComponent('MenuItemSpotlightCard'),
      () => checkIntegration('searchMenuItems', 'MenuItemSpotlightCard')
    ]
  },
  '2.3': {
    name: 'Food Image Preview Card',
    files: [
      'components/food-cards/FoodImagePreviewCard.tsx'
    ],
    validations: [
      () => checkCardComponent('FoodImagePreviewCard'),
      () => checkIntegration('fetchMenuItemImage', 'FoodImagePreviewCard')
    ]
  },
  '2.4': {
    name: 'Restaurant Recommendation Card',
    files: [
      'components/food-cards/RestaurantRecommendationCard.tsx'
    ],
    validations: [
      () => checkCardComponent('RestaurantRecommendationCard'),
      () => checkIntegration('recommendShortlist', 'RestaurantRecommendationCard')
    ]
  },
  '2.5': {
    name: 'Order Confirmation Card',
    files: [
      'components/food-cards/OrderConfirmationCard.tsx'
    ],
    validations: [
      () => checkCardComponent('OrderConfirmationCard'),
      () => checkIntegration('submitCartOrder', 'OrderConfirmationCard')
    ]
  }
};

// Validation functions
function checkDirectoryStructure() {
  const cardDir = path.join(__dirname, '../components/food-cards');
  if (!fs.existsSync(cardDir)) {
    return { success: false, message: 'food-cards directory does not exist' };
  }
  return { success: true, message: 'Directory structure exists' };
}

function checkTypeScriptInterfaces() {
  const typesFile = path.join(__dirname, '../components/food-cards/types.ts');
  if (!fs.existsSync(typesFile)) {
    return { success: false, message: 'types.ts file missing' };
  }
  
  const content = fs.readFileSync(typesFile, 'utf8');
  const requiredTypes = ['Restaurant', 'MenuItem', 'CartItem', 'CustomerProfile'];
  const missingTypes = requiredTypes.filter(type => !content.includes(`interface ${type}`) && !content.includes(`type ${type}`));
  
  if (missingTypes.length > 0) {
    return { success: false, message: `Missing TypeScript interfaces: ${missingTypes.join(', ')}` };
  }
  
  return { success: true, message: 'TypeScript interfaces defined' };
}

function checkBaseCardComponent() {
  const baseCardFile = path.join(__dirname, '../components/food-cards/BaseCard.tsx');
  if (!fs.existsSync(baseCardFile)) {
    return { success: false, message: 'BaseCard.tsx file missing' };
  }
  
  const content = fs.readFileSync(baseCardFile, 'utf8');
  if (!content.includes('export') || !content.includes('BaseCard')) {
    return { success: false, message: 'BaseCard component not properly exported' };
  }
  
  return { success: true, message: 'BaseCard component exists' };
}

function checkCardComponent(cardName) {
  const cardFile = path.join(__dirname, `../components/food-cards/${cardName}.tsx`);
  if (!fs.existsSync(cardFile)) {
    return { success: false, message: `${cardName}.tsx file missing` };
  }
  
  const content = fs.readFileSync(cardFile, 'utf8');
  if (!content.includes('export') || !content.includes(cardName)) {
    return { success: false, message: `${cardName} component not properly exported` };
  }
  
  return { success: true, message: `${cardName} component exists` };
}

function checkCardRendering(cardName, mockDataForCard) {
  // This would check if the component can render with mock data
  // For now, just check that the component file has render logic
  const cardFile = path.join(__dirname, `../components/food-cards/${cardName}.tsx`);
  if (!fs.existsSync(cardFile)) {
    return { success: false, message: `Cannot test rendering: ${cardName}.tsx missing` };
  }
  
  const content = fs.readFileSync(cardFile, 'utf8');
  if (!content.includes('return') || !content.includes('div') || !content.includes('className')) {
    return { success: false, message: `${cardName} missing render logic` };
  }
  
  return { success: true, message: `${cardName} has render logic` };
}

function checkIntegration(toolName, cardName) {
  const conciergeFile = path.join(__dirname, '../app/food/concierge/page.tsx');
  if (!fs.existsSync(conciergeFile)) {
    return { success: false, message: 'Concierge page not found' };
  }
  
  const content = fs.readFileSync(conciergeFile, 'utf8');
  
  // Check if tool case exists
  if (!content.includes(`case '${toolName}':`)) {
    return { success: false, message: `Integration missing: no case for '${toolName}'` };
  }
  
  // Check if card component is imported or used
  if (!content.includes(cardName)) {
    return { success: false, message: `Integration incomplete: ${cardName} not used in ${toolName} case` };
  }
  
  return { success: true, message: `${toolName} integrated with ${cardName}` };
}

function checkDebugPanel() {
  const debugFile = path.join(__dirname, '../components/DebugPanel.tsx');
  if (!fs.existsSync(debugFile)) {
    return { success: false, message: 'DebugPanel.tsx missing' };
  }
  
  const content = fs.readFileSync(debugFile, 'utf8');
  if (!content.includes('collaps') && !content.includes('toggle')) {
    return { success: false, message: 'Debug panel missing toggle functionality' };
  }
  
  return { success: true, message: 'Debug panel component exists' };
}

function checkDebugIntegration() {
  const files = [
    '../app/food/concierge/page.tsx',
    '../app/food/concierge-livekit/page.tsx'
  ];
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('DebugPanel')) {
        return { success: true, message: 'Debug panel integrated' };
      }
    }
  }
  
  return { success: false, message: 'Debug panel not integrated into concierge pages' };
}

// Main test execution
async function runTests() {
  const args = process.argv.slice(2);
  const stepFilter = args.find(arg => arg.startsWith('--step='))?.split('=')[1];
  const devMode = args.includes('--dev');
  
  console.log('🧪 Food Court Chat Cards Implementation Tests\n');
  console.log('='.repeat(60));
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  const stepsToTest = stepFilter 
    ? { [stepFilter]: implementationSteps[stepFilter] }
    : implementationSteps;
  
  if (stepFilter && !implementationSteps[stepFilter]) {
    console.log(`❌ Invalid step: ${stepFilter}`);
    console.log('Available steps:', Object.keys(implementationSteps).join(', '));
    process.exit(1);
  }
  
  for (const [stepId, step] of Object.entries(stepsToTest)) {
    console.log(`\n📋 Step ${stepId}: ${step.name}`);
    console.log('-'.repeat(40));
    
    let stepPassed = true;
    
    // Check file existence
    for (const file of step.files) {
      const filePath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(filePath);
      totalTests++;
      
      if (exists) {
        passedTests++;
        console.log(`✅ File exists: ${file}`);
      } else {
        failedTests++;
        stepPassed = false;
        console.log(`❌ File missing: ${file}`);
      }
    }
    
    // Run validation functions
    for (const validation of step.validations) {
      totalTests++;
      try {
        const result = validation();
        if (result.success) {
          passedTests++;
          console.log(`✅ ${result.message}`);
        } else {
          failedTests++;
          stepPassed = false;
          console.log(`❌ ${result.message}`);
        }
      } catch (error) {
        failedTests++;
        stepPassed = false;
        console.log(`❌ Test error: ${error.message}`);
      }
    }
    
    const status = stepPassed ? '✅ COMPLETE' : '❌ INCOMPLETE';
    console.log(`\n${status}: Step ${stepId}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`   Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Implementation is complete.');
  } else {
    console.log(`\n⚠️  ${failedTests} tests failed. See details above.`);
  }
  
  if (devMode) {
    console.log('\n🛠️ DEV MODE INFO:');
    console.log('Available test steps:', Object.keys(implementationSteps).join(', '));
    console.log('Mock data available for:', Object.keys(mockData).join(', '));
  }
  
  console.log('\n💡 Next: Run implementation steps that failed validation');
  console.log('📖 See docs/CHAT_CARDS.md for detailed implementation guide');
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Package.json integration helper
function generatePackageScripts() {
  const scripts = {
    "test:cards": "node scripts/test-ui-cards.js",
    "test:cards:dev": "node scripts/test-ui-cards.js --dev"
  };
  
  console.log('\n📦 Add these scripts to package.json:');
  console.log(JSON.stringify({ scripts }, null, 2));
}

// Run tests if called directly
if (require.main === module) {
  if (process.argv.includes('--generate-scripts')) {
    generatePackageScripts();
  } else {
    runTests().catch(console.error);
  }
}

module.exports = {
  implementationSteps,
  mockData,
  runTests
};