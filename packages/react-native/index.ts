/**
 * LiquidLens — React Native port · public entry point
 * =====================================================================
 * Two components ship here:
 *
 *   <LiquidGlass>       Blur + tint + rim (glassmorphism). Universal, cheap.
 *   <LiquidGlassSkia>   True edge refraction via Skia (experimental, costly).
 *
 * See README.md for the dependency matrix and when to reach for each.
 */

export { LiquidGlass, default } from './LiquidGlass';
export type { LiquidGlassProps } from './LiquidGlass';

export { LiquidGlassSkia } from './LiquidGlassSkia';
export type { LiquidGlassSkiaProps } from './LiquidGlassSkia';

export { LIQUID_GLASS_SKSL } from './shader.sksl';

export { TINTS } from './tints';
export type {
  LiquidGlassTint,
  LiquidGlassVariant,
  TintColor,
} from './tints';
