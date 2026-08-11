# 12 · FAQ

Short, direct answers to the questions people actually ask when adopting LiquidLens. Links point to the deep docs.

### Why does it look like just blur in Safari?

Because the genuine edge refraction is produced by an SVG filter used as a `backdrop-filter`, and **only Chromium browsers support that today** (Chrome, Edge, Arc, Brave, Opera). Safari and Firefox silently ignore the `url(#…)` token and keep the blur, tint, specular rim, moving highlight, and shadow — so it still reads as glass, just without the lensing. This is a web-engine gap, not a bug in LiquidLens. Native Apple platforms render true refraction everywhere. See **[07 · Browser Support](07-browser-support.md)**.

### Why is my glass invisible?

Two usual causes:

1. **Flat background.** Glass bends and blurs whatever is *behind* it. Over a flat gray or white area there's nothing to refract, so it looks like nothing. Put it over a gradient, photo, or real content.
2. **Blur too high.** A big blur value smears the backdrop into a uniform frost and erases the refraction detail. Keep `blur` at 0–4 when `refraction` is on.

Also confirm the element has a resolved size before `applyAll()` runs, and that `--lg-radius` matches the visual radius. See the gotchas checklist in **[06 · Web Implementation](06-web-implementation.md)**.

### How do I make it stronger?

Raise `refraction` (edge bend strength, 0–60) and `bezel` (band width, 4–60). For more shine, raise `specular`. For a "thicker glass" feel, increase both refraction and bezel together. Live-tune with `LiquidGlass.set({ refraction: 34, bezel: 30, specular: 1.1 })`, or per element with `data-lg-refraction` / `data-lg-bezel`. Don't compensate with blur — that works against you.

### Does it hurt performance?

Map generation is CPU work, O(width × height) per element, done **once on create/resize** and capped by the `quality` param (default 360px longest side). Once built, the effect is a GPU `backdrop-filter` layer. Costs add up with many panes, so prefer a few larger glass surfaces over dozens of tiny ones, avoid glass-on-glass stacks, and animate `transform`/`scale` rather than geometry. See the performance model in **[07 · Browser Support](07-browser-support.md)**.

### Is it accessible?

Yes, if you let it be. LiquidLens honors `prefers-reduced-transparency` (opaque surface in CSS **and** it skips all map generation in JS), `prefers-reduced-motion` (freezes highlights/transitions), and `prefers-contrast: more` (adds a definition border). You still own text contrast — measure it against the **composited** backdrop, not the tint alone, and keep meaning out of the glass effect itself. Full guidance in **[09 · Accessibility](09-accessibility.md)**.

### Can I use it in production?

Yes. The core engine is dependency-free, degrades gracefully in non-Chromium browsers, and ships accessible fallbacks. Treat refraction as a **progressive enhancement**: design so the blur-only fallback still looks and works great, test across engines and the reduced-* media queries, and keep the effect on the floating control layer rather than everywhere. Then ship.

### How is this different from glassmorphism?

Glassmorphism is blur + tint — a flat frosted card. Liquid Glass adds the defining behavior: **edge refraction** (the background bends and magnifies at the rim), plus a motion-reactive specular highlight, a chromatic edge, adaptive depth, and fluid morphing. If it only blurs, it's glassmorphism; the moment the edges bend light, it's Liquid Glass. See the comparison table in **[01 · What is Liquid Glass](01-what-is-liquid-glass.md)**.

### Why Chromium only?

The refraction relies on referencing an SVG `<filter>` (with `feImage` + `feDisplacementMap`) from the CSS `backdrop-filter` property. Chromium implements SVG filters as backdrop filters; WebKit (Safari) and Gecko (Firefox) do not yet. Blur, saturate, masks, and blend modes are supported everywhere, which is why the fallback still looks like glass. See **[07 · Browser Support](07-browser-support.md)**.

### How do I theme it?

Everything visual is a CSS custom property in `tokens.css`. Override on `:root` for a global theme or on any scope for a local one — no engine changes needed. For live, JS-driven changes to material params (refraction, blur, tint), use `LiquidGlass.set({...})`. There are also semantic tint helpers (`.lg-tint-blue`, etc.) and a `[data-lg-env="dark"]` scope. See **[08 · Design Tokens](08-design-tokens.md)**.

### Does it work on mobile?

On mobile web, yes — with the same Chromium-vs-others rule (Chrome on Android gets refraction; iOS browsers all use WebKit and get the blur fallback). LiquidLens can also drive the specular highlight from device tilt when you pass `tilt: true`. For native mobile apps, use the platform path: Skia shaders + a blur view on React Native, `liquid_glass_renderer` on Flutter, or native `.glassEffect` on iOS 26. See **[11 · Cross-platform](11-cross-platform.md)**.

### When should I use Clear instead of Regular?

Almost never — Regular is the default and is self-legible over anything. Use **Clear** only over bright, media-rich backgrounds (photos, video) with bold, high-contrast foreground content, and always add a `.lg-scrim` for legibility. Over text, plain colors, or thin foreground text, Clear will fail. See **[04 · Variants](04-variants-regular-clear.md)**.

### My tint looks like a colored card, not glass. Why?

Your `tintOpacity` (or `--lg-tint-a`) is too high. Tint is a *thin wash* — keep alpha ≤ ~0.15. Past that, opacity overwhelms the translucency and you've built a colored panel. Lower the alpha and let the backdrop show through.

### Do I have to call anything after adding glass dynamically?

Usually not — `init()` sets up a `MutationObserver` that auto-applies the material to any `[data-glass]` element added to the DOM. If you build glass in a detached tree or need immediate application, call `LiquidGlass.apply(el)` (or `refresh(el)` after resizing) yourself. See **[10 · API Reference](10-api-reference.md)**.

### How do I animate a glass element smoothly?

Animate the **cheap** things: `transform`, `opacity`, the highlight variables, and the filter `scale`. Avoid animating `width`, `height`, `border-radius`, or `bezel` continuously — each change forces a full displacement-map rebuild. For morph transitions, animate position/size with the springy `--lg-ease` and rebuild the map only when the element comes to rest.

### Can I get true chromatic aberration (rainbow edges)?

LiquidLens ships a cheap CSS stand-in — faint cool and warm inset fringes on opposite edges (`--lg-chroma-cool` / `--lg-chroma-warm`). For the real thing, run three `feDisplacementMap` passes at slightly different scales on the R/G/B channels and recombine them. It's heavier; most UIs don't need it. See the advanced section of **[06 · Web Implementation](06-web-implementation.md)**.
