const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const inputFile = 'icon.png';
const outputDir = 'icons';
const cornerRadius = 0.22; // 圆角比例 (22% 边长作为半径)

async function convertIcons() {
  if (!fs.existsSync(inputFile)) {
    console.error('Error: icon.png not found in root directory');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 读取原始图片
  const inputBuffer = fs.readFileSync(inputFile);

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon${size}.png`);
    try {
      const pixelRadius = Math.round(size * cornerRadius);

      // 方法：创建圆角蒙版，然后与原图合成
      // 1. 先调整图片为指定大小（cover模式填充整个区域）
      const resized = await sharp(inputBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();

      // 2. 创建圆角蒙版 SVG
      const maskSvg = `
        <svg width="${size}" height="${size}">
          <defs>
            <mask id="roundMask">
              <rect width="${size}" height="${size}" fill="white"/>
              <rect x="0" y="0" width="${size}" height="${size}" rx="${pixelRadius}" ry="${pixelRadius}" fill="black"/>
            </mask>
          </defs>
          <rect width="${size}" height="${size}" fill="white" mask="url(#roundMask)"/>
        </svg>
      `;

      // 3. 正确的圆角蒙版：白色背景，圆角区域为黑色（用于dest-in混合）
      const roundMaskSvg = `
        <svg width="${size}" height="${size}">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${pixelRadius}" ry="${pixelRadius}" fill="white"/>
        </svg>
      `;

      // 4. 合成：先放图片，然后用圆角蒙版裁剪（使用 dest-in 混合模式）
      // dest-in 模式会保留目标图像（图片）与源图像（蒙版）重叠的部分
      const finalIcon = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([
        {
          input: resized,
          top: 0,
          left: 0
        },
        {
          input: Buffer.from(roundMaskSvg),
          blend: 'dest-in', // 只保留与白色蒙版重叠的部分
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

      // 保存最终图标
      fs.writeFileSync(outputFile, finalIcon);
      console.log(`✓ Created ${outputFile} (${size}x${size}, radius: ${pixelRadius}px)`);
    } catch (error) {
      console.error(`Error creating ${outputFile}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log('\nIcon conversion complete!');
}

convertIcons();
