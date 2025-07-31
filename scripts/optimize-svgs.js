#!/usr/bin/env node

/**
 * Script to optimize large SVG files and upload them to Cloudinary
 * This will convert large SVGs to PNG/WebP formats for better performance
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SVG_FILES = [
  {
    input: 'public/images/cougar.svg',
    publicId: 'site_content/cougar',
    sizes: [
      { width: 800, suffix: '_mobile' },
      { width: 1200, suffix: '_tablet' },
      { width: 1920, suffix: '_desktop' },
      { width: 2400, suffix: '_hd' }
    ]
  },
  {
    input: 'public/safari-pinned-tab.svg',
    publicId: 'site_content/safari-pinned-tab',
    sizes: [
      { width: 512, suffix: '' } // Single size for favicon
    ]
  },
  {
    input: 'public/images/bowen-logo.svg',
    publicId: 'site_content/bowen-logo',
    sizes: [
      { width: 200, suffix: '_small' },
      { width: 400, suffix: '_medium' },
      { width: 600, suffix: '_large' }
    ]
  }
];

async function optimizeSVG(config) {
  console.log(`\n🔄 Processing ${config.input}...`);
  
  try {
    // Read the SVG file
    const svgBuffer = await fs.readFile(path.join(__dirname, '..', config.input));
    
    for (const size of config.sizes) {
      const outputPublicId = `${config.publicId}${size.suffix}`;
      
      console.log(`  📐 Creating ${size.width}px version...`);
      
      // Convert SVG to PNG using sharp
      const pngBuffer = await sharp(svgBuffer)
        .resize(size.width)
        .png({ quality: 90, compressionLevel: 9 })
        .toBuffer();
      
      // Upload to Cloudinary
      console.log(`  ☁️  Uploading to Cloudinary as ${outputPublicId}...`);
      
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            public_id: outputPublicId,
            folder: '',
            resource_type: 'image',
            format: 'png',
            tags: ['optimized-svg', 'site-content'],
            context: {
              original_file: config.input,
              optimization_date: new Date().toISOString()
            },
            // Apply automatic optimizations
            transformation: [
              { quality: 'auto:best' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(pngBuffer);
      });
      
      console.log(`  ✅ Uploaded: ${uploadResult.secure_url}`);
      
      // Also create a WebP version
      console.log(`  🖼️  Creating WebP version...`);
      const webpBuffer = await sharp(svgBuffer)
        .resize(size.width)
        .webp({ quality: 85 })
        .toBuffer();
      
      const webpResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            public_id: `${outputPublicId}_webp`,
            folder: '',
            resource_type: 'image',
            format: 'webp',
            tags: ['optimized-svg', 'site-content', 'webp'],
            context: {
              original_file: config.input,
              optimization_date: new Date().toISOString()
            }
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(webpBuffer);
      });
      
      console.log(`  ✅ WebP uploaded: ${webpResult.secure_url}`);
    }
    
    // Get file size for comparison
    const stats = await fs.stat(path.join(__dirname, '..', config.input));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  📊 Original SVG size: ${sizeMB}MB`);
    
  } catch (error) {
    console.error(`❌ Error processing ${config.input}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting SVG optimization and upload to Cloudinary...\n');
  
  // Check if sharp is installed
  try {
    require.resolve('sharp');
  } catch (e) {
    console.error('❌ Sharp is not installed. Please run: npm install sharp');
    process.exit(1);
  }
  
  // Check Cloudinary credentials
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.error('❌ Cloudinary credentials not found in .env file');
    process.exit(1);
  }
  
  // Process each SVG file
  for (const config of SVG_FILES) {
    await optimizeSVG(config);
  }
  
  console.log('\n✨ SVG optimization complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your components to use the Cloudinary URLs instead of local SVGs');
  console.log('2. Use responsive images with srcSet for different screen sizes');
  console.log('3. Consider removing the original SVG files from /public to reduce bundle size');
}

// Run the script
main().catch(console.error);