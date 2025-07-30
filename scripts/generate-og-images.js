const { createCanvas, registerFont } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

// Brand colors
const GOLD = '#C9A449';
const OBSIDIAN = '#080808';
const WHITE = '#FFFFFF';

async function generateOGImages() {
  console.log('🎨 Generating Open Graph images...\n');
  
  const imagesDir = path.join(__dirname, '../public/images');
  
  // Ensure images directory exists
  await fs.mkdir(imagesDir, { recursive: true });
  
  // Generate main OG image (1200x630)
  await generateMainOGImage(path.join(imagesDir, 'og-bowen-tattoo-main.jpg'));
  
  // Generate square OG image (1200x1200)
  await generateSquareOGImage(path.join(imagesDir, 'og-bowen-tattoo-square.jpg'));
  
  // Generate tattoo request OG image (1200x630)
  await generateTattooRequestOGImage(path.join(imagesDir, 'og-tattoo-request.jpg'));
  
  // Generate startup image (750x1334 - iPhone 8 size)
  await generateStartupImage(path.join(imagesDir, 'startup-image.png'));
  
  console.log('\n🎉 All Open Graph images generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Review generated images in /public/images/');
  console.log('2. Replace with professional photos if available');
  console.log('3. Test social sharing on Facebook, Twitter, LinkedIn');
}

async function generateMainOGImage(outputPath) {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = OBSIDIAN;
  ctx.fillRect(0, 0, 1200, 630);
  
  // Gold accent border
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 570);
  
  // Victorian-style corner decorations
  drawCornerDecorations(ctx, 1200, 630);
  
  // Main text
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BOWEN ISLAND', 600, 200);
  ctx.fillText('TATTOO', 600, 280);
  
  // Tagline
  ctx.fillStyle = GOLD;
  ctx.font = '36px Arial';
  ctx.fillText('Victorian Gothic meets Modern Minimalism', 600, 350);
  
  // Artist info
  ctx.fillStyle = WHITE;
  ctx.font = '28px Arial';
  ctx.fillText('Master Artist Kelly Miller', 600, 420);
  
  // Location
  ctx.font = '24px Arial';
  ctx.fillText('Private Studio • Near Vancouver, BC • By Appointment', 600, 480);
  
  // Website
  ctx.fillStyle = GOLD;
  ctx.font = '20px Arial';
  ctx.fillText('bowenislandtattoo.com', 600, 550);
  
  // Save image
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  await fs.writeFile(outputPath, buffer);
  console.log('✅ Generated og-bowen-tattoo-main.jpg');
}

async function generateSquareOGImage(outputPath) {
  const canvas = createCanvas(1200, 1200);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = OBSIDIAN;
  ctx.fillRect(0, 0, 1200, 1200);
  
  // Centered gold circle
  ctx.beginPath();
  ctx.arc(600, 600, 400, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Inner circle
  ctx.beginPath();
  ctx.arc(600, 600, 380, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Monogram B & T
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 280px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', 520, 600);
  ctx.fillText('T', 680, 600);
  
  // Studio name around the circle (top)
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = GOLD;
  ctx.fillText('BOWEN ISLAND TATTOO', 600, 150);
  
  // Tagline (bottom)
  ctx.font = '36px Arial';
  ctx.fillStyle = WHITE;
  ctx.fillText('Premium Custom Tattoos', 600, 1000);
  ctx.fillText('Near Vancouver, BC', 600, 1050);
  
  // Save image
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  await fs.writeFile(outputPath, buffer);
  console.log('✅ Generated og-bowen-tattoo-square.jpg');
}

async function generateTattooRequestOGImage(outputPath) {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, OBSIDIAN);
  gradient.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);
  
  // Decorative frame
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.strokeRect(50, 50, 1100, 530);
  ctx.setLineDash([]);
  
  // Title
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('REQUEST YOUR', 600, 180);
  ctx.fillText('CUSTOM TATTOO', 600, 260);
  
  // Subtitle
  ctx.fillStyle = WHITE;
  ctx.font = '32px Arial';
  ctx.fillText('Book a Private Consultation', 600, 340);
  
  // Features
  ctx.font = '24px Arial';
  ctx.fillText('✦ Personal Design Process ✦ Victorian Gothic Specialist ✦', 600, 420);
  ctx.fillText('✦ Wildlife Realism ✦ Private Island Studio ✦', 600, 460);
  
  // CTA
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 28px Arial';
  ctx.fillText('bowenislandtattoo.com/tattooRequest', 600, 540);
  
  // Save image
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  await fs.writeFile(outputPath, buffer);
  console.log('✅ Generated og-tattoo-request.jpg');
}

async function generateStartupImage(outputPath) {
  const canvas = createCanvas(750, 1334);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = OBSIDIAN;
  ctx.fillRect(0, 0, 750, 1334);
  
  // Gold accent lines
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.lineTo(750, 200);
  ctx.moveTo(0, 1134);
  ctx.lineTo(750, 1134);
  ctx.stroke();
  
  // Logo area (centered)
  ctx.beginPath();
  ctx.arc(375, 667, 150, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // B & T monogram
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', 325, 667);
  ctx.fillText('T', 425, 667);
  
  // Studio name
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 48px Arial';
  ctx.fillText('BOWEN ISLAND', 375, 300);
  ctx.fillText('TATTOO', 375, 360);
  
  // Tagline
  ctx.fillStyle = WHITE;
  ctx.font = '24px Arial';
  ctx.fillText('Victorian Gothic meets', 375, 900);
  ctx.fillText('Modern Minimalism', 375, 940);
  
  // Loading text
  ctx.fillStyle = GOLD;
  ctx.font = '18px Arial';
  ctx.fillText('LOADING YOUR EXPERIENCE...', 375, 1050);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
  console.log('✅ Generated startup-image.png');
}

function drawCornerDecorations(ctx, width, height) {
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.lineTo(100, 60);
  ctx.moveTo(60, 60);
  ctx.lineTo(60, 100);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(width - 60, 60);
  ctx.lineTo(width - 100, 60);
  ctx.moveTo(width - 60, 60);
  ctx.lineTo(width - 60, 100);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(60, height - 60);
  ctx.lineTo(100, height - 60);
  ctx.moveTo(60, height - 60);
  ctx.lineTo(60, height - 100);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(width - 60, height - 60);
  ctx.lineTo(width - 100, height - 60);
  ctx.moveTo(width - 60, height - 60);
  ctx.lineTo(width - 60, height - 100);
  ctx.stroke();
}

// Check if canvas is installed and run
(async () => {
  try {
    require.resolve('canvas');
    await generateOGImages();
  } catch (e) {
    console.log('📦 Installing canvas for image generation...');
    console.log('This may take a moment as it compiles native dependencies...\n');
    const { execSync } = require('child_process');
    execSync('npm install canvas', { stdio: 'inherit' });
    await generateOGImages();
  }
})();