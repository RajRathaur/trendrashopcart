import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import Webcam from 'react-webcam';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera, Upload, Download, RotateCcw, ArrowLeft, Loader2, ScanLine, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  applyAdjust,
  computeAutoPlacement,
  DEFAULT_ADJUST,
  extractTorso,
  nextAutoTarget,
  SHOULDER_LINE,
  SHOULDER_LINE_TRIMMED,
  smoothPlacement,
  type Placement,
  type TorsoLandmarks,
  type TryOnAdjust,
} from '@/lib/tryOnFit';
import { backgroundMask, garmentBounds } from '@/lib/garmentCutout';

type Garment = { source: CanvasImageSource; aspect: number; safe: boolean; trimmed: boolean };

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

let landmarkerPromise: Promise<PoseLandmarker> | null = null;
function loadPoseLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const create = (delegate: 'GPU' | 'CPU') =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
      try {
        return await create('GPU');
      } catch {
        return await create('CPU');
      }
    })().catch((e) => {
      landmarkerPromise = null;
      throw e;
    });
  }
  return landmarkerPromise;
}

/**
 * Loads a product photo, removes its plain studio background (flood fill from the edges)
 * and trims the empty margins so the garment's collar sits right on the shoulders.
 */
async function loadGarment(src: string, removeBg: boolean): Promise<Garment> {
  const load = (cors: boolean) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (cors) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  let img: HTMLImageElement;
  let safe = true;
  try {
    img = await load(true);
  } catch {
    img = await load(false);
    safe = false;
  }
  const aspect = img.naturalHeight / img.naturalWidth || 1.2;
  if (!removeBg || !safe) return { source: img, aspect, safe, trimmed: false };

  try {
    const maxW = 600;
    const w = Math.min(maxW, img.naturalWidth);
    const h = Math.round(w * aspect);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const mask = backgroundMask(px, w, h);
    let removed = 0;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i]) {
        px[i * 4 + 3] = 0;
        removed++;
      }
    }
    // Almost nothing left means the cut-out failed (e.g. garment same colour as backdrop): use the plain photo.
    if (removed > mask.length * 0.92) return { source: img, aspect, safe, trimmed: false };
    ctx.putImageData(data, 0, 0);

    // Trim empty margins (only when the garment is a sensible part of the photo).
    const box = garmentBounds(px, w, h);
    if (box && box.w * box.h > w * h * 0.15 && (box.w < w || box.h < h)) {
      const t = document.createElement('canvas');
      t.width = box.w;
      t.height = box.h;
      t.getContext('2d')!.drawImage(c, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      return { source: t, aspect: box.h / box.w, safe, trimmed: true };
    }
    return { source: c, aspect, safe, trimmed: false };
  } catch {
    return { source: img, aspect, safe: false, trimmed: false };
  }
}

type Mode = 'choose' | 'camera' | 'photo';
type ModelState = 'idle' | 'loading' | 'ready' | 'failed';

interface VirtualTryOnProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  images: string[];
}

const VirtualTryOn = ({ open, onOpenChange, productName, images }: VirtualTryOnProps) => {
  const [mode, setMode] = useState<Mode>('choose');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelState, setModelState] = useState<ModelState>('idle');
  const [bodyFound, setBodyFound] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [garmentIdx, setGarmentIdx] = useState(0);
  const [removeBg, setRemoveBg] = useState(true);
  const [autoFit, setAutoFit] = useState(true);
  const [adjust, setAdjust] = useState<TryOnAdjust>(DEFAULT_ADJUST);
  const [hasPhoto, setHasPhoto] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const runningModeRef = useRef<'VIDEO' | 'IMAGE'>('VIDEO');
  const garmentRef = useRef<Garment | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  /** Shoulders + hips from the body-pose model (never face points). */
  const torsoRef = useRef<TorsoLandmarks | null>(null);
  const placementRef = useRef<Placement | null>(null);
  const adjustRef = useRef(adjust);
  const autoFitRef = useRef(autoFit);
  const lastDetectRef = useRef(0);
  const bodyFoundRef = useRef(false);

  adjustRef.current = adjust;
  autoFitRef.current = autoFit;

  const garmentSrc = images[garmentIdx] ?? images[0];

  // Reset when the dialog closes.
  useEffect(() => {
    if (!open) {
      setMode('choose');
      setCameraReady(false);
      setCameraError(null);
      setHasPhoto(false);
      setAdjust(DEFAULT_ADJUST);
      photoRef.current = null;
      torsoRef.current = null;
      placementRef.current = null;
    }
  }, [open]);

  // Leaving camera mode stops the camera; reset its state for the next start.
  useEffect(() => {
    if (mode !== 'camera') {
      setCameraReady(false);
      setCameraError(null);
    }
    placementRef.current = null;
  }, [mode]);

  // Load the garment overlay.
  useEffect(() => {
    if (!open || !garmentSrc) return;
    let cancelled = false;
    loadGarment(garmentSrc, removeBg)
      .then((g) => {
        if (!cancelled) garmentRef.current = g;
      })
      .catch(() => toast.error('Could not load the product photo for try-on'));
    return () => {
      cancelled = true;
    };
  }, [open, garmentSrc, removeBg]);

  // Load the AI body-detection model once a mode is picked.
  useEffect(() => {
    if (!open || mode === 'choose' || landmarkerRef.current) return;
    setModelState('loading');
    loadPoseLandmarker()
      .then((lm) => {
        landmarkerRef.current = lm;
        runningModeRef.current = 'VIDEO';
        setModelState('ready');
      })
      .catch((e) => {
        console.error('Pose model failed', e);
        setModelState('failed');
      });
  }, [open, mode]);

  const setRunningMode = useCallback(async (m: 'VIDEO' | 'IMAGE') => {
    const lm = landmarkerRef.current;
    if (!lm || runningModeRef.current === m) return;
    await lm.setOptions({ runningMode: m });
    runningModeRef.current = m;
  }, []);

  const detectPhoto = useCallback(async () => {
    const lm = landmarkerRef.current;
    const img = photoRef.current;
    if (!lm || !img) return;
    try {
      await setRunningMode('IMAGE');
      const res = lm.detect(img);
      const torso = extractTorso(res.landmarks?.[0]);
      torsoRef.current = torso;
      setBodyFound(!!torso);
      placementRef.current = null;
    } catch (e) {
      console.error('Photo detection failed', e);
    }
  }, [setRunningMode]);

  // Re-run photo detection once the model arrives after the photo.
  useEffect(() => {
    if (mode === 'photo' && hasPhoto && modelState === 'ready') detectPhoto();
  }, [mode, hasPhoto, modelState, detectPhoto]);

  useEffect(() => {
    if (mode === 'camera' && modelState === 'ready') setRunningMode('VIDEO').catch(() => {});
  }, [mode, modelState, setRunningMode]);

  // Render loop: background (camera or photo) + garment.
  useEffect(() => {
    if (!open || mode === 'choose') return;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mirror = mode === 'camera';
      let source: HTMLVideoElement | HTMLImageElement | null = null;
      let sw = 0;
      let sh = 0;
      if (mode === 'camera') {
        const v = webcamRef.current?.video;
        if (!v || v.readyState < 2 || !v.videoWidth) return;
        source = v;
        sw = v.videoWidth;
        sh = v.videoHeight;
      } else {
        const img = photoRef.current;
        if (!img) return;
        source = img;
        sw = img.naturalWidth;
        sh = img.naturalHeight;
      }

      const maxW = 1280;
      const W = Math.min(maxW, sw);
      const H = Math.round((sh / sw) * W);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      ctx.save();
      if (mirror) {
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, W, H);
      ctx.restore();

      // Live pose detection (~15 fps).
      const lm = landmarkerRef.current;
      if (mode === 'camera' && lm && runningModeRef.current === 'VIDEO') {
        const now = performance.now();
        if (now - lastDetectRef.current > 66) {
          lastDetectRef.current = now;
          try {
            const res = lm.detectForVideo(source as HTMLVideoElement, now);
            const torso = extractTorso(res.landmarks?.[0]);
            torsoRef.current = torso;
            const found = !!torso;
            if (found !== bodyFoundRef.current) {
              bodyFoundRef.current = found;
              setBodyFound(found);
            }
          } catch {
            /* skip frame */
          }
        }
      }

      const g = garmentRef.current;
      if (!g) return;
      const line = g.trimmed ? SHOULDER_LINE_TRIMMED : SHOULDER_LINE;
      const compute = (t: TorsoLandmarks | null) =>
        computeAutoPlacement({
          leftShoulder: t?.l,
          rightShoulder: t?.r,
          leftHip: t?.lh,
          rightHip: t?.rh,
          canvasW: W,
          canvasH: H,
          garmentAspect: g.aspect,
          shoulderLine: line,
          mirror,
        });
      const target = autoFitRef.current
        ? nextAutoTarget(placementRef.current, torsoRef.current, compute, line)
        : compute(null);
      placementRef.current = smoothPlacement(placementRef.current, target, mode === 'camera' ? 0.35 : 1);
      const p = applyAdjust(placementRef.current, adjustRef.current, W, H);

      ctx.save();
      ctx.translate(p.cx, p.cy);
      ctx.rotate(p.angle);
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(g.source, -p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open, mode]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a photo (JPG or PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo must be under 10 MB');
      return;
    }
    setPhotoLoading(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      photoRef.current = img;
      torsoRef.current = null;
      placementRef.current = null;
      setBodyFound(false);
      setHasPhoto(true);
      setPhotoLoading(false);
      setMode('photo');
    };
    img.onerror = () => {
      setPhotoLoading(false);
      toast.error('Could not read that photo');
    };
    img.src = url;
  };

  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width) return;
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pad = Math.round(canvas.width * 0.02);
        ctx.save();
        ctx.font = `600 ${Math.max(14, Math.round(canvas.width * 0.022))}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.textAlign = 'right';
        ctx.fillText('Trendra Try-On', canvas.width - pad, canvas.height - pad);
        ctx.restore();
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Snapshot failed, please try again');
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `trendra-tryon-${Date.now()}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast.success('Snapshot saved');
      }, 'image/png');
    } catch {
      toast.error('This product photo blocks downloads. Try another photo of the product.');
    }
  };

  const loadingCamera = mode === 'camera' && !cameraReady && !cameraError;
  const stageReady = (mode === 'camera' && cameraReady) || (mode === 'photo' && hasPhoto);

  const statusChip = (() => {
    if (!stageReady) return null;
    if (modelState === 'loading')
      return { icon: Loader2, text: 'Loading AI body fit…', tone: 'muted', spin: true };
    if (modelState === 'failed') return { icon: AlertTriangle, text: 'Auto-fit unavailable — use the sliders', tone: 'warn' };
    if (!autoFit) return { icon: ScanLine, text: 'Manual fit', tone: 'muted' };
    if (bodyFound) return { icon: CheckCircle2, text: 'Body detected — fitting live', tone: 'ok' };
    return {
      icon: ScanLine,
      text: mode === 'camera' ? 'Step back so both shoulders are visible' : 'Shoulders not found — adjust manually',
      tone: 'warn',
    };
  })();

  const sliders: { key: keyof TryOnAdjust; label: string; min: number; max: number; unit: string }[] = [
    { key: 'scale', label: 'Scale', min: 50, max: 200, unit: '%' },
    { key: 'offsetX', label: 'Position X', min: -40, max: 40, unit: '' },
    { key: 'offsetY', label: 'Position Y', min: -40, max: 40, unit: '' },
    { key: 'rotation', label: 'Rotation', min: -45, max: 45, unit: '°' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[calc(100vw-1rem)] max-h-[94vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b text-left">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Virtual Try-On
          </DialogTitle>
          <DialogDescription className="line-clamp-1">See how “{productName}” looks on you.</DialogDescription>
        </DialogHeader>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} aria-label="Upload a full-body photo" />

        {mode === 'choose' ? (
          <div className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('camera')}
                className="group text-left rounded-xl border-2 border-border p-5 transition-all hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="font-semibold text-foreground">Use Live Camera</p>
                <p className="text-sm text-muted-foreground mt-1">The garment follows you in real time as you move.</p>
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoLoading}
                className="group text-left rounded-xl border-2 border-border p-5 transition-all hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                  {photoLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                </div>
                <p className="font-semibold text-foreground">Upload a Full-Body Photo</p>
                <p className="text-sm text-muted-foreground mt-1">Stand straight, face the camera, shoulders visible.</p>
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your camera and photos stay on your device — nothing is uploaded or saved.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_300px]">
            {/* Stage */}
            <div className="relative bg-muted flex items-center justify-center min-h-[300px] md:min-h-[480px]">
              {mode === 'camera' && !cameraError && (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={false}
                  playsInline
                  videoConstraints={{ facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }}
                  onUserMedia={() => setCameraReady(true)}
                  onUserMediaError={(err) => {
                    const name = typeof err === 'string' ? err : (err as DOMException)?.name;
                    setCameraError(
                      name === 'NotAllowedError'
                        ? 'Camera permission was blocked. Allow camera access in your browser, or upload a photo instead.'
                        : 'No camera found on this device. You can upload a photo instead.',
                    );
                  }}
                  className="absolute h-px w-px opacity-0 pointer-events-none"
                />
              )}

              <canvas
                ref={canvasRef}
                className={cn('max-h-[60vh] md:max-h-[70vh] w-full h-auto object-contain', !stageReady && 'hidden')}
                aria-label="Try-on preview"
              />

              {loadingCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Camera className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Starting your camera…</p>
                  <p className="text-xs">Tap “Allow” if your browser asks.</p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-foreground max-w-xs">{cameraError}</p>
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Upload a photo
                  </Button>
                </div>
              )}

              {statusChip && (
                <div
                  className={cn(
                    'absolute top-3 left-3 right-3 sm:right-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur bg-background/85',
                    statusChip.tone === 'ok' && 'text-primary',
                    statusChip.tone === 'warn' && 'text-destructive',
                    statusChip.tone === 'muted' && 'text-muted-foreground',
                  )}
                  role="status"
                >
                  <statusChip.icon className={cn('h-4 w-4 shrink-0', statusChip.spin && 'animate-spin')} />
                  <span className="truncate">{statusChip.text}</span>
                </div>
              )}

              {stageReady && (
                <Button
                  onClick={takeSnapshot}
                  size="lg"
                  className="btn-deal absolute bottom-4 left-1/2 -translate-x-1/2 shadow-xl rounded-full px-6"
                >
                  <Download className="h-5 w-5 mr-2" /> Take Snapshot
                </Button>
              )}
            </div>

            {/* Controls */}
            <div className="p-5 space-y-5 border-t md:border-t-0 md:border-l">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMode('choose')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {mode === 'photo' ? (
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> New photo
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> Use photo
                  </Button>
                )}
              </div>

              {images.length > 1 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Garment photo</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {images.map((img, i) => (
                      <button
                        key={img + i}
                        type="button"
                        aria-label={`Use product photo ${i + 1}`}
                        onClick={() => {
                          setGarmentIdx(i);
                          placementRef.current = null;
                        }}
                        className={cn(
                          'h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                          garmentIdx === i ? 'border-primary' : 'border-transparent hover:border-muted-foreground',
                        )}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tryon-autofit" className="text-sm">Auto-fit to my body</Label>
                  <Switch id="tryon-autofit" checked={autoFit} onCheckedChange={setAutoFit} disabled={modelState === 'failed'} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tryon-bg" className="text-sm">Remove photo background</Label>
                  <Switch id="tryon-bg" checked={removeBg} onCheckedChange={setRemoveBg} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Fine-tune fit</p>
                  <Button variant="ghost" size="sm" onClick={() => setAdjust(DEFAULT_ADJUST)} className="h-7 px-2 text-xs">
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                  </Button>
                </div>
                {sliders.map((s) => (
                  <div key={s.key} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium tabular-nums">
                        {adjust[s.key]}
                        {s.unit}
                      </span>
                    </div>
                    <Slider
                      aria-label={s.label}
                      min={s.min}
                      max={s.max}
                      step={1}
                      value={[adjust[s.key]]}
                      onValueChange={([v]) => setAdjust((a) => ({ ...a, [s.key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Tip: good lighting and a plain wall behind you give the best fit. Flat product photos (without a model) look most realistic.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VirtualTryOn;
