/**
 * LiquidLens — React port · hooks
 * =====================================================================
 * Two small hooks that sit on top of the web core:
 *
 *   useLiquidGlass(options?)  Initialise the engine once for the whole app
 *                             (idempotent) and get a `set()` for live control.
 *   useGlassRef(opts?)        A ref callback that applies glass to *any*
 *                             element — handy when you don't want the
 *                             <LiquidGlass> wrapper.
 */

import { useCallback, useEffect, useRef } from 'react';

// Side-effect import: registers `window.LiquidGlass`.
import '@liquidlens/core/liquid-glass.js';

import {
  getEngine,
  type LiquidGlassEngine,
  type LiquidGlassOptions,
} from './LiquidGlass';

/* ------------------------------------------------------------------ *
 * Module-level init guard
 * ------------------------------------------------------------------ *
 * The core's `init()` wires global listeners (resize, pointer, mutation
 * observer) and should run exactly once per document, no matter how many
 * components call the hook. We guard with a module-scoped flag rather than
 * component state so the guarantee holds across the whole tree.
 */
let didInit = false;

function ensureInit(
  engine: LiquidGlassEngine,
  options?: Partial<LiquidGlassOptions>,
): void {
  if (didInit) {
    // Already initialised elsewhere — just merge any new params.
    if (options) engine.set(options);
    return;
  }
  didInit = true;
  engine.init(options);
}

/* ------------------------------------------------------------------ *
 * useLiquidGlass
 * ------------------------------------------------------------------ */

export interface UseLiquidGlassResult {
  /**
   * Live-update global material parameters. Merges into the engine's state,
   * updates the CSS custom properties, and re-renders every glass element on
   * the next animation frame. Ideal for sliders / theme switches.
   */
  set: (partial: Partial<LiquidGlassOptions>) => void;
}

/**
 * Initialise the Liquid Glass engine once and return live controls.
 *
 * Call this near the root of your app (or anywhere — it's idempotent):
 *
 *   const { set } = useLiquidGlass({ refraction: 18, bezel: 22, blur: 3 });
 *   // later, from a slider:
 *   set({ refraction: value });
 */
export function useLiquidGlass(
  options?: Partial<LiquidGlassOptions>,
): UseLiquidGlassResult {
  // Keep the latest options in a ref so the init effect stays stable
  // (we intentionally init only once and don't re-init on option changes).
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const engine = getEngine();
    if (!engine) return; // SSR / core not loaded yet.
    ensureInit(engine, optionsRef.current);
    // No cleanup: the engine is a document-wide singleton and other
    // components may still depend on it. Call `getEngine()?.destroy()`
    // manually on full teardown if you really need to.
  }, []);

  const set = useCallback((partial: Partial<LiquidGlassOptions>) => {
    getEngine()?.set(partial);
  }, []);

  return { set };
}

/* ------------------------------------------------------------------ *
 * useGlassRef
 * ------------------------------------------------------------------ */

/**
 * Return a ref callback that turns any element into a glass surface and keeps
 * it fresh across resizes. Use it when you want the material without the
 * <LiquidGlass> component wrapper:
 *
 *   const ref = useGlassRef({ refraction: 24 });
 *   return <button ref={ref} className="lg-glass lg-btn" data-glass>Go</button>;
 *
 * Note: the element still needs the `lg-glass` class and `data-glass`
 * attribute (and the core CSS imported) for the full visual treatment.
 */
export function useGlassRef<T extends HTMLElement = HTMLElement>(
  opts?: Partial<LiquidGlassOptions>,
): (node: T | null) => void {
  // Track the active observer so we can disconnect when the node detaches.
  const cleanupRef = useRef<(() => void) | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  return useCallback((node: T | null) => {
    // Tear down any observer bound to the previous node.
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!node) return;
    const engine = getEngine();
    if (!engine) return;

    engine.apply(node, optsRef.current);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => engine.apply(node, optsRef.current));
      ro.observe(node);
      cleanupRef.current = () => ro.disconnect();
    }
  }, []);
}
