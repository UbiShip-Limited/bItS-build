#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Deployment Configuration\n');

// Check package.json versions match
const mainPackage = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const serverPackage = JSON.parse(fs.readFileSync(path.join(__dirname, '../server-package.json'), 'utf8'));

console.log('📦 Package Versions:');
console.log(`   Main: ${mainPackage.version}`);
console.log(`   Server: ${serverPackage.version}`);

// Check Prisma versions
console.log('\n🔷 Prisma Versions:');
console.log(`   Main @prisma/client: ${mainPackage.devDependencies['@prisma/client']}`);
console.log(`   Main prisma: ${mainPackage.devDependencies['prisma']}`);
console.log(`   Server @prisma/client: ${serverPackage.dependencies['@prisma/client']}`);
console.log(`   Server prisma: ${serverPackage.devDependencies['prisma']}`);

const prismaMatch = 
  mainPackage.devDependencies['@prisma/client'] === serverPackage.dependencies['@prisma/client'] &&
  mainPackage.devDependencies['prisma'] === serverPackage.devDependencies['prisma'];

console.log(`   ✅ Versions match: ${prismaMatch ? 'Yes' : 'No'}`);

// Check Railway config
console.log('\n🚂 Railway Configuration:');
const railwayConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../railway.json'), 'utf8'));
console.log(`   Build Command: ${railwayConfig.build.buildCommand}`);
console.log(`   Start Command: ${railwayConfig.deploy.startCommand}`);
console.log(`   Health Check: ${railwayConfig.deploy.healthcheckPath}`);

// Check Vercel config
console.log('\n▲ Vercel Configuration:');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
console.log(`   Build Command: ${vercelConfig.buildCommand}`);
console.log(`   Install Command: ${vercelConfig.installCommand}`);
console.log(`   Framework: ${vercelConfig.framework}`);
console.log(`   Ignore Command: ${vercelConfig.ignoreCommand}`);

// Check TypeScript configs
console.log('\n📝 TypeScript Configuration:');
const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../tsconfig.json'), 'utf8'));
const tsServerConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../tsconfig.server.json'), 'utf8'));
console.log(`   Frontend Module: ${tsConfig.compilerOptions.module}`);
console.log(`   Backend Module: ${tsServerConfig.compilerOptions.module}`);
console.log(`   Frontend Target: ${tsConfig.compilerOptions.target}`);
console.log(`   Backend Target: ${tsServerConfig.compilerOptions.target}`);

// Check .railwayignore
console.log('\n🚫 Railway Ignore:');
const railwayIgnore = fs.readFileSync(path.join(__dirname, '../.railwayignore'), 'utf8');
const ignoredItems = railwayIgnore.split('\n').filter(line => line.trim() && !line.startsWith('#'));
console.log(`   Ignoring ${ignoredItems.length} patterns`);
console.log(`   Key ignores: src/, .next/, public/, next.config.ts`);

// Verify build outputs exist
console.log('\n📁 Build Outputs:');
const distExists = fs.existsSync(path.join(__dirname, '../dist'));
const distServerExists = fs.existsSync(path.join(__dirname, '../dist/server.js'));
console.log(`   dist/ folder: ${distExists ? '✅ Exists' : '❌ Missing'}`);
console.log(`   dist/server.js: ${distServerExists ? '✅ Exists' : '❌ Missing'}`);

// Summary
console.log('\n📊 Summary:');
const issues = [];

if (!prismaMatch) {
  issues.push('Prisma versions mismatch between main and server packages');
}

if (!distServerExists) {
  issues.push('Backend build output missing (run npm run build:server)');
}

if (issues.length === 0) {
  console.log('   ✅ All deployment configurations look good!');
} else {
  console.log('   ⚠️  Issues found:');
  issues.forEach(issue => console.log(`      - ${issue}`));
}

console.log('\n✨ Configuration verification complete!');