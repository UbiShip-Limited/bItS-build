import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
const svgPath = path.join(publicDir, 'images', 'bowen-logo.svg');

async function generateFavicons() {
  try {
    console.log('🎨 Starting favicon generation from bowen-logo.svg...');
    
    // Read the SVG file
    const svgBuffer = await fs.readFile(svgPath);
    
    // Generate favicon.ico (multi-resolution)
    console.log('📝 Generating favicon.ico...');
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    // Generate standard favicon sizes
    const sizes = [
      { size: 16, name: 'favicon-16x16.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 180, name: 'apple-touch-icon.png' },
      { size: 192, name: 'android-chrome-192x192.png' },
      { size: 512, name: 'android-chrome-512x512.png' },
    ];
    
    for (const { size, name } of sizes) {
      console.log(`📝 Generating ${name}...`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
    }
    
    // Copy SVG as safari-pinned-tab.svg
    console.log('📝 Copying SVG for Safari pinned tab...');
    await fs.copyFile(svgPath, path.join(publicDir, 'safari-pinned-tab.svg'));
    
    // Update site.webmanifest
    console.log('📝 Updating site.webmanifest...');
    const manifest = {
      name: "Bowen Island Tattoo Shop",
      short_name: "BITS",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: "#080808",
      background_color: "#080808",
      display: "standalone"
    };
    
    await fs.writeFile(
      path.join(publicDir, 'site.webmanifest'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Update browserconfig.xml
    console.log('📝 Updating browserconfig.xml...');
    const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/android-chrome-192x192.png"/>
            <TileColor>#080808</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
    
    await fs.writeFile(
      path.join(publicDir, 'browserconfig.xml'),
      browserConfig
    );
    
    console.log('✅ All favicons generated successfully!');
    console.log('📁 Files created in /public directory');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();