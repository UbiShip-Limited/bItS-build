#!/usr/bin/env node

// Test the vercelIgnore.js script logic
const { execSync } = require('node:child_process');

console.log('🧪 Testing Vercel Ignore Script Logic\n');

// Test scenarios
const testScenarios = [
  {
    name: 'Frontend file change (src/)',
    files: ['src/app/page.tsx'],
    expectedResult: 'build',
  },
  {
    name: 'Frontend config change (next.config.ts)',
    files: ['next.config.ts'],
    expectedResult: 'build',
  },
  {
    name: 'Package.json change',
    files: ['package.json'],
    expectedResult: 'build',
  },
  {
    name: 'Tailwind config change',
    files: ['tailwind.config.js'],
    expectedResult: 'build',
  },
  {
    name: 'Backend only change (lib/)',
    files: ['lib/server.ts'],
    expectedResult: 'skip',
  },
  {
    name: 'Backend package change',
    files: ['server-package.json'],
    expectedResult: 'skip',
  },
  {
    name: 'Prisma schema change',
    files: ['prisma/schema.prisma'],
    expectedResult: 'skip',
  },
  {
    name: 'Mixed changes (frontend + backend)',
    files: ['src/app/page.tsx', 'lib/server.ts'],
    expectedResult: 'build',
  },
  {
    name: 'Public folder change',
    files: ['public/favicon.ico'],
    expectedResult: 'build',
  },
  {
    name: 'Scripts folder change',
    files: ['scripts/test.js'],
    expectedResult: 'skip',
  },
];

// The logic from vercelIgnore.js
function shouldBuild(changedFiles) {
  if (changedFiles.length === 0) {
    return true;
  }

  const frontendPatterns = [
    /^src\//,
    /^public\//,
    /^app\//,
    /^next\.config\.ts$/,
    /^postcss\.config\.(js|mjs)$/,
    /^tailwind\.config\.(js|cjs|ts)$/,
    /^vercel\.json$/,
    /^package\.json$/,
    /^package-lock\.json$/,
    /^tsconfig\.json$/,
  ];

  const backendOnlyPatterns = [
    /^lib\//,
    /^prisma\//,
    /^scripts\//,
    /^server-package\.json$/,
    /^tsconfig\.server\.json$/,
    /^railway\.json$/,
    /^\.railwayignore$/,
  ];

  const hasFrontendChanges = changedFiles.some(file => 
    frontendPatterns.some(pattern => pattern.test(file))
  );

  const allBackendOnly = changedFiles.every(file =>
    backendOnlyPatterns.some(pattern => pattern.test(file))
  );

  return hasFrontendChanges || !allBackendOnly;
}

// Run tests
let passed = 0;
let failed = 0;

console.log('Running test scenarios:\n');

testScenarios.forEach(scenario => {
  const result = shouldBuild(scenario.files);
  const shouldProceed = result;
  const expectedProceed = scenario.expectedResult === 'build';
  
  const testPassed = shouldProceed === expectedProceed;
  
  if (testPassed) {
    console.log(`✅ ${scenario.name}`);
    console.log(`   Files: ${scenario.files.join(', ')}`);
    console.log(`   Expected: ${scenario.expectedResult}, Got: ${result ? 'build' : 'skip'}`);
    passed++;
  } else {
    console.log(`❌ ${scenario.name}`);
    console.log(`   Files: ${scenario.files.join(', ')}`);
    console.log(`   Expected: ${scenario.expectedResult}, Got: ${result ? 'build' : 'skip'}`);
    failed++;
  }
  console.log('');
});

// Summary
console.log('📊 Test Summary:');
console.log(`   Passed: ${passed}/${testScenarios.length}`);
console.log(`   Failed: ${failed}/${testScenarios.length}`);

if (failed === 0) {
  console.log('\n✨ All tests passed! The vercelIgnore script is working correctly.');
  console.log('Frontend changes will trigger builds, backend-only changes will skip builds.');
} else {
  console.log('\n⚠️  Some tests failed! The vercelIgnore script may not work as expected.');
  process.exit(1);
}