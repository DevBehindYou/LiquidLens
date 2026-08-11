/**
 * LiquidLens — React Native port · <LiquidGlass>  (blur / glassmorphism)
 * =====================================================================
 * React Native has no CSS `backdrop-filter`, so we can't do the web core's
 * SVG-displacement refraction here. This component delivers the *material* —
 * translucency, tint, a specular rim, and depth — using standard RN
 * primitives plus a native blur view. It reads as high-quality
 * "glassmorphism": frosted and layered, but WITHOUT the magnifying edge
 * refraction. For true Liquid Glass refraction, use <LiquidGlassSkia>.
 *
 * Layers (bottom → top), mirroring the web core's material anatomy:
 *   BlurView            translucent frosted backdrop (expo-blur)
 *   tint overlay        semantic environment colour
 *   specular gradient   moving/edge highlight (LinearGradient)
 *   rim border          1px light edge (approximates ::before specular rim)
 *   content             your children, lifted above the glass
 * Rounded corners come from `borderRadius` + `overflow: 'hidden'`; the drop
 * shadow lives on an outer wrapper so it isn't clipped.
 *
 * ── DEPENDENCIES ─────────────────────────────────────────────────────
 *   Blur:      `expo-blur` (BlurView).  See README for the drop-in fallback
 *              to `@react-native-community/blur` if you're bare React Native.
 *   Gradient:  `expo-linear-gradient` (or `react-native-linear-gradient`).
 */

import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// expo-blur. Bare RN? Swap for:
//   import { BlurView } from '@react-native-community/blur';
// and map `intensity` (0..100) → `blurAmount` (0..~25), `tint` → `blurType`.
import { BlurView } from 'expo-blur';

// expo-linear-gradient. Bare RN? Swap for:
//   import LinearGradient from 'react-native-linear-gradient';
import { LinearGradient } from 'expo-linear-gradient';

import { TINTS, type LiquidGlassTint, type LiquidGlassVariant } from './tints';

/* ------------------------------------------------------------------ *
 * Props
 * ------------------------------------------------------------------ */

export interface LiquidGlassProps {
  /**
   * Material variant. `clear` is thinner (less blur, lighter tint) and adds a
   * subtle darkening scrim so foreground content stays legible. Default
   * `'regular'`.
   */
  variant?: LiquidGlassVariant;
  /** Corner radius in px. Default `28`. */
  radius?: number;
  /**
   * Blur intensity, 0..100 (expo-blur's `intensity`). Defaults to `40`
   * (regular) / `18` (clear).
   */
  blurAmount?: number;
  /** Semantic tint preset (`blue`, `green`, `red`, `purple`, `amber`). */
  tint?: LiquidGlassTint;
  /** Style for the surface (padding, size, positioning, etc.). */
  style?: StyleProp<ViewStyle>;
  /** Content rendered above the glass layers. */
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export function LiquidGlass({
  variant = 'regular',
  radius = 28,
  blurAmount,
  tint,
  style,
  children,
}: LiquidGlassProps) {
  const isClear = variant === 'clear';

  // Sensible per-variant blur defaults (kept low for clear glass).
  const intensity = blurAmount ?? (isClear ? 18 : 40);

  // Resolve the tint preset; clear glass tints more softly.
  const t = tint ? TINTS[tint] : null;
  const tintCss = t
    ? isClear
      ? `rgba(${Math.round(t.r * 255)}, ${Math.round(t.g * 255)}, ${Math.round(
          t.b * 255,
        )}, ${(t.a * 0.6).toFixed(3)})`
      : t.css
    : 'transparent';

  return (
    // Outer wrapper carries the (unclipped) drop shadow for depth.
    <View style={[styles.shadow, { borderRadius: radius }, style]}>
      {/* Clipping container: everything inside is rounded off. */}
      <View style={[styles.clip, { borderRadius: radius }]}>
        {/* 1. Frosted translucent backdrop. */}
        <BlurView
          intensity={intensity}
          tint={isClear ? 'light' : 'default'}
          style={StyleSheet.absoluteFill}
        />

        {/* 2. Environment tint. */}
        {tint ? (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: tintCss }]}
            pointerEvents="none"
          />
        ) : null}

        {/* 2b. Clear-variant scrim keeps foreground text legible. */}
        {isClear ? (
          <LinearGradient
            colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.10)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        ) : null}

        {/* 3. Moving/edge specular highlight (top-left → bottom-right sweep). */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.55)',
            'rgba(255,255,255,0.06)',
            'rgba(255,255,255,0.0)',
            'rgba(255,255,255,0.12)',
          ]}
          locations={[0, 0.22, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* 4. Specular rim: a hairline light border (≈ the web ::before rim). */}
        <View
          style={[styles.rim, { borderRadius: radius }]}
          pointerEvents="none"
        />

        {/* 5. Your content, above the glass. */}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    // Adaptive drop shadow (iOS) + elevation (Android) for depth.
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    backgroundColor: 'transparent',
  },
  clip: {
    overflow: 'hidden',
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  content: {
    // Sits above the absolute-fill glass layers.
    zIndex: 1,
  },
});

export default LiquidGlass;
