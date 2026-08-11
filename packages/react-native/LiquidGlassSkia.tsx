/**
 * LiquidLens — React Native port · <LiquidGlassSkia>  (EXPERIMENTAL)
 * =====================================================================
 * The REAL Liquid Glass: true edge refraction on native, powered by
 * `@shopify/react-native-skia`. This is the RN equivalent of the web core's
 * Chromium-only refraction path — it runs the exact same optical model
 * (rounded-rect SDF → squircle edge → Snell refraction → magnifying rim) as a
 * live GPU runtime shader instead of a baked SVG displacement map.
 *
 * How it works:
 *   Skia's <BackdropFilter> hands us everything already painted behind the
 *   node as an implicit input; we wrap it in an image/backdrop shader and feed
 *   it to our SkSL fragment shader (see shader.sksl.ts), which displaces the
 *   backdrop pixels near the rounded edge. A rounded-rect clip keeps the effect
 *   inside the glass shape.
 *
 * Cost & caveats (why this is marked experimental):
 *   - Per-pixel Snell math + multi-tap sampling every frame is GPU-heavy.
 *     Prefer modest sizes and avoid animating many instances at once.
 *   - Requires the New Architecture / a Skia-capable RN setup.
 *   - Fidelity target is "Chromium-equivalent", not pixel-identical to CoreUI.
 *
 * For a cheap, universally-supported glassmorphism look (blur + tint + rim,
 * but no refraction), use the sibling <LiquidGlass> component instead.
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Canvas,
  BackdropFilter,
  RuntimeShader,
  Skia,
  vec,
} from '@shopify/react-native-skia';

import { LIQUID_GLASS_SKSL } from './shader.sksl';
import { TINTS, type LiquidGlassTint, type LiquidGlassVariant } from './tints';

// Compile the runtime effect once at module load; reuse across instances.
const EFFECT = Skia.RuntimeEffect.Make(LIQUID_GLASS_SKSL);
if (__DEV__ && !EFFECT) {
  // A null here means the SkSL failed to compile — surfaced early in dev.
  // eslint-disable-next-line no-console
  console.error('[LiquidLens] Failed to compile Liquid Glass SkSL shader.');
}

/* ------------------------------------------------------------------ *
 * Profile normalisation constant
 * ------------------------------------------------------------------ *
 * The web core normalises the refraction profile so its peak displacement is
 * 1.0 (buildProfile → divide by max). We reproduce that here so `refraction`
 * means the same number of pixels on both platforms, then pass the constant
 * to the shader as `uProfileMax`.
 */
function computeProfileMax(samples = 128): number {
  const nRatio = 1 / 1.5;
  const eps = 0.001;
  const h = (u: number) => {
    const c = Math.min(Math.max(u, 0), 1);
    return Math.pow(1 - Math.pow(1 - c, 4), 1 / 4);
  };
  let max = 0;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const slope = (h(t + eps) - h(t - eps)) / (2 * eps);
    const th1 = Math.atan(slope);
    const th2 = Math.asin(Math.min(1, nRatio * Math.sin(th1)));
    const d = Math.tan(th1 - th2);
    if (d > max) max = d;
  }
  return max || 1;
}
const PROFILE_MAX = computeProfileMax();

/* ------------------------------------------------------------------ *
 * Props
 * ------------------------------------------------------------------ */

export interface LiquidGlassSkiaProps {
  /** Width of the glass surface in px. */
  width: number;
  /** Height of the glass surface in px. */
  height: number;
  /** Material variant. `clear` halves the refraction for a thinner look. */
  variant?: LiquidGlassVariant;
  /** Corner radius in px. Default `28`. */
  radius?: number;
  /** Refraction strength in px (feDisplacementMap "scale"). Default `18`. */
  refraction?: number;
  /** Refracting edge band width in px. Default `22`. */
  bezel?: number;
  /** Cheap edge softening in px applied to the backdrop sampling. Default `1`. */
  blur?: number;
  /** Semantic tint preset. */
  tint?: LiquidGlassTint;
  /** Extra style for the wrapping container (e.g. positioning). */
  style?: StyleProp<ViewStyle>;
  /** Content rendered above the glass. */
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

/**
 * `<LiquidGlassSkia>` — true-refraction glass over whatever Skia has painted
 * behind it. Because it refracts the *backdrop*, it must sit above the content
 * it should distort; typically you stack it over a Skia scene or an image.
 */
export function LiquidGlassSkia({
  width,
  height,
  variant = 'regular',
  radius = 28,
  refraction = 18,
  bezel = 22,
  blur = 1,
  tint,
  style,
  children,
}: LiquidGlassSkiaProps) {
  const isClear = variant === 'clear';

  // Clear glass refracts less (mirrors the web core's `refraction * 0.5`).
  const scale = isClear ? refraction * 0.5 : refraction;

  // Resolve the tint preset to an RGBA the shader can layer in.
  const t = tint ? TINTS[tint] : null;
  const tintVec = t
    ? [t.r, t.g, t.b, isClear ? t.a * 0.6 : t.a]
    : [0, 0, 0, 0];

  // Uniforms in the order the SkSL declares them.
  const uniforms = React.useMemo(
    () => ({
      uResolution: vec(width, height),
      uRadius: radius,
      uBezel: bezel,
      uScale: scale,
      uProfileMax: PROFILE_MAX,
      uBlur: blur,
      uTint: tintVec,
    }),
    [width, height, radius, bezel, scale, blur, tintVec],
  );

  if (!EFFECT) {
    // Shader unavailable (compile failure / unsupported): render children only.
    return <View style={[{ width, height }, style]}>{children}</View>;
  }

  return (
    <View style={[{ width, height }, style]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/*
          BackdropFilter snapshots everything painted behind this node and runs
          it through an IMAGE FILTER. `RuntimeShader` wraps our SkSL runtime
          effect as that image filter (SkImageFilters::RuntimeShader): the
          backdrop snapshot is bound to the SkSL's first declared child shader
          (`uniform shader uBackdrop`), in local pixel coordinates. The SkSL
          returns transparent outside the rounded-rect, so no explicit clip is
          needed. Note: children of BackdropFilter draw ABOVE the filtered
          backdrop — we intentionally render none here.
        */}
        <BackdropFilter
          filter={<RuntimeShader source={EFFECT} uniforms={uniforms} />}
        />
      </Canvas>

      {/* Foreground content, above the glass. */}
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiquidGlassSkia;
