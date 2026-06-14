## Goal
Make the "Exclusive Collection" hero section and the banner slider shorter on mobile (wider-than-tall, around 4:3 ratio) instead of the current tall layout.

## Changes

### 1. `src/components/home/HeroSection.tsx`
- Constrain the hero to a fixed aspect ratio on mobile (~4:3) so it's wider than tall rather than a long vertical block.
- Reduce vertical padding on mobile: change `py-10 md:py-16` → `py-5 md:py-12`.
- Scale down heading & stats spacing on mobile:
  - Heading: `text-4xl md:text-6xl` → `text-2xl md:text-6xl`, `mb-4` → `mb-2`
  - Badge: `mb-6` → `mb-3`
  - Subtitle: `mb-8` → `mb-4`, smaller text on mobile
  - Stats row: `mt-10` → `mt-5`, smaller gap
- Result: compact, premium hero card with ~4:3 footprint on phones, original look preserved on desktop.

### 2. `src/components/home/BannerSlider.tsx`
- Current fallback uses `aspect-[21/9] md:aspect-[3/1]` (very wide & short — that's fine).
- Real banners use `<img className="w-full h-auto object-contain" />` which can become very tall on mobile depending on the uploaded image.
- Wrap the image in a fixed aspect-ratio container on mobile: `aspect-[4/3] md:aspect-[3/1]` with `object-cover` so the banner is shorter and consistent regardless of source image dimensions.

## Notes
- Pure presentation/CSS changes — no logic, data, or routes touched.
- Desktop layout remains unchanged.
