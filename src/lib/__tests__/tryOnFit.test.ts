import { describe, it, expect } from 'vitest';
import {
  applyAdjust,
  collarPoint,
  computeAutoPlacement,
  DEFAULT_ADJUST,
  extractTorso,
  GARMENT_TO_SHOULDER,
  isTryOnEligible,
  nextAutoTarget,
  type NormPoint,
} from '../tryOnFit';

describe('torso-anchored fit', () => {
  const shoulders = { leftShoulder: { x: 0.4, y: 0.3 }, rightShoulder: { x: 0.6, y: 0.3 } };

  it('pins the collar exactly on the midpoint between the shoulders', () => {
    const p = computeAutoPlacement({ ...base, ...shoulders, shoulderLine: 0.08 });
    const c = collarPoint(p);
    expect(c.x).toBeCloseTo(500, 5);
    expect(c.y).toBeCloseTo(300, 5);
  });

  it('width follows the shoulder distance', () => {
    const p = computeAutoPlacement({ ...base, ...shoulders });
    expect(p.width).toBeCloseTo(200 * GARMENT_TO_SHOULDER, 5);
  });

  it('stretches the garment length down to the hips', () => {
    const noHips = computeAutoPlacement({ ...base, ...shoulders, garmentAspect: 1 });
    const longTorso = computeAutoPlacement({
      ...base,
      ...shoulders,
      garmentAspect: 1,
      leftHip: { x: 0.42, y: 0.75 },
      rightHip: { x: 0.58, y: 0.75 },
    });
    expect(longTorso.height).toBeGreaterThan(noHips.height);
  });

  it('keeps the collar on the shoulders when the scale slider changes', () => {
    const auto = computeAutoPlacement({ ...base, ...shoulders });
    const big = applyAdjust(auto, { ...DEFAULT_ADJUST, scale: 160 }, 1000, 1000);
    expect(collarPoint(big).x).toBeCloseTo(collarPoint(auto).x, 5);
    expect(collarPoint(big).y).toBeCloseTo(collarPoint(auto).y, 5);
  });

  it('uses only shoulder and hip landmarks, never the face', () => {
    const pts: NormPoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.1, visibility: 1 }));
    pts[11] = { x: 0.6, y: 0.3, visibility: 1 };
    pts[12] = { x: 0.4, y: 0.3, visibility: 1 };
    pts[23] = { x: 0.55, y: 0.7, visibility: 1 };
    pts[24] = { x: 0.45, y: 0.7, visibility: 1 };
    const t = extractTorso(pts)!;
    expect([t.l, t.r, t.lh, t.rh]).toEqual([pts[11], pts[12], pts[23], pts[24]]);
  });

  it('holds the last fit when the body is briefly lost instead of jumping', () => {
    const last = computeAutoPlacement({ ...base, ...shoulders, shoulderLine: 0.17 });
    const held = nextAutoTarget(last, null, () => computeAutoPlacement({ ...base }), 0.17);
    expect(held).toBe(last);
  });
});

const base = { canvasW: 1000, canvasH: 1000, garmentAspect: 1.2 };

describe('computeAutoPlacement', () => {
  it('makes the garment bigger when the shopper moves closer (wider shoulders)', () => {
    const far = computeAutoPlacement({ ...base, leftShoulder: { x: 0.45, y: 0.3 }, rightShoulder: { x: 0.55, y: 0.3 } });
    const near = computeAutoPlacement({ ...base, leftShoulder: { x: 0.35, y: 0.3 }, rightShoulder: { x: 0.65, y: 0.3 } });
    expect(near.width).toBeCloseTo(far.width * 3, 5);
  });

  it('follows the shopper horizontally', () => {
    const p = computeAutoPlacement({ ...base, leftShoulder: { x: 0.2, y: 0.3 }, rightShoulder: { x: 0.4, y: 0.3 } });
    expect(p.cx).toBeCloseTo(300, 5);
  });

  it('flips position for the mirrored selfie camera', () => {
    const p = computeAutoPlacement({ ...base, mirror: true, leftShoulder: { x: 0.2, y: 0.3 }, rightShoulder: { x: 0.4, y: 0.3 } });
    expect(p.cx).toBeCloseTo(700, 5);
  });

  it('tilts with the shoulders', () => {
    const p = computeAutoPlacement({ ...base, leftShoulder: { x: 0.4, y: 0.3 }, rightShoulder: { x: 0.6, y: 0.5 } });
    expect(p.angle).toBeCloseTo(Math.PI / 4, 5);
  });

  it('uses a centered default when shoulders are not visible', () => {
    const p = computeAutoPlacement({ ...base, leftShoulder: { x: 0.4, y: 0.3, visibility: 0.1 }, rightShoulder: { x: 0.6, y: 0.3 } });
    expect(p.cx).toBe(500);
    expect(p.width).toBe(500);
  });
});

describe('applyAdjust', () => {
  const auto = computeAutoPlacement({ ...base, leftShoulder: { x: 0.4, y: 0.3 }, rightShoulder: { x: 0.6, y: 0.3 } });

  it('scale slider at 150% makes the garment 1.5x wider', () => {
    expect(applyAdjust(auto, { ...DEFAULT_ADJUST, scale: 150 }, 1000, 1000).width).toBeCloseTo(auto.width * 1.5, 5);
  });

  it('X slider moves by percent of the canvas width', () => {
    expect(applyAdjust(auto, { ...DEFAULT_ADJUST, offsetX: 10 }, 1000, 1000).cx).toBeCloseTo(auto.cx + 100, 5);
  });

  it('rotation slider adds degrees', () => {
    expect(applyAdjust(auto, { ...DEFAULT_ADJUST, rotation: 90 }, 1000, 1000).angle).toBeCloseTo(auto.angle + Math.PI / 2, 5);
  });
});

describe('isTryOnEligible', () => {
  it('shows try-on for shirts and t-shirts', () => {
    expect(isTryOnEligible({ name: 'Plain Tee', categorySlug: 'mens-tshirts', categoryName: "Men's T-Shirts" })).toBe(true);
    expect(isTryOnEligible({ name: 'Oxford', categorySlug: 'mens-shirts', categoryName: "Men's Shirts" })).toBe(true);
  });

  it('hides try-on for footwear and electronics', () => {
    expect(isTryOnEligible({ name: 'Running Shoe', categorySlug: 'mens-footwear', categoryName: "Men's Footwear" })).toBe(false);
    expect(isTryOnEligible({ name: 'Earbuds', categorySlug: 'electronics', categoryName: 'Electronics' })).toBe(false);
  });

  it('always shows try-on for custom-print products', () => {
    expect(isTryOnEligible({ name: 'Blank', customizationEnabled: true })).toBe(true);
  });
});
