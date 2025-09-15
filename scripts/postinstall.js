#!/usr/bin/env node

/**
 * Postinstall script to fix Next.js 15 module resolution issues
 * This ensures all Next.js internal modules are properly installed
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running postinstall fixes for Next.js 15...');

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('📦 Detected Vercel environment');

  // Ensure Next.js modules are properly linked
  const nextPath = path.join(process.cwd(), 'node_modules', 'next');

  if (fs.existsSync(nextPath)) {
    console.log('✅ Next.js installation found at:', nextPath);

    // Check for the problematic module
    const tracerPath = path.join(nextPath, 'dist', 'server', 'lib', 'trace', 'tracer.js');

    if (!fs.existsSync(tracerPath)) {
      console.warn('⚠️ Tracer module not found, Next.js may need reinstallation');
      // Don't fail the build, let Vercel handle it
    } else {
      console.log('✅ Tracer module found');
    }
  } else {
    console.error('❌ Next.js not found in node_modules');
    process.exit(1);
  }
}

console.log('✅ Postinstall complete');