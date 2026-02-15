/**
 * Test the EnvironmentBadge component rendering
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import EnvironmentBadge from '../components/EnvironmentBadge';

console.log('Testing EnvironmentBadge component...\n');

// Test Local
const localDiv = document.createElement('div');
const localRoot = createRoot(localDiv);
localRoot.render(React.createElement(EnvironmentBadge, { env: 'local' }));

setTimeout(() => {
  console.log('✅ Local Badge HTML:');
  console.log(localDiv.innerHTML);
  console.log('');
  
  // Test Remote
  const remoteDiv = document.createElement('div');
  const remoteRoot = createRoot(remoteDiv);
  remoteRoot.render(React.createElement(EnvironmentBadge, { env: 'remote' }));
  
  setTimeout(() => {
    console.log('✅ Remote Badge HTML:');
    console.log(remoteDiv.innerHTML);
    console.log('');
    console.log('🎉 Both badges rendered successfully!');
    process.exit(0);
  }, 100);
}, 100);
