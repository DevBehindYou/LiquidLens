/**
 * LiquidLens — React Native port · shared tint + variant types
 * =====================================================================
 * The semantic tint presets, mirrored from the web core's `.lg-tint-*`
 * helper classes (see core/liquid-glass.css). Colours are expressed as
 * 0..1 RGBA so they can be handed straight to a Skia shader, and there's a
 * convenience `css` string for the RN blur component's overlay <View>.
 */

export type LiquidGlassTint = 'blue' | 'green' | 'red' | 'purple' | 'amber';
export type LiquidGlassVariant = 'regular' | 'clear';

export interface TintColor {
  /** Red 0..1 */ r: number;
  /** Green 0..1 */ g: number;
  /** Blue 0..1 */ b: number;
  /** Alpha 0..1 */ a: number;
  /** Ready-to-use `rgba(...)` string for RN View backgrounds. */
  css: string;
}

/** HSL → RGB (all channels 0..1). h in degrees, s/l in 0..1. */
function hsl(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return { r: r + m, g: g + m, b: b + m };
}

/**
 * The core uses `hsla(hue, 40%, 70%, alpha)` for tints. We reproduce those
 * exact hues/alphas here so RN matches the web look.
 * (blue 212, green 145, red 2, purple 275, amber 38 — amber a touch stronger.)
 */
function make(hue: number, alpha: number): TintColor {
  const { r, g, b } = hsl(hue, 0.4, 0.7);
  const to255 = (v: number) => Math.round(v * 255);
  return {
    r,
    g,
    b,
    a: alpha,
    css: `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${alpha})`,
  };
}

export const TINTS: Record<LiquidGlassTint, TintColor> = {
  blue: make(212, 0.16),
  green: make(145, 0.16),
  red: make(2, 0.16),
  purple: make(275, 0.16),
  amber: make(38, 0.18),
};
