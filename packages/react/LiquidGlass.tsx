/**
 * LiquidLens — React port · <LiquidGlass>
 * =====================================================================
 * A thin, idiomatic React wrapper around the framework-agnostic web core
 * (`@liquidlens/core`). The core is a UMD module that exposes a global
 * `window.LiquidGlass` and does the heavy lifting: it generates a per-element
 * SVG displacement map and wires it up as a `backdrop-filter` to produce
 * genuine edge refraction (on Chromium) plus specular/tint/depth layers.
 *
 * This component's job is small and declarative:
 *   1. Render an element that the core recognises: it always carries the
 *      `lg-glass` class and the `data-glass` attribute.
 *   2. Translate React props into the class names / data-* attributes /
 *      CSS custom properties the core and its stylesheet already understand.
 *   3. Call `LiquidGlass.apply()` on the DOM node after mount and whenever
 *      the element resizes (the displacement map is size-dependent).
 *
 * Usage:
 *   import { LiquidGlass } from '@liquidlens/react';
 *   import '@liquidlens/core/liquid-glass.css';
 *
 *   <LiquidGlass variant="regular" radius={28} tint="blue" interactive>
 *     Hello
 *   </LiquidGlass>
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

// Side-effect import: evaluating the UMD bundle registers `window.LiquidGlass`.
// (Bundlers keep this even though we don't bind its return value.)
import '@liquidlens/core/liquid-glass.js';

/* ------------------------------------------------------------------ *
 * Core engine types + access
 * ------------------------------------------------------------------ */

/** The subset of the core engine API this port relies on. */
export interface LiquidGlassEngine {
  init(options?: Partial<LiquidGlassOptions>): LiquidGlassEngine;
  apply(el: Element, opts?: Partial<LiquidGlassOptions>): void;
  applyAll(): void;
  set(partial: Partial<LiquidGlassOptions>): void;
  refresh(el: Element): void;
  destroy(): void;
  state: LiquidGlassOptions;
}

/** Global material parameters accepted by the core engine. */
export interface LiquidGlassOptions {
  /** feDisplacementMap scale (px) — edge bend strength. */
  refraction: number;
  /** Width (px) of the refracting edge band. */
  bezel: number;
  /** Backdrop blur (px). Keep low (0–4) or refraction is washed out. */
  blur: number;
  /** Backdrop `saturate()` multiplier. */
  saturation: number;
  /** Rim/highlight intensity 0..1.5. */
  specular: number;
  /** Tint hue 0..360. */
  tintHue: number;
  /** Tint alpha 0..0.4. */
  tintOpacity: number;
  /** Max displacement-map dimension (perf cap). */
  quality: number;
  /** If true, specular tracks DeviceOrientation (mobile tilt). */
  tilt: boolean;
}

/**
 * Resolve the global engine registered by the UMD core. Returns `null`
 * during SSR (no `window`) so callers can no-op safely.
 */
export function getEngine(): LiquidGlassEngine | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { LiquidGlass?: LiquidGlassEngine }).LiquidGlass ?? null;
}

/* ------------------------------------------------------------------ *
 * Component props
 * ------------------------------------------------------------------ */

/** Semantic tint presets, mapped to the core's `.lg-tint-*` helper classes. */
export type LiquidGlassTint = 'blue' | 'green' | 'red' | 'purple' | 'amber';

/** Material variant. `clear` is a thinner, more transparent glass. */
export type LiquidGlassVariant = 'regular' | 'clear';

export interface LiquidGlassOwnProps {
  /**
   * Material variant. `clear` adds the `lg-clear` class and renders a
   * darkening scrim so foreground content stays legible. Default `'regular'`.
   */
  variant?: LiquidGlassVariant;
  /** Corner radius in px. Sets the `--lg-radius` custom property. */
  radius?: number;
  /** Per-element edge bend strength → `data-lg-refraction`. */
  refraction?: number;
  /** Per-element refracting band width → `data-lg-bezel`. */
  bezel?: number;
  /** Per-element backdrop blur → `data-lg-blur`. */
  blur?: number;
  /** Semantic tint preset → `.lg-tint-*` class. */
  tint?: LiquidGlassTint;
  /**
   * Enable hover-lift + press feedback (adds `lg-interactive` and `lg-press`).
   * Use for buttons, pills, and other tappable surfaces.
   */
  interactive?: boolean;
  /**
   * Render as a different intrinsic element (polymorphic). Default `'div'`.
   * e.g. `as="button"`, `as="section"`, `as="a"`.
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Full prop set: our own props plus the native attributes of whichever
 * element `as` selects (defaults to a `<div>`). We omit the keys we own so
 * they can't collide with the intrinsic element's attributes.
 */
export type LiquidGlassProps = LiquidGlassOwnProps &
  Omit<React.HTMLAttributes<HTMLElement>, keyof LiquidGlassOwnProps>;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Join truthy class-name fragments. */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// `useLayoutEffect` warns during SSR; fall back to `useEffect` on the server.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

/**
 * `<LiquidGlass>` — a declarative glass surface.
 *
 * Forwards its ref to the underlying DOM node so callers can measure it or
 * call `getEngine()?.refresh(node)` after imperative layout changes.
 */
export const LiquidGlass = forwardRef<HTMLElement, LiquidGlassProps>(
  function LiquidGlass(
    {
      variant = 'regular',
      radius,
      refraction,
      bezel,
      blur,
      tint,
      interactive = false,
      as,
      className,
      style,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const Tag = (as ?? 'div') as React.ElementType;
    const innerRef = useRef<HTMLElement | null>(null);

    // Expose the DOM node on the forwarded ref while keeping our own handle.
    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLElement, []);

    const isClear = variant === 'clear';

    // (Re)apply the material whenever the node mounts or its size changes.
    // The displacement map is generated from the element's live dimensions,
    // so a ResizeObserver keeps the refraction crisp across layout changes.
    useIsomorphicLayoutEffect(() => {
      const node = innerRef.current;
      const engine = getEngine();
      if (!node || !engine) return;

      // Initial pass (also covers the case where the core's global
      // `init()` scan ran before this element existed).
      engine.apply(node);

      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(() => engine.apply(node));
      ro.observe(node);
      return () => ro.disconnect();
      // Re-run when any prop that changes the rendered attributes changes,
      // so the core re-reads the new data-* overrides.
    }, [variant, radius, refraction, bezel, blur, tint]);

    const mergedClassName = cx(
      'lg-glass',
      isClear && 'lg-clear',
      tint && `lg-tint-${tint}`,
      interactive && 'lg-interactive',
      interactive && 'lg-press',
      className,
    );

    // `--lg-radius` is a CSS custom property; cast keeps TS happy.
    const mergedStyle: React.CSSProperties = {
      ...(radius != null
        ? ({ ['--lg-radius' as string]: `${radius}px` } as React.CSSProperties)
        : null),
      ...style,
    };

    return (
      <Tag
        ref={innerRef}
        className={mergedClassName}
        style={mergedStyle}
        // The core scans for this attribute and observes these nodes.
        data-glass=""
        // Per-element overrides read by the engine's `apply()`.
        data-glass-variant={isClear ? 'clear' : undefined}
        data-lg-refraction={refraction}
        data-lg-bezel={bezel}
        data-lg-blur={blur}
        {...rest}
      >
        {/* Clear glass gets a scrim as its first layer to preserve contrast. */}
        {isClear ? <span className="lg-scrim" aria-hidden="true" /> : null}
        {children}
      </Tag>
    );
  },
);

export default LiquidGlass;
