// Entry for make.fun's news-image-20261120 bounty: the page in entry.png is a
// front page for Friday 20 November 2026. Drawing it needs Pillow and a few
// seconds, so the finished image ships with the repository and this program
// publishes it: an exact byte copy is deterministic by construction, and the
// grader runs the program twice and compares the two outputs.
//
// Node 22, standard library only, no network. Nothing here may read the clock,
// a random source or the network, because a second run has to land on the same
// bytes as the first.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1_048_576;
const MAX_SIDE = 1024;

// The gate the make.fun scorer applies, checked here so a broken image fails
// loudly on the machine that built it instead of at submission time.
function checkImage(image: Buffer): { width: number; height: number } {
  if (!image.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('entry.png is not a PNG file');
  }
  if (image.length > MAX_BYTES) {
    throw new Error(`entry.png is ${image.length} bytes; the gate allows ${MAX_BYTES}`);
  }
  // IHDR is the first chunk, so the width and height sit at a fixed offset.
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width > MAX_SIDE || height > MAX_SIDE) {
    throw new Error(`entry.png is ${width}x${height}; the gate allows ${MAX_SIDE} square`);
  }
  return { width, height };
}

// The image sits beside this file; in the grader the repository root is /bot.
const source = fileURLToPath(new URL('./entry.png', import.meta.url));
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for the writable /output.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outputDir, 'entry.png');

const image = readFileSync(source);
const { width, height } = checkImage(image);

mkdirSync(outputDir, { recursive: true });
copyFileSync(source, target);

const written = readFileSync(target);
if (written.length !== image.length) {
  throw new Error(`wrote ${written.length} bytes but the image is ${image.length}`);
}
writeFileSync(join(outputDir, 'entry.meta.json'), JSON.stringify({
  day: '2026-11-20',
  width,
  height,
  bytes: written.length,
}) + '\n');
