#!/usr/bin/env node

/**
 * Fix Next.js missing modules on Vercel deployment
 * This script creates the missing invariant-error module that Next.js expects
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Next.js module issues for Vercel...');

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  console.log('✅ Not in Vercel environment, skipping fixes');
  process.exit(0);
}

try {
  // Find Next.js installation
  const nextPath = path.join(process.cwd(), 'node_modules', 'next');

  if (!fs.existsSync(nextPath)) {
    console.error('❌ Next.js not found in node_modules');
    process.exit(1);
  }

  // Create the missing invariant-error module
  const sharedLibPath = path.join(nextPath, 'dist', 'shared', 'lib');
  const invariantErrorPath = path.join(sharedLibPath, 'invariant-error.js');

  if (!fs.existsSync(invariantErrorPath)) {
    console.log('📝 Creating missing invariant-error module...');

    // Ensure directory exists
    fs.mkdirSync(sharedLibPath, { recursive: true });

    // Create a minimal invariant-error module
    const invariantErrorContent = `
// Auto-generated fix for missing module
class InvariantError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvariantError';
  }
}

function invariant(condition, message) {
  if (!condition) {
    throw new InvariantError(message || 'Invariant failed');
  }
}

module.exports = invariant;
module.exports.InvariantError = InvariantError;
`;

    fs.writeFileSync(invariantErrorPath, invariantErrorContent);
    console.log('✅ Created invariant-error.js');
  } else {
    console.log('✅ invariant-error.js already exists');
  }

  // Also check for tracer module
  const tracerPath = path.join(nextPath, 'dist', 'server', 'lib', 'trace', 'tracer.js');

  if (!fs.existsSync(tracerPath)) {
    console.log('📝 Creating missing tracer module...');

    // Ensure directory exists
    fs.mkdirSync(path.dirname(tracerPath), { recursive: true });

    // Create a minimal tracer module
    const tracerContent = `
// Auto-generated fix for missing module
const tracer = {
  trace: (name, fn) => fn(),
  wrap: (name, fn) => fn,
  startSpan: (name) => ({
    end: () => {},
    setAttribute: () => {},
    setStatus: () => {}
  })
};

module.exports = tracer;
`;

    fs.writeFileSync(tracerPath, tracerContent);
    console.log('✅ Created tracer.js');
  } else {
    console.log('✅ tracer.js already exists');
  }

  console.log('✅ Next.js module fixes completed successfully');

} catch (error) {
  console.error('❌ Error fixing Next.js modules:', error);
  // Don't fail the build, let it continue
  process.exit(0);
}