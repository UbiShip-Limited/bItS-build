#!/bin/bash

# Build script for Railway backend deployment
# This script ensures only backend dependencies are used

echo "Starting backend-only build for Railway..."

# Remove any existing Next.js dependencies from node_modules
echo "Cleaning Next.js dependencies..."
rm -rf node_modules/next node_modules/@next node_modules/react node_modules/react-dom 2>/dev/null || true

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build TypeScript backend files
echo "Building TypeScript backend..."
npx tsc -p tsconfig.server.json

echo "Backend build completed successfully!"