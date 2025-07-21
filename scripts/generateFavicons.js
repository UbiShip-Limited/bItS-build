const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

async function generateFavicons() {
  const sourceImage = path.join(__dirname, '../public/favicon.ico');
  const outputDir = path.join(__dirname, '../public');

  // First, let's convert the .ico to a PNG we can work with
  const tempPng = path.join(__dirname, 'temp.png');
  
  try {
    // Read the favicon.ico and convert to PNG
    await sharp(sourceImage)
      .resize(512, 512)
      .png()
      .toFile(tempPng);

    // Now generate all the different sizes
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(tempPng)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated ${name} (${size}x${size})`);
    }

    // Clean up temp file
    fs.unlinkSync(tempPng);
    
    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();