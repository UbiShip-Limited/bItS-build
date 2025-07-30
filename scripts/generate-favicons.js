const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateFavicons() {
  const inputSvg = path.join(__dirname, '../public/logo.svg');
  const publicDir = path.join(__dirname, '../public');
  
  // Read the SVG file
  const svgBuffer = await fs.readFile(inputSvg);
  
  // Define favicon sizes and their output paths
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' },
  ];
  
  console.log('🎨 Generating favicon files from logo.svg...');
  
  try {
    // Generate PNG favicons in various sizes
    for (const { size, name } of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }
    
    // Generate favicon.ico (multi-resolution)
    // For ICO, we'll use the 32x32 PNG as a base
    const favicon32 = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer();
    
    await fs.writeFile(path.join(publicDir, 'favicon.ico'), favicon32);
    console.log('✅ Generated favicon.ico');
    
    // Copy the original SVG as safari-pinned-tab.svg (already exists)
    console.log('✅ safari-pinned-tab.svg already exists');
    
    // Update the app favicon in src/app
    const appFavicon = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer();
    
    await fs.writeFile(path.join(__dirname, '../src/app/favicon.ico'), appFavicon);
    console.log('✅ Updated src/app/favicon.ico');
    
    console.log('\n🎉 All favicon files generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update layout.tsx to use the new favicon files');
    console.log('2. Update site.webmanifest with the new icon paths');
    console.log('3. Test favicons in different browsers');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

// Check if sharp is installed
(async () => {
  try {
    require.resolve('sharp');
    generateFavicons();
  } catch (e) {
    console.log('📦 Installing sharp for image processing...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    generateFavicons();
  }
})();