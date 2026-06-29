import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Guardrail test: the cinematic hero animation must play ONCE per page load.
 * If a future change re-introduces `repeat: -1` or `yoyo: true` on the main
 * timeline (gsap.timeline(...)), this test fails.
 *
 * The decorative ambient glow (.cine-glow) is allowed to loop — that is a
 * separate gsap.to() call, not the main timeline.
 */
describe('CinematicHero one-time animation', () => {
  const source = readFileSync(
    resolve(__dirname, '../CinematicHero.tsx'),
    'utf8'
  );

  it('does not loop the main timeline', () => {
    // Extract the main timeline options block: gsap.timeline({ ... })
    const match = source.match(/gsap\.timeline\(\s*\{([\s\S]*?)\}\s*\)/);
    expect(match, 'main gsap.timeline(...) must exist').toBeTruthy();
    const timelineOpts = match![1];
    expect(timelineOpts).not.toMatch(/repeat\s*:\s*-1/);
    expect(timelineOpts).not.toMatch(/yoyo\s*:\s*true/);
  });

  it('exports admin-editable content config', () => {
    expect(source).toMatch(/export const contentConfig/);
  });
});
