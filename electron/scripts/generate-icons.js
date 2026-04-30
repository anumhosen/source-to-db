const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceIcon = path.join(__dirname, '..', 'assets', 'icon.png');
const outputDir = path.join(__dirname, '..', 'assets');

async function generateIcons() {
  // PNG sizes for different platforms
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated ${size}x${size} PNG`);
  }

  // Generate ICO for Windows (contains multiple sizes)
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoBuffers = [];

  for (const size of icoSizes) {
    const buffer = await sharp(sourceIcon).resize(size, size).png().toBuffer();
    icoBuffers.push({ size, buffer });
  }

  // Use to-ico to create .ico file
  const toIco = require('to-ico');
  const icoBuffer = await toIco(icoBuffers.map((b) => b.buffer));
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuffer);
  console.log('Generated icon.ico');

  // Generate ICNS for macOS (requires additional tools)
  console.log('For macOS .icns, use: iconutil -c icns icon.iconset');
}

generateIcons().catch(console.error);
