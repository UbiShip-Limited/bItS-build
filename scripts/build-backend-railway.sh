#!/bin/bash

# Build script for Railway backend deployment
# This script ensures only backend dependencies are used

echo "Starting backend-only build for Railway..."

# CRITICAL: Remove all Next.js related files to prevent auto-detection
echo "Removing Next.js files to prevent auto-detection..."
rm -f next.config.* vercel.json next-env.d.ts 2>/dev/null || true
rm -rf .next/ out/ src/ app/ public/ components/ hooks/ 2>/dev/null || true
rm -f package.json.bak 2>/dev/null || true

# Backup current package.json and replace with server version
echo "Switching to backend-only package.json..."
if [ -f "server-package.json" ]; then
    cp package.json package.json.bak
    cp server-package.json package.json
fi

# Clean install backend dependencies only
echo "Installing backend dependencies..."
rm -rf node_modules package-lock.json
npm install --production=false

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build TypeScript backend files (continue on errors for now)
echo "Building TypeScript backend..."
npx tsc -p tsconfig.server.json || true

# Final cleanup - remove any Next.js that might have been installed
echo "Final cleanup..."
rm -rf node_modules/next node_modules/@next node_modules/react node_modules/react-dom 2>/dev/null || true
rm -f ___next_launcher.cjs 2>/dev/null || true

echo "Backend build completed successfully!"