const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Brand colors
const GOLD = '#C9A449';
const OBSIDIAN = '#080808';

async function generateOGImages() {
  console.log('🎨 Generating Open Graph placeholder images...\n');
  console.log('⚠️  Note: These are placeholder images. For best results, replace with:');
  console.log('   - Professional photos of the studio');
  console.log('   - Kelly Miller\'s tattoo artwork');
  console.log('   - High-quality branded graphics\n');
  
  const imagesDir = path.join(__dirname, '../public/images');
  
  // Ensure images directory exists
  await fs.mkdir(imagesDir, { recursive: true });
  
  // Read the logo SVG
  const logoSvg = await fs.readFile(path.join(__dirname, '../public/logo.svg'), 'utf8');
  
  // Generate main OG image (1200x630) - landscape
  await generatePlaceholderOG(
    logoSvg,
    path.join(imagesDir, 'og-bowen-tattoo-main.jpg'),
    1200,
    630,
    'BOWEN ISLAND TATTOO',
    'Victorian Gothic meets Modern Minimalism\nMaster Artist Kelly Miller • Near Vancouver, BC'
  );
  
  // Generate square OG image (1200x1200)
  await generatePlaceholderOG(
    logoSvg,
    path.join(imagesDir, 'og-bowen-tattoo-square.jpg'),
    1200,
    1200,
    'BOWEN ISLAND\nTATTOO',
    'Premium Custom Tattoos\nPrivate Island Studio'
  );
  
  // Generate tattoo request OG image (1200x630)
  await generatePlaceholderOG(
    logoSvg,
    path.join(imagesDir, 'og-tattoo-request.jpg'),
    1200,
    630,
    'REQUEST YOUR\nCUSTOM TATTOO',
    'Book a Private Consultation\nVictorian Gothic • Wildlife Realism • Custom Designs'
  );
  
  // Generate startup image (750x1334) - portrait
  await generatePlaceholderOG(
    logoSvg,
    path.join(imagesDir, 'startup-image.png'),
    750,
    1334,
    'BOWEN ISLAND\nTATTOO',
    'Loading your experience...',
    true // PNG format
  );
  
  console.log('\n🎉 Placeholder Open Graph images generated!');
  console.log('\n📝 Important next steps:');
  console.log('1. Replace these placeholders with professional images');
  console.log('2. Include actual tattoo artwork (with permission)');
  console.log('3. Ensure images are under 200KB for optimal loading');
  console.log('4. Test social sharing on all platforms');
  
  // Create a README for the images directory
  await createImagesReadme(imagesDir);
}

async function generatePlaceholderOG(logoSvg, outputPath, width, height, title, subtitle, isPng = false) {
  // Create SVG with text overlay
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${OBSIDIAN}"/>
      
      <!-- Border -->
      <rect x="30" y="30" width="${width - 60}" height="${height - 60}" 
            fill="none" stroke="${GOLD}" stroke-width="3"/>
      
      <!-- Corner decorations -->
      <g stroke="${GOLD}" stroke-width="2" fill="none">
        <!-- Top-left -->
        <path d="M60,60 L100,60 M60,60 L60,100"/>
        <!-- Top-right -->
        <path d="M${width - 60},60 L${width - 100},60 M${width - 60},60 L${width - 60},100"/>
        <!-- Bottom-left -->
        <path d="M60,${height - 60} L100,${height - 60} M60,${height - 60} L60,${height - 100}"/>
        <!-- Bottom-right -->
        <path d="M${width - 60},${height - 60} L${width - 100},${height - 60} M${width - 60},${height - 60} L${width - 60},${height - 100}"/>
      </g>
      
      <!-- Logo (centered, scaled) -->
      <g transform="translate(${width/2 - 100}, ${height/2 - 150})">
        <g transform="scale(2.5)">
          ${logoSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
        </g>
      </g>
      
      <!-- Title -->
      <text x="${width/2}" y="${height/2 + 100}" 
            font-family="Arial, sans-serif" font-size="${width > 800 ? 48 : 36}" 
            font-weight="bold" fill="white" text-anchor="middle">
        ${title.split('\n').map((line, i) => 
          `<tspan x="${width/2}" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`
        ).join('')}
      </text>
      
      <!-- Subtitle -->
      <text x="${width/2}" y="${height/2 + 200}" 
            font-family="Arial, sans-serif" font-size="${width > 800 ? 24 : 18}" 
            fill="${GOLD}" text-anchor="middle">
        ${subtitle.split('\n').map((line, i) => 
          `<tspan x="${width/2}" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`
        ).join('')}
      </text>
      
      <!-- Website (bottom) -->
      <text x="${width/2}" y="${height - 50}" 
            font-family="Arial, sans-serif" font-size="20" 
            fill="${GOLD}" text-anchor="middle">
        bowenislandtattoo.com
      </text>
    </svg>
  `;
  
  // Convert SVG to image
  const buffer = await sharp(Buffer.from(svg))
    .resize(width, height)
    [isPng ? 'png' : 'jpeg']({ quality: 90 })
    .toBuffer();
  
  await fs.writeFile(outputPath, buffer);
  console.log(`✅ Generated ${path.basename(outputPath)}`);
}

async function createImagesReadme(imagesDir) {
  const readmeContent = `# Open Graph Images

## Current Status
These are **placeholder images** generated programmatically. They should be replaced with professional images for optimal SEO and social media engagement.

## Image Specifications

### og-bowen-tattoo-main.jpg (1200x630px)
- **Purpose**: Main social sharing image for homepage
- **Current**: Placeholder with logo and text
- **Recommended**: Professional photo of the studio or Kelly Miller's best tattoo work

### og-bowen-tattoo-square.jpg (1200x1200px)
- **Purpose**: Square format for Instagram/Facebook
- **Current**: Placeholder with centered logo
- **Recommended**: Portfolio collage or signature tattoo piece

### og-tattoo-request.jpg (1200x630px)
- **Purpose**: Tattoo request page social preview
- **Current**: Placeholder with request-focused text
- **Recommended**: In-progress tattoo shot or consultation photo

### startup-image.png (750x1334px)
- **Purpose**: Apple PWA startup screen
- **Current**: Placeholder with branding
- **Recommended**: Artistic studio shot or branded splash screen

## Replacement Guidelines

1. **Quality**: Use high-resolution images (retina-ready)
2. **File Size**: Optimize to under 200KB each
3. **Branding**: Include Bowen Island Tattoo branding
4. **Colors**: Use brand colors - Gold (#C9A449) and Obsidian (#080808)
5. **Text**: Ensure any text is legible at small sizes
6. **Rights**: Only use images you have rights to (own work or licensed)

## Testing
After replacing images, test on:
- Facebook Sharing Debugger
- Twitter Card Validator
- LinkedIn Post Inspector
- WhatsApp/iMessage previews

Generated: ${new Date().toISOString()}
`;
  
  await fs.writeFile(path.join(imagesDir, 'README.md'), readmeContent);
}

// Run the generator
generateOGImages().catch(console.error);