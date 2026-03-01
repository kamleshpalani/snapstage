/**
 * watermark.ts
 * Applies a "PREVIEW — SnapStage" diagonal watermark and resizes to max 1024px.
 * Uses Sharp (npm i sharp @types/sharp).
 */
import sharp from "sharp";

const WATERMARK_TEXT = "PREVIEW — SnapStage.ai";
const PREVIEW_MAX_WIDTH = 1024;

/**
 * Build an SVG text watermark overlay that tiles diagonally.
 */
function buildWatermarkSvg(width: number, height: number): Buffer {
  // Tile the watermark text every ~300px diagonally
  let tiles = "";
  const step = 260;
  for (let y = -height; y < height * 2; y += step) {
    for (let x = -width; x < width * 2; x += step) {
      tiles += `
        <text
          x="${x}"
          y="${y}"
          font-family="Arial, sans-serif"
          font-size="28"
          font-weight="bold"
          fill="white"
          fill-opacity="0.38"
          stroke="rgba(0,0,0,0.15)"
          stroke-width="0.5"
          transform="rotate(-30 ${x} ${y})"
          text-anchor="middle"
        >${WATERMARK_TEXT}</text>`;
    }
  }

  // Bottom brand bar
  const barHeight = 40;
  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <style>text { letter-spacing: 1.5px; }</style>
      </defs>
      ${tiles}
      <!-- Brand bar at bottom -->
      <rect x="0" y="${height - barHeight}" width="${width}" height="${barHeight}"
            fill="rgba(0,0,0,0.55)" />
      <text x="${width / 2}" y="${height - barHeight + 26}"
            font-family="Arial, sans-serif" font-size="14" font-weight="bold"
            fill="white" fill-opacity="0.9" text-anchor="middle">
        ⚡ PREVIEW ONLY — Purchase credits to download HD at SnapStage.ai
      </text>
    </svg>`;

  return Buffer.from(svgStr);
}

/**
 * Download a remote image URL and return a Buffer.
 */
export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
  const arrayBuf = await resp.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/**
 * Apply watermark + resize to create a preview image.
 * Returns a PNG buffer.
 */
export async function applyPreviewWatermark(
  sourceBuffer: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  // Resize to max 1024px wide, maintain aspect ratio
  const resized = sharp(sourceBuffer).resize({
    width: PREVIEW_MAX_WIDTH,
    withoutEnlargement: true,
  });

  const { width = PREVIEW_MAX_WIDTH, height = 768 } = await resized
    .clone()
    .metadata();

  // Build SVG overlay
  const watermarkSvg = buildWatermarkSvg(width, height);

  const outputBuffer = await resized
    .composite([{ input: watermarkSvg, top: 0, left: 0 }])
    .png({ quality: 80 })
    .toBuffer();

  return { buffer: outputBuffer, width, height };
}

/**
 * Process HD image — no watermark, just ensure it's a clean PNG.
 * Source is already full-res from Replicate (output_quality: 90).
 */
export async function processHdImage(
  sourceBuffer: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const image = sharp(sourceBuffer);
  const { width = 2048, height = 1536 } = await image.metadata();
  const outputBuffer = await image.png({ quality: 95 }).toBuffer();
  return { buffer: outputBuffer, width, height };
}
