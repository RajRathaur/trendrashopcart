import { describe, it, expect } from 'vitest';
import { backgroundMask, garmentBounds } from '../garmentCutout';

/** 40x40 photo: flat 242-grey backdrop, a 20x20 "white T-shirt" (247) with a soft 230 shadow outline. */
function whiteTeeOnWhite() {
  const w = 40, h = 40;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inShirt = x >= 10 && x < 30 && y >= 10 && y < 30;
      const outline = x >= 9 && x < 31 && y >= 9 && y < 31 && !inShirt;
      const v = inShirt ? 247 : outline ? 230 : 242;
      const i = (y * w + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
  }
  return { px, w, h };
}

describe('backgroundMask', () => {
  it('removes the backdrop but keeps a white T-shirt on a near-white background', () => {
    const { px, w, h } = whiteTeeOnWhite();
    const m = backgroundMask(px, w, h);
    expect(m[0]).toBe(1); // corner = backdrop
    expect(m[20 * w + 20]).toBe(0); // shirt centre stays
    let kept = 0;
    for (let y = 10; y < 30; y++) for (let x = 10; x < 30; x++) if (!m[y * w + x]) kept++;
    expect(kept).toBe(400);
  });
});

describe('garmentBounds', () => {
  it('ignores a small caption under the garment', () => {
    const w = 50, h = 50;
    const px = new Uint8ClampedArray(w * h * 4);
    const fill = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px[(y * w + x) * 4 + 3] = 255;
    };
    fill(10, 5, 40, 35); // garment
    fill(22, 42, 26, 44); // tiny caption text
    expect(garmentBounds(px, w, h)).toEqual({ x: 10, y: 5, w: 30, h: 30 });
  });
});
