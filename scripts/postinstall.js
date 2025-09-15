#!/usr/bin/env node

/**
 * Postinstall script to ensure proper setup after npm install
 * - Generates Prisma client
 * - Fixes Next.js 15 module resolution issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Running postinstall setup...');

// 1. Generate Prisma Client
try {
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  // Don't fail the entire install if Prisma generation fails
}

// 2. Check if we're in a Vercel environment and fix Next.js if needed
const isVercel = process.env.VERCEL === '1';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

// Skip Next.js checks for Railway backend deployment
if (isRailway) {
  console.log('🚂 Railway backend deployment detected, skipping Next.js checks');
} else if (isVercel) {
  console.log('📦 Detected Vercel environment');

  // Ensure Next.js modules are properly installed
  const nextPath = path.join(process.cwd(), 'node_modules', 'next');

  if (fs.existsSync(nextPath)) {
    console.log('✅ Next.js installation found');

    // Check for common problematic modules
    const requiredModules = [
      'dist/server/lib/trace/tracer.js',
      'dist/shared/lib/invariant-error.js',
      'dist/server/app-render/work-unit-async-storage.external.js'
    ];

    let missingModules = [];
    for (const modulePath of requiredModules) {
      const fullPath = path.join(nextPath, modulePath);
      if (!fs.existsSync(fullPath)) {
        missingModules.push(modulePath);
      }
    }

    if (missingModules.length > 0) {
      console.warn('⚠️ Some Next.js modules appear to be missing:', missingModules);
      console.log('🔄 Attempting to fix by clearing cache...');

      // Try to fix by removing and reinstalling Next.js
      try {
        execSync('npm cache clean --force', { stdio: 'inherit' });
        console.log('✅ Cache cleared');
      } catch (error) {
        console.warn('⚠️ Could not clear npm cache:', error.message);
      }
    } else {
      console.log('✅ All required Next.js modules found');
    }
  } else {
    console.error('❌ Next.js not found in node_modules');
    // Don't exit with error as this might be intentional for backend-only deployments
  }
}

console.log('✅ Postinstall complete');