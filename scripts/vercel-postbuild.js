#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running Vercel post-build script...');

// Check if we're running on Vercel
if (process.env.VERCEL) {
  console.log('✅ Detected Vercel environment');

  // Check for Next.js trace module
  const tracerPath = path.join(process.cwd(), 'node_modules/next/dist/server/lib/trace/tracer.js');

  if (fs.existsSync(tracerPath)) {
    console.log('✅ Next.js tracer module found at:', tracerPath);
  } else {
    console.error('❌ Next.js tracer module NOT found!');
    console.log('📦 Attempting to locate Next.js installation...');

    // Try to find Next.js in various locations
    const possiblePaths = [
      'node_modules/next',
      '.next/server/chunks/node_modules/next',
      '../node_modules/next',
    ];

    for (const testPath of possiblePaths) {
      const fullPath = path.join(process.cwd(), testPath);
      if (fs.existsSync(fullPath)) {
        console.log(`📦 Found Next.js at: ${fullPath}`);
        break;
      }
    }
  }

  // Verify build output
  const buildOutputPath = path.join(process.cwd(), '.next');
  if (fs.existsSync(buildOutputPath)) {
    console.log('✅ Build output directory exists');

    // Check for server directory
    const serverPath = path.join(buildOutputPath, 'server');
    if (fs.existsSync(serverPath)) {
      console.log('✅ Server directory exists');

      // List server chunks
      const chunksPath = path.join(serverPath, 'chunks');
      if (fs.existsSync(chunksPath)) {
        const chunks = fs.readdirSync(chunksPath);
        console.log(`✅ Found ${chunks.length} server chunks`);
      }
    }
  }

  // Create a marker file to indicate post-build ran
  fs.writeFileSync(
    path.join(process.cwd(), '.vercel-postbuild-complete'),
    new Date().toISOString()
  );

  console.log('✅ Vercel post-build script completed');
} else {
  console.log('ℹ️  Not running on Vercel, skipping post-build script');
}