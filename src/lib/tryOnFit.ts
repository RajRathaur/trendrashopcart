// Pure geometry helpers for the Virtual Try-On fitting room.
// Landmark coordinates come in normalized [0..1] form (MediaPipe Pose).
// Only body landmarks are used (shoulders 11/12, hips 23/24) — never the face.

export interface NormPoint {
  x: number;
  y: number;
  visibility?: number;
}

/** MediaPipe Pose landmark indices used by the try-on. */
export const POSE = { LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_HIP: 23, RIGHT_HIP: 24 } as const;

export interface TorsoLandmarks {
  l: NormPoint;
  r: NormPoint;
  lh?: NormPoint | null;
  rh?: NormPoint | null;
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
  /** Fraction of garment height (from the top) that sits on the shoulder line. */
  shoulderLine?: number;
}

export const DEFAULT_ADJUST: TryOnAdjust = { scale: 100, offsetX: 0, offsetY: 0, rotation: 0 };

/** Garment width (sleeve tip to sleeve tip) relative to the shoulder-joint distance. */
export const GARMENT_TO_SHOULDER = 1.9;
/** Where the shoulder seam / collar sits, as a fraction of garment height from the top (uncropped photo). */
export const SHOULDER_LINE = 0.17;
/** Same, for a photo already trimmed to the garment outline. */
export const SHOULDER_LINE_TRIMMED = 0.08;
/** The hem should end this much below the hips (relative to shoulder→hip length). */
export const HEM_BELOW_HIPS = 1.22;
/** How far the garment may stretch away from its natural proportions to reach the hips. */
const MIN_STRETCH = 0.8;
const MAX_STRETCH = 1.4;
const MIN_VISIBILITY = 0.5;

interface PlacementInput {
  leftShoulder?: NormPoint | null;
  rightShoulder?: NormPoint | null;
  leftHip?: NormPoint | null;
  rightHip?: NormPoint | null;
  canvasW: number;
  canvasH: number;
  /** Garment image height / width. */
  garmentAspect: number;
  /** Fraction of garment height where the collar/shoulder line is. */
  shoulderLine?: number;
  /** True when the canvas shows a mirrored (selfie) view. */
  mirror?: boolean;
}

const visible = (p?: NormPoint | null): p is NormPoint =>
  !!p && (p.visibility === undefined || p.visibility >= MIN_VISIBILITY);

export function hasShoulders(left?: NormPoint | null, right?: NormPoint | null) {
  return visible(left) && visible(right);
}

/** Picks shoulders + hips out of a MediaPipe Pose landmark list. */
export function extractTorso(pts?: NormPoint[] | null): TorsoLandmarks | null {
  if (!pts) return null;
  const l = pts[POSE.LEFT_SHOULDER];
  const r = pts[POSE.RIGHT_SHOULDER];
  if (!hasShoulders(l, r)) return null;
  const lh = pts[POSE.LEFT_HIP];
  const rh = pts[POSE.RIGHT_HIP];
  return { l, r, lh: visible(lh) ? lh : null, rh: visible(rh) ? rh : null };
}

/**
 * Computes where to draw the garment, before manual adjustments.
 * The collar/shoulder line of the garment is pinned to the midpoint of the shoulders,
 * width follows the shoulder distance and length reaches just past the hips.
 */
export function computeAutoPlacement(input: PlacementInput): Placement {
  const { canvasW: W, canvasH: H, garmentAspect, mirror } = input;
  const aspect = garmentAspect > 0 ? garmentAspect : 1.2;
  const line = input.shoulderLine ?? SHOULDER_LINE;

  if (!hasShoulders(input.leftShoulder, input.rightShoulder)) {
    const width = W * 0.5;
    const height = width * aspect;
    return { cx: W / 2, cy: H * 0.25 + height * (0.5 - line), width, height, angle: 0, shoulderLine: line };
  }

  const toPx = (p: NormPoint) => ({ x: (mirror ? 1 - p.x : p.x) * W, y: p.y * H });
  const p1 = toPx(input.leftShoulder!);
  const p2 = toPx(input.rightShoulder!);
  const [a, b] = p1.x <= p2.x ? [p1, p2] : [p2, p1];

  const shoulderWidth = Math.hypot(b.x - a.x, b.y - a.y);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const width = shoulderWidth * GARMENT_TO_SHOULDER;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // "Down the body" direction, perpendicular to the shoulder line.
  const downX = -Math.sin(angle);
  const downY = Math.cos(angle);

  const natural = width * aspect;
  let height = natural;
  if (visible(input.leftHip) && visible(input.rightHip)) {
    const h1 = toPx(input.leftHip);
    const h2 = toPx(input.rightHip);
    const hx = (h1.x + h2.x) / 2;
    const hy = (h1.y + h2.y) / 2;
    const torso = (hx - mx) * downX + (hy - my) * downY;
    if (torso > shoulderWidth * 0.3) {
      const wanted = (torso * HEM_BELOW_HIPS) / (1 - line);
      height = Math.min(natural * MAX_STRETCH, Math.max(natural * MIN_STRETCH, wanted));
    }
  }

  const d = height * (0.5 - line);
  return { cx: mx + downX * d, cy: my + downY * d, width, height, angle, shoulderLine: line };
}

/** The point of the garment that sits on the shoulder midpoint (collar line, centre). */
export function collarPoint(p: Placement) {
  const d = p.height * (0.5 - (p.shoulderLine ?? SHOULDER_LINE));
  return { x: p.cx + Math.sin(p.angle) * d, y: p.cy - Math.cos(p.angle) * d };
}

/** Applies the customer's manual slider adjustments on top of the auto placement. */
export function applyAdjust(base: Placement, adj: TryOnAdjust, canvasW: number, canvasH: number): Placement {
  const line = base.shoulderLine ?? SHOULDER_LINE;
  const s = Math.max(0.1, adj.scale / 100);
  const width = base.width * s;
  const height = base.height * s;
  // Keep the collar anchored on the shoulders while scaling.
  const shift = (height - base.height) * (0.5 - line);
  return {
    width,
    height,
    cx: base.cx - Math.sin(base.angle) * shift + (adj.offsetX / 100) * canvasW,
    cy: base.cy + Math.cos(base.angle) * shift + (adj.offsetY / 100) * canvasH,
    angle: base.angle + (adj.rotation * Math.PI) / 180,
    shoulderLine: line,
  };
}

/**
 * Chooses the auto-fit target for this frame. When the body is briefly lost
 * (turning, motion blur) the garment stays where it was instead of jumping
 * to the centre of the screen.
 */
export function nextAutoTarget(
  prev: Placement | null,
  torso: TorsoLandmarks | null,
  compute: (t: TorsoLandmarks | null) => Placement,
  shoulderLine: number,
): Placement {
  if (!torso && prev && prev.shoulderLine === shoulderLine) return prev;
  return compute(torso);
}

/** Exponential smoothing so the garment does not jitter between frames. */
export function smoothPlacement(prev: Placement | null, next: Placement, alpha = 0.35): Placement {
  if (!prev || prev.shoulderLine !== next.shoulderLine) return next;
  const lerp = (p: number, n: number) => p + (n - p) * alpha;
  return {
    cx: lerp(prev.cx, next.cx),
    cy: lerp(prev.cy, next.cy),
    width: lerp(prev.width, next.width),
    height: lerp(prev.height, next.height),
    angle: lerp(prev.angle, next.angle),
    shoulderLine: next.shoulderLine,
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
