// Cuts a garment out of a plain studio product photo for the Virtual Try-On.
// Works on raw RGBA pixels so it runs in the browser (canvas) and in tests.

const erode = (m: Uint8Array, w: number, h: number) => {
  const out = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      out[i] =
        m[i] &&
        (x === 0 || m[i - 1]) &&
        (x === w - 1 || m[i + 1]) &&
        (y === 0 || m[i - w]) &&
        (y === h - 1 || m[i + w])
          ? 1
          : 0;
    }
  }
  return out;
};

const dilateWithin = (m: Uint8Array, limit: Uint8Array, w: number, h: number) => {
  const out = new Uint8Array(m);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (m[i] || !limit[i]) continue;
      if ((x > 0 && m[i - 1]) || (x < w - 1 && m[i + 1]) || (y > 0 && m[i - w]) || (y < h - 1 && m[i + w])) out[i] = 1;
    }
  }
  return out;
};

/**
 * Marks the studio background (1) reachable from the photo border.
 * Tolerance adapts to how flat the background is, so a white T-shirt on a
 * near-white backdrop keeps its body; thin leaks through soft edges are
 * blocked by eroding the mask before the flood fill.
 */
export function backgroundMask(px: ArrayLike<number>, w: number, h: number): Uint8Array {
  const n = w * h;
  const corners = [0, w - 1, (h - 1) * w, n - 1];
  const bg = [0, 1, 2].map((k) => corners.reduce((s, i) => s + px[i * 4 + k], 0) / 4);
  const diff = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    diff[i] = Math.abs(px[i * 4] - bg[0]) + Math.abs(px[i * 4 + 1] - bg[1]) + Math.abs(px[i * 4 + 2] - bg[2]);
  }

  // How noisy is the backdrop? Look at the outer border.
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(diff[x], diff[(h - 1) * w + x]);
  for (let y = 0; y < h; y++) border.push(diff[y * w], diff[y * w + w - 1]);
  border.sort((a, b) => a - b);
  const p90 = border[Math.floor(border.length * 0.9)] ?? 0;
  const tol = Math.min(63, Math.max(9, p90 * 1.5 + 6));

  const near = new Uint8Array(n);
  for (let i = 0; i < n; i++) near[i] = diff[i] < tol ? 1 : 0;
  const seeds = erode(erode(near, w, h), w, h);

  let mask = new Uint8Array(n);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (mask[i] || !seeds[i]) continue;
    mask[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < n - w) stack.push(i + w);
  }
  mask = dilateWithin(mask, near, w, h);
  mask = dilateWithin(mask, near, w, h);
  return mask;
}

/**
 * Box around the garment itself: the longest run of rows/columns that are
 * meaningfully filled, so stray specks or a small caption under the photo
 * are not counted as part of the garment.
 */
export function garmentBounds(px: ArrayLike<number>, w: number, h: number, minAlpha = 16, minFill = 0.1) {
  const solid = (x: number, y: number) => px[(y * w + x) * 4 + 3] >= minAlpha;
  const longestRun = (len: number, ok: (i: number) => boolean) => {
    let best: [number, number] | null = null;
    let start = -1;
    for (let i = 0; i <= len; i++) {
      if (i < len && ok(i)) {
        if (start < 0) start = i;
      } else if (start >= 0) {
        if (!best || i - start > best[1] - best[0]) best = [start, i];
        start = -1;
      }
    }
    return best;
  };

  const rows = longestRun(h, (y) => {
    let c = 0;
    for (let x = 0; x < w; x++) if (solid(x, y)) c++;
    return c >= Math.max(1, w * minFill);
  });
  if (!rows) return null;
  const [y0, y1] = rows;
  const cols = longestRun(w, (x) => {
    let c = 0;
    for (let y = y0; y < y1; y++) if (solid(x, y)) c++;
    return c >= Math.max(1, (y1 - y0) * minFill * 0.5);
  });
  if (!cols) return null;
  return { x: cols[0], y: y0, w: cols[1] - cols[0], h: y1 - y0 };
}
