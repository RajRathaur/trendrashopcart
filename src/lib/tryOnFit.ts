// Pure geometry helpers for the Virtual Try-On fitting room.
// Landmark coordinates come in normalized [0..1] form (MediaPipe Pose).

export interface NormPoint {
  x: number;
  y: number;
  visibility?: number;
}

export interface TryOnAdjust {
  /** Size multiplier in percent (100 = auto size). */
  scale: number;
  /** Horizontal shift as percent of the canvas width. */
  offsetX: number;
  /** Vertical shift as percent of the canvas height. */
  offsetY: number;
  /** Extra rotation in degrees. */
  rotation: number;
}

export interface Placement {
  cx: number;
  cy: number;
  width: number;
  height: number;
  /** Radians. */
  angle: number;
}

export const DEFAULT_ADJUST: TryOnAdjust = { scale: 100, offsetX: 0, offsetY: 0, rotation: 0 };

/** Garment width relative to the detected shoulder width. */
export const GARMENT_TO_SHOULDER = 1.9;
/** Where the shoulder seam sits, as a fraction of garment height from the top. */
export const SHOULDER_LINE = 0.17;
const MIN_VISIBILITY = 0.5;

interface PlacementInput {
  leftShoulder?: NormPoint | null;
  rightShoulder?: NormPoint | null;
  canvasW: number;
  canvasH: number;
  /** Garment image height / width. */
  garmentAspect: number;
  /** True when the canvas shows a mirrored (selfie) view. */
  mirror?: boolean;
}

const visible = (p?: NormPoint | null): p is NormPoint =>
  !!p && (p.visibility === undefined || p.visibility >= MIN_VISIBILITY);

export function hasShoulders(left?: NormPoint | null, right?: NormPoint | null) {
  return visible(left) && visible(right);
}

/** Computes where to draw the garment on the canvas, before manual adjustments. */
export function computeAutoPlacement(input: PlacementInput): Placement {
  const { canvasW: W, canvasH: H, garmentAspect, mirror } = input;
  const aspect = garmentAspect > 0 ? garmentAspect : 1.2;

  if (!hasShoulders(input.leftShoulder, input.rightShoulder)) {
    const width = W * 0.5;
    const height = width * aspect;
    return { cx: W / 2, cy: H * 0.25 + height * (0.5 - SHOULDER_LINE), width, height, angle: 0 };
  }

  const toPx = (p: NormPoint) => ({ x: (mirror ? 1 - p.x : p.x) * W, y: p.y * H });
  const p1 = toPx(input.leftShoulder!);
  const p2 = toPx(input.rightShoulder!);
  const [a, b] = p1.x <= p2.x ? [p1, p2] : [p2, p1];

  const shoulderWidth = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const width = shoulderWidth * GARMENT_TO_SHOULDER;
  const height = width * aspect;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const d = height * (0.5 - SHOULDER_LINE);

  return { cx: mx - Math.sin(angle) * d, cy: my + Math.cos(angle) * d, width, height, angle };
}

/** Applies the customer's manual slider adjustments on top of the auto placement. */
export function applyAdjust(base: Placement, adj: TryOnAdjust, canvasW: number, canvasH: number): Placement {
  const s = Math.max(0.1, adj.scale / 100);
  const width = base.width * s;
  const height = base.height * s;
  // Keep the shoulder line anchored while scaling.
  const shift = (height - base.height) * (0.5 - SHOULDER_LINE);
  return {
    width,
    height,
    cx: base.cx - Math.sin(base.angle) * shift + (adj.offsetX / 100) * canvasW,
    cy: base.cy + Math.cos(base.angle) * shift + (adj.offsetY / 100) * canvasH,
    angle: base.angle + (adj.rotation * Math.PI) / 180,
  };
}

/** Exponential smoothing so the garment does not jitter between frames. */
export function smoothPlacement(prev: Placement | null, next: Placement, alpha = 0.35): Placement {
  if (!prev) return next;
  const lerp = (p: number, n: number) => p + (n - p) * alpha;
  return {
    cx: lerp(prev.cx, next.cx),
    cy: lerp(prev.cy, next.cy),
    width: lerp(prev.width, next.width),
    height: lerp(prev.height, next.height),
    angle: lerp(prev.angle, next.angle),
  };
}

const TOP_WEAR = /(shirt|t-?shirts?|tee|top|kurta|kurti|dress|hoodie|jacket|sweat|blazer|polo|apparel|clothing)/i;
const NOT_TOP_WEAR = /(footwear|shoe|sandal|slipper|sneaker|pant|jean|trouser|watch|electronic|beauty|kitchen)/i;

/** Whether a product should offer the try-on button (upper-body clothing only). */
export function isTryOnEligible(p: {
  name?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  customizationEnabled?: boolean | null;
}) {
  if (p.customizationEnabled) return true;
  const category = `${p.categoryName ?? ''} ${p.categorySlug ?? ''}`;
  const text = `${category} ${p.name ?? ''}`;
  if (NOT_TOP_WEAR.test(category)) return false;
  return TOP_WEAR.test(text) && !NOT_TOP_WEAR.test(p.name ?? '');
}
