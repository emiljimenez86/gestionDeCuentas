// This script requires Node.js and the 'sharp' package
// Run: npm init -y && npm install sharp
// Then run: node generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const iconsDir = path.join(__dirname, 'icons');
const screenshotsDir = path.join(__dirname, 'screenshots');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Icon sizes needed
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Process the image
async function generateIcons() {
    try {
        const inputImage = path.join(__dirname, 'image', 'Foto.png');
        
        // Generate icons
        for (const size of iconSizes) {
            await sharp(inputImage)
                .resize(size, size)
                .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
            console.log(`Generated icon-${size}x${size}.png`);
        }
        
        // Generate a splash screen (using the largest icon as base)
        await sharp(inputImage)
            .resize(1080, 1920, {
                fit: 'contain',
                background: { r: 79, g: 70, b: 229, alpha: 1 } // indigo-600
            })
            .toFile(path.join(screenshotsDir, 'screenshot-1.png'));
        
        console.log('Icons and splash screen generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();
