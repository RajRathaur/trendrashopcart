import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, RotateCcw, Zap } from 'lucide-react';
import {
  loadSettings,
  saveSettings,
  resetSettings,
  detectLowPowerDevice,
  DEFAULT_SETTINGS,
  type AnimationSettings,
  type StickerConfig,
  type StickerAnimation,
} from '@/lib/animationSettings';
import { FloatingStickers } from '@/components/home/FloatingStickers';

const HERO_STYLES = [
  { value: 'cinematic', label: 'Cinematic Sequence (default premium)' },
  { value: 'kenBurns', label: 'Ken Burns Split (dual slow-zoom)' },
  { value: 'crossfade', label: 'Soft Crossfade (calm)' },
  { value: 'staticSplit', label: 'Static Split (no motion)' },
];

const DELIVERY_STYLES = [
  { value: 'classic', label: 'Classic Dark Road' },
  { value: 'neon', label: 'Neon Night' },
  { value: 'minimal', label: 'Minimal Light' },
];

const FLASH_STYLES = [
  { value: 'pulse', label: 'Pulse Ring' },
  { value: 'glow', label: 'Icon Glow' },
  { value: 'marquee', label: 'Scrolling Marquee' },
  { value: 'plain', label: 'Plain (no motion)' },
];

const SPEEDS = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

const PERF_MODES = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'high', label: 'Always High Quality' },
  { value: 'low', label: 'Always Low (battery saver)' },
];

const STICKER_ANIMATIONS: { value: StickerAnimation; label: string }[] = [
  { value: 'floatY', label: 'Float Up-Down' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'driveAcross', label: 'Drive Across Screen' },
  { value: 'spin', label: 'Spin' },
  { value: 'wobble', label: 'Wobble' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'pulse', label: 'Pulse (scale)' },
  { value: 'swing', label: 'Swing' },
];

const AdminAnimations = () => {
  const [settings, setSettings] = useState<AnimationSettings>(() => loadSettings());
  const detected = detectLowPowerDevice();

  const update = (patch: Partial<AnimationSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };
  const updateHero = (patch: Partial<AnimationSettings['hero']>) =>
    update({ hero: { ...settings.hero, ...patch } });
  const updateRoad = (patch: Partial<AnimationSettings['deliveryRoad']>) =>
    update({ deliveryRoad: { ...settings.deliveryRoad, ...patch } });
  const updateFlash = (patch: Partial<AnimationSettings['flashSale']>) =>
    update({ flashSale: { ...settings.flashSale, ...patch } });

  const updateSticker = (id: string, patch: Partial<StickerConfig>) => {
    const stickers = settings.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s));
    update({ stickers });
  };
  const removeSticker = (id: string) =>
    update({ stickers: settings.stickers.filter((s) => s.id !== id) });
  const addSticker = () => {
    const s: StickerConfig = {
      id: `sticker-${Date.now()}`,
      name: 'New Sticker',
      imageUrl: '',
      enabled: false,
      animation: 'floatY',
      sizePx: 72,
      xPercent: 50,
      yPercent: 50,
      durationSec: 4,
      opacity: 1,
      rotateDeg: 0,
    };
    update({ stickers: [...settings.stickers, s] });
  };

  const onImageUpload = (id: string, file: File) => {
    if (file.size > 800 * 1024) {
      toast.error('Image too large. Please use an image under 800KB (stored in browser).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSticker(id, { imageUrl: String(reader.result) });
      toast.success('Sticker image updated');
    };
    reader.readAsDataURL(file);
  };

  const doReset = () => {
    resetSettings();
    setSettings(DEFAULT_SETTINGS);
    toast.success('Reset to defaults');
  };

  return (
    <AdminLayout>
      {/* Live preview of stickers even while editing */}
      <FloatingStickers />

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" /> Animations & Stickers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Change homepage animation styles and floating stickers any time. Saved in your browser (localStorage).
            </p>
          </div>
          <Button variant="outline" onClick={doReset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset Defaults
          </Button>
        </div>

        {/* Device / performance banner */}
        <Card className={detected.low ? 'border-amber-500/60' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Device Performance
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  detected.low
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {detected.low ? 'Low-power device detected' : 'Smooth animations OK'}
              </span>
            </CardTitle>
            <CardDescription>
              Detection signals: {detected.reason}. In Auto mode heavy animations are downgraded automatically on slow phones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Performance Mode</Label>
            <Select value={settings.performance} onValueChange={(v) => update({ performance: v as never })}>
              <SelectTrigger className="mt-2 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERF_MODES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs defaultValue="hero">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="road">Delivery Road</TabsTrigger>
            <TabsTrigger value="flash">Flash Sale</TabsTrigger>
            <TabsTrigger value="stickers">Stickers</TabsTrigger>
          </TabsList>

          {/* HERO */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Homepage Hero Animation</CardTitle>
                <CardDescription>Choose the premium animation style for the top hero banner.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToggleRow
                  label="Enable hero animation"
                  checked={settings.hero.enabled}
                  onChange={(v) => updateHero({ enabled: v })}
                />
                <div>
                  <Label>Animation Style</Label>
                  <Select value={settings.hero.style} onValueChange={(v) => updateHero({ style: v as never })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HERO_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Speed</Label>
                  <Select value={settings.hero.speed} onValueChange={(v) => updateHero({ speed: v as never })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPEEDS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DELIVERY ROAD */}
          <TabsContent value="road">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Road Strip</CardTitle>
                <CardDescription>The animated road strip with vehicles under the hero.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToggleRow label="Enable delivery road" checked={settings.deliveryRoad.enabled} onChange={(v) => updateRoad({ enabled: v })} />
                <ToggleRow label="Show truck" checked={settings.deliveryRoad.showTruck} onChange={(v) => updateRoad({ showTruck: v })} />
                <ToggleRow label="Show scooter" checked={settings.deliveryRoad.showScooter} onChange={(v) => updateRoad({ showScooter: v })} />
                <div>
                  <Label>Style</Label>
                  <Select value={settings.deliveryRoad.style} onValueChange={(v) => updateRoad({ style: v as never })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DELIVERY_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Speed</Label>
                  <Select value={settings.deliveryRoad.speed} onValueChange={(v) => updateRoad({ speed: v as never })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPEEDS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FLASH SALE */}
          <TabsContent value="flash">
            <Card>
              <CardHeader>
                <CardTitle>Flash Sale Banner Style</CardTitle>
                <CardDescription>Motion style for the flash sale timer/banner.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Style</Label>
                  <Select value={settings.flashSale.style} onValueChange={(v) => updateFlash({ style: v as never })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FLASH_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STICKERS */}
          <TabsContent value="stickers">
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Floating Stickers</CardTitle>
                  <CardDescription>
                    Add decorative animated stickers like delivery boy, truck, boxes anywhere on the site.
                    Enabled ones show live everywhere.
                  </CardDescription>
                </div>
                <Button onClick={addSticker} className="gap-2"><Plus className="h-4 w-4" /> Add Sticker</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.stickers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No stickers yet. Click “Add Sticker”.</p>
                )}
                {settings.stickers.map((s) => (
                  <StickerRow
                    key={s.id}
                    s={s}
                    onChange={(p) => updateSticker(s.id, p)}
                    onRemove={() => removeSticker(s.id)}
                    onUpload={(f) => onImageUpload(s.id, f)}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <Label>{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const StickerRow = ({
  s,
  onChange,
  onRemove,
  onUpload,
}: {
  s: StickerConfig;
  onChange: (p: Partial<StickerConfig>) => void;
  onRemove: () => void;
  onUpload: (f: File) => void;
}) => {
  return (
    <div className="rounded-lg border p-4 space-y-4 bg-card/40">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {s.imageUrl ? (
              <img src={s.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No img</span>
            )}
          </div>
          <Input value={s.name} onChange={(e) => onChange({ name: e.target.value })} className="max-w-[220px]" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={s.enabled} onCheckedChange={(v) => onChange({ enabled: v })} />
          <Button variant="ghost" size="icon" onClick={onRemove} title="Remove">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Image</Label>
          <div className="flex items-center gap-2 mt-1">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer text-sm hover:bg-muted">
              <Upload className="h-3.5 w-3.5" /> Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
              />
            </label>
            <Input
              placeholder="Or paste image URL"
              value={s.imageUrl.startsWith('data:') ? '' : s.imageUrl}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Animation</Label>
          <Select value={s.animation} onValueChange={(v) => onChange({ animation: v as StickerAnimation })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STICKER_ANIMATIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <SliderField label={`Size: ${s.sizePx}px`} min={24} max={200} step={2} value={s.sizePx} onChange={(v) => onChange({ sizePx: v })} />
        <SliderField label={`Duration: ${s.durationSec}s`} min={1} max={40} step={0.5} value={s.durationSec} onChange={(v) => onChange({ durationSec: v })} />
        <SliderField label={`Position X: ${s.xPercent}%`} min={0} max={100} step={1} value={s.xPercent} onChange={(v) => onChange({ xPercent: v })} />
        <SliderField label={`Position Y: ${s.yPercent}%`} min={0} max={100} step={1} value={s.yPercent} onChange={(v) => onChange({ yPercent: v })} />
        <SliderField label={`Opacity: ${s.opacity.toFixed(2)}`} min={0.1} max={1} step={0.05} value={s.opacity} onChange={(v) => onChange({ opacity: v })} />
        <SliderField label={`Rotate: ${s.rotateDeg}°`} min={-180} max={180} step={5} value={s.rotateDeg} onChange={(v) => onChange({ rotateDeg: v })} />
      </div>
    </div>
  );
};

const SliderField = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Slider className="mt-2" min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0])} />
  </div>
);

export default AdminAnimations;
