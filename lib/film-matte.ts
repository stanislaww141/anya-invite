/** Runtime chroma matte for RGB artwork. Enclosed eyes/highlights remain intact. */
export function neutralMatte(pixels: Uint8ClampedArray, width: number, height: number) {
  const count = width * height;
  const seen = new Uint8Array(count);
  const queue = new Uint32Array(count);
  let head = 0, tail = 0;
  const push = (p: number) => {
    if (seen[p]) return;
    seen[p] = 1;
    const at = p * 4;
    const lo = Math.min(pixels[at], pixels[at + 1], pixels[at + 2]);
    const hi = Math.max(pixels[at], pixels[at + 1], pixels[at + 2]);
    if (lo < 146 || hi - lo > 20) return;
    queue[tail++] = p;
  };
  for (let x = 0; x < width; x++) { push(x); push((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { push(y * width); push(y * width + width - 1); }
  // A repeated neutral checker pattern may be enclosed between a ship's ropes.
  for (let y = 8; y < height - 24; y += 8) for (let x = 8; x < width - 24; x += 8) {
    const samples = [0, 8, 16, 24].map(dx => (y * width + x + dx) * 4);
    const neutral = samples.every(at => Math.min(pixels[at], pixels[at + 1], pixels[at + 2]) > 146 && Math.max(pixels[at], pixels[at + 1], pixels[at + 2]) - Math.min(pixels[at], pixels[at + 1], pixels[at + 2]) < 12);
    if (neutral && Math.max(...samples.map(at => pixels[at])) - Math.min(...samples.map(at => pixels[at])) > 38) push(y * width + x);
  }
  while (head < tail) {
    const p = queue[head++];
    pixels[p * 4 + 3] = 0;
    if (p % width > 0) push(p - 1);
    if (p % width < width - 1) push(p + 1);
    if (p >= width) push(p - width);
    if (p + width < count) push(p + width);
  }
  return pixels;
}
