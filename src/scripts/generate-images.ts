import { Jimp } from 'jimp';
import * as path from 'path';

async function generateAssets() {
  console.log('Starting PWA asset generation with Jimp...');

  // Define Colors
  const darkGreen = 0x064e3bff; // #064e3b (deep forest green)
  const emerald = 0x10b981ff;   // #10b981 (primary theme emerald)
  const mint = 0x34d399ff;      // #34d399 (mint accent)
  const white = 0xffffffff;     // #ffffff
  const grayLight = 0xf3f4f6ff; // #f3f4f6 (cool gray bg)

  // 1. Generate 192x192 Icon
  console.log('Generating app_icon_192.png...');
  const icon192 = new Jimp({ width: 192, height: 192, color: darkGreen });
  
  // Draw inner rounded square / accent
  for (let x = 16; x < 176; x++) {
    for (let y = 16; y < 176; y++) {
      // Draw a nice rounded box
      const isCorner = 
        (x < 32 && y < 32 && Math.hypot(32-x, 32-y) > 16) ||
        (x > 160 && y < 32 && Math.hypot(x-160, 32-y) > 16) ||
        (x < 32 && y > 160 && Math.hypot(32-x, y-160) > 16) ||
        (x > 160 && y > 160 && Math.hypot(x-160, y-160) > 16);
      if (!isCorner) {
        icon192.setPixelColor(emerald, x, y);
      }
    }
  }

  // Draw stylized letter "A" in the center (pixel-by-pixel for ultimate robustness)
  // Let's draw an elegant 'A' spanning from y=48 to y=144, centered horizontally (x=96)
  for (let y = 48; y <= 144; y++) {
    // Left leg of A: x goes from 96 to 64
    const leftX = Math.round(96 - (y - 48) * (32 / 96));
    // Right leg of A: x goes from 96 to 128
    const rightX = Math.round(96 + (y - 48) * (32 / 96));

    // Draw thick lines (thickness = 10 pixels)
    for (let dx = -6; dx <= 6; dx++) {
      icon192.setPixelColor(white, leftX + dx, y);
      icon192.setPixelColor(white, rightX + dx, y);
    }
  }
  // Draw the bar of 'A' at y=100
  for (let x = 78; x <= 114; x++) {
    for (let dy = -4; dy <= 4; dy++) {
      icon192.setPixelColor(white, x, 100 + dy);
    }
  }

  await icon192.write(path.join('public', 'app_icon_192.png') as any);
  console.log('Saved app_icon_192.png');


  // 2. Generate 512x512 Icon
  console.log('Generating app_icon_512.png...');
  const icon512 = new Jimp({ width: 512, height: 512, color: darkGreen });
  
  // Draw inner rounded square
  for (let x = 40; x < 472; x++) {
    for (let y = 40; y < 472; y++) {
      const isCorner = 
        (x < 80 && y < 80 && Math.hypot(80-x, 80-y) > 40) ||
        (x > 432 && y < 80 && Math.hypot(x-432, 80-y) > 40) ||
        (x < 80 && y > 432 && Math.hypot(80-x, y-432) > 40) ||
        (x > 432 && y > 432 && Math.hypot(x-432, y-432) > 40);
      if (!isCorner) {
        icon512.setPixelColor(emerald, x, y);
      }
    }
  }

  // Draw stylized letter "A"
  for (let y = 120; y <= 392; y++) {
    const leftX = Math.round(256 - (y - 120) * (96 / 272));
    const rightX = Math.round(256 + (y - 120) * (96 / 272));

    for (let dx = -16; dx <= 16; dx++) {
      icon512.setPixelColor(white, leftX + dx, y);
      icon512.setPixelColor(white, rightX + dx, y);
    }
  }
  // Draw the bar of 'A' at y=270
  for (let x = 200; x <= 312; x++) {
    for (let dy = -10; dy <= 10; dy++) {
      icon512.setPixelColor(white, x, 270 + dy);
    }
  }

  await icon512.write(path.join('public', 'app_icon_512.png') as any);
  console.log('Saved app_icon_512.png');


  // 3. Generate 192x192 Maskable Icon
  console.log('Generating app_icon_maskable.png (192x192 version)...');
  // Maskable icon must have a safe zone in the center (minimum 40% margin)
  // Let's make the background simple darkGreen, with a centered emerald circular seal and a white 'A'
  const iconMaskable = new Jimp({ width: 192, height: 192, color: darkGreen });
  
  // Draw large circular seal (completely inside 80% safe zone radius 76px)
  const centerX = 96;
  const centerY = 96;
  for (let x = 0; x < 192; x++) {
    for (let y = 0; y < 192; y++) {
      if (Math.hypot(x - centerX, y - centerY) <= 64) {
        iconMaskable.setPixelColor(emerald, x, y);
      }
    }
  }

  // Draw stylized letter "A" in the center (y=60 to y=132)
  for (let y = 60; y <= 132; y++) {
    const leftX = Math.round(96 - (y - 60) * (24 / 72));
    const rightX = Math.round(96 + (y - 60) * (24 / 72));

    for (let dx = -5; dx <= 5; dx++) {
      iconMaskable.setPixelColor(white, leftX + dx, y);
      iconMaskable.setPixelColor(white, rightX + dx, y);
    }
  }
  // Draw the bar of 'A' at y=100
  for (let x = 82; x <= 110; x++) {
    for (let dy = -3; dy <= 3; dy++) {
      iconMaskable.setPixelColor(white, x, 100 + dy);
    }
  }

  await iconMaskable.write(path.join('public', 'app_icon_maskable.png') as any);
  console.log('Saved app_icon_maskable.png');


  // 3b. Generate 512x512 Maskable Icon
  console.log('Generating app_icon_maskable_512.png (512x512 version)...');
  const iconMaskable512 = new Jimp({ width: 512, height: 512, color: darkGreen });
  
  // Draw large circular seal (completely inside 80% safe zone radius 170px)
  const centerX512 = 256;
  const centerY512 = 256;
  for (let x = 0; x < 512; x++) {
    for (let y = 0; y < 512; y++) {
      if (Math.hypot(x - centerX512, y - centerY512) <= 170) {
        iconMaskable512.setPixelColor(emerald, x, y);
      }
    }
  }

  // Draw stylized letter "A" in the center (y=160 to y=352)
  for (let y = 160; y <= 352; y++) {
    const leftX = Math.round(256 - (y - 160) * (64 / 192));
    const rightX = Math.round(256 + (y - 160) * (64 / 192));

    for (let dx = -13; dx <= 13; dx++) {
      iconMaskable512.setPixelColor(white, leftX + dx, y);
      iconMaskable512.setPixelColor(white, rightX + dx, y);
    }
  }
  // Draw the bar of 'A' at y=270
  for (let x = 218; x <= 294; x++) {
    for (let dy = -8; dy <= 8; dy++) {
      iconMaskable512.setPixelColor(white, x, 270 + dy);
    }
  }

  await iconMaskable512.write(path.join('public', 'app_icon_maskable_512.png') as any);
  console.log('Saved app_icon_maskable_512.png');


  // 4. Generate Desktop Screenshot (1280x720)
  console.log('Generating screenshot_desktop.png (1280x720)...');
  const desktop = new Jimp({ width: 1280, height: 720, color: grayLight });

  // Draw top browser / app header bar (emerald)
  for (let x = 0; x < 1280; x++) {
    for (let y = 0; y < 80; y++) {
      desktop.setPixelColor(darkGreen, x, y);
    }
  }

  // Draw logo placeholder inside top header
  for (let x = 40; x < 64; x++) {
    for (let y = 28; y < 52; y++) {
      desktop.setPixelColor(white, x, y);
    }
  }

  // Draw simple sidebar (white)
  for (let x = 0; x < 240; x++) {
    for (let y = 80; y < 720; y++) {
      desktop.setPixelColor(white, x, y);
    }
  }

  // Draw some simple menu item lines in sidebar
  const menuLines = [120, 160, 200, 240, 280];
  for (const startY of menuLines) {
    for (let x = 30; x < 210; x++) {
      for (let y = startY; y < startY + 12; y++) {
        desktop.setPixelColor(emerald, x, y);
      }
    }
  }

  // Draw some simple app cards/grid in main area
  // Card 1
  for (let x = 280; x < 580; x++) {
    for (let y = 120; y < 320; y++) {
      const isBorder = (x < 282 || x > 578 || y < 122 || y > 318);
      desktop.setPixelColor(isBorder ? mint : white, x, y);
    }
  }
  // Card 2
  for (let x = 620; x < 920; x++) {
    for (let y = 120; y < 320; y++) {
      const isBorder = (x < 622 || x > 918 || y < 122 || y > 318);
      desktop.setPixelColor(isBorder ? mint : white, x, y);
    }
  }
  // Card 3
  for (let x = 960; x < 1240; x++) {
    for (let y = 120; y < 320; y++) {
      const isBorder = (x < 962 || x > 1238 || y < 122 || y > 318);
      desktop.setPixelColor(isBorder ? mint : white, x, y);
    }
  }

  // Big Chart Card
  for (let x = 280; x < 1240; x++) {
    for (let y = 360; y < 660; y++) {
      const isBorder = (x < 282 || x > 1238 || y < 362 || y > 658);
      desktop.setPixelColor(isBorder ? emerald : white, x, y);
    }
  }

  await desktop.write(path.join('public', 'screenshot_desktop.png') as any);
  console.log('Saved screenshot_desktop.png');


  // 5. Generate Mobile Screenshot (720x1280)
  console.log('Generating screenshot_mobile.png (720x1280)...');
  const mobile = new Jimp({ width: 720, height: 1280, color: grayLight });

  // Draw mobile header
  for (let x = 0; x < 720; x++) {
    for (let y = 0; y < 100; y++) {
      mobile.setPixelColor(darkGreen, x, y);
    }
  }

  // Draw hamburger menu indicator (3 horizontal lines)
  for (let y of [40, 50, 60]) {
    for (let x = 40; x < 80; x++) {
      for (let dy = -2; dy <= 2; dy++) {
        mobile.setPixelColor(white, x, y + dy);
      }
    }
  }

  // Cards stacked vertically
  const cardYStart = [140, 420, 700, 980];
  for (const startY of cardYStart) {
    for (let x = 40; x < 680; x++) {
      for (let y = startY; y < startY + 240; y++) {
        const isBorder = (x < 42 || x > 678 || y < startY + 2 || y > startY + 238);
        mobile.setPixelColor(isBorder ? emerald : white, x, y);
      }
    }
  }

  await mobile.write(path.join('public', 'screenshot_mobile.png') as any);
  console.log('Saved screenshot_mobile.png');

  console.log('PWA Assets successfully generated!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
