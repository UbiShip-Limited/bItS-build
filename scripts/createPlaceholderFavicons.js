const sharp = require('sharp');
const path = require('path');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

async function createPlaceholderFavicons() {
  const outputDir = path.join(__dirname, '../public');
  
  // Create a simple logo with brand colors
  const svgLogo = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#080808"/>
      <text x="256" y="256" font-family="serif" font-size="300" fill="#C9A449" text-anchor="middle" dominant-baseline="middle">B</text>
    </svg>
  `;
  
  try {
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(Buffer.from(svgLogo))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated ${name} (${size}x${size})`);
    }
    
    console.log('All placeholder favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

createPlaceholderFavicons();