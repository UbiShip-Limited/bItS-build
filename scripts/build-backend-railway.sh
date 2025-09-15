#!/bin/bash

# Build script for Railway backend deployment
# This script ensures only backend dependencies are used

echo "Starting backend-only build for Railway..."

# CRITICAL: Remove all Next.js related files to prevent auto-detection
echo "Removing ALL frontend files..."
rm -f next.config.* vercel.json next-env.d.ts 2>/dev/null || true
rm -rf .next/ out/ src/ app/ public/ components/ hooks/ 2>/dev/null || true
rm -f package.json.bak package-lock.json 2>/dev/null || true

# Use server-package.json BEFORE installing anything
echo "Switching to backend-only package.json..."
if [ -f "server-package.json" ]; then
    echo "Using server-package.json for backend-only build"
    mv package.json frontend-package.json.bak 2>/dev/null || true
    cp server-package.json package.json
else
    echo "ERROR: server-package.json not found!"
    exit 1
fi

# Clean install backend dependencies only
echo "Installing backend dependencies from server-package.json..."
rm -rf node_modules
npm install --production=false

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build TypeScript backend files
echo "Building TypeScript backend..."
npx tsc -p tsconfig.server.json

# Final cleanup - ensure no frontend code remains
echo "Final cleanup..."
rm -rf node_modules/next node_modules/@next node_modules/react node_modules/react-dom 2>/dev/null || true
rm -f ___next_launcher.cjs 2>/dev/null || true
rm -rf src/ app/ public/ components/ hooks/ 2>/dev/null || true

echo "Backend build completed successfully!"
echo "Ready to run: node dist/lib/server.js"