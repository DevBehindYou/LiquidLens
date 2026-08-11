---
name: liquid-glass-web
description: >
  Build Apple-style "Liquid Glass" (iOS 26) UI for the web — panels, buttons, docks, toolbars,
  control-center cards, sliders — using the LiquidLens core engine, with GENUINE edge refraction,
  not just a frosted blur. Fire on "liquid glass", "iOS 26 glass", "frosted glass with refraction",
  "Apple glass UI", "glassy floating control" when the output is HTML/CSS/JS.
---

# Liquid Glass — Web

Produce a faithful Liquid Glass web component with the LiquidLens core engine (`../../packages/core`).
The engine generates a per-element SVG displacement map and wires it up as a `backdrop-filter` so the
rim actually bends the backdrop.

## When to use

Trigger on: "make a liquid glass card / navbar / dock / button", "recreate the iOS 26 glass effect",
"add refraction to this frosted panel", "Apple-style glass UI" — output is web (HTML/CSS/JS). If the
user explicitly wants only a flat blurred card and *not* the Apple effect, that is plain
glassmorphism; a single `backdrop-filter: blur()` rule is enough and this skill is overkill.

## The one rule that matters

**Liquid Glass = glassmorphism + genuine edge refraction (lensing). Blur alone is a fail.** If you
ship only blur+tint you have missed the brief. The refraction — SVG `feDisplacementMap` driven by a
squircle+Snell displacement map, applied via `backdrop-filter` — is mandatory and is exactly what the
core engine adds for you. Physics: `../../docs/02-optics-and-physics.md`.

## Procedure

1. **Clarify intent only if ambiguous:** which component, Regular vs Clear, tint, light/dark context,
   single self-contained file vs library reference. Defaults: Regular, `tintHue 220`, low tint.
2. **Link the core** (preferred): `../../packages/core/tokens.css`, then `liquid-glass.css`, then
   `liquid-glass.js`. If it must be one file (email/artifact), inline all three.
3. **Mark up** with `class="lg-glass"` + `data-glass`, plus helper classes: `lg-card` / `lg-toolbar`
   / `lg-btn` for primitives; `lg-pill` / `lg-circle` / `lg-sm` / `lg-lg` for shape; `lg-press` /
   `lg-interactive` for feedback; `lg-tint-{blue,green,red,purple,amber}` for a subtle tint.
4. **Set `--lg-radius`** on each element to match its real corner radius (the engine reads it to
   build the map). Use `data-lg-*` (`data-lg-refraction`, `data-lg-bezel`, `data-lg-blur`,
   `data-lg-saturation`) for per-element overrides.
5. **Call `LiquidGlass.init(...)` once.** Safe start: `refraction:18, bezel:22, blur:3,
   saturation:1.8, specular:0.9`. **Keep blur 0–4** or the refraction washes out. For live controls
   use `LiquidGlass.set({...})`; for late-injected nodes use `LiquidGlass.apply(el)`.
6. **Provide a rich backdrop** — a gradient, photo, or content behind the glass. Over flat gray the
   lensing is invisible.
7. **Variant rules:** Regular by default (self-legible, safe anywhere). Use `lg-clear` +
   `<span class="lg-scrim"></span>` **only over bright media with bold foreground**
   (`../../docs/04-variants-regular-clear.md`).
8. **Fallback + a11y are built in** (CSS/JS): Chromium gets refraction; Safari/Firefox get
   blur+specular; `prefers-reduced-transparency` → opaque (JS also skips map generation);
   `prefers-reduced-motion` → still. Don't rip these out.
9. **Verify in Chromium before claiming done.** Drag/preview a pane over text or a photo and confirm
   the **rim magnifies the backdrop**. Blur with no bend = fail. Spot-check the Safari/Firefox
   fallback too.

## Minimal template (library mode)

```html
<link rel="stylesheet" href="../../packages/core/tokens.css">
<link rel="stylesheet" href="../../packages/core/liquid-glass.css">

<!-- rich backdrop so the refraction is visible -->
<div style="position:fixed;inset:0;z-index:-1;background:
  radial-gradient(50% 60% at 20% 20%,#ff5ea8,transparent 60%),
  radial-gradient(50% 60% at 80% 80%,#2bd6ff,transparent 60%),#12102b"></div>

<nav class="lg-glass lg-toolbar" data-glass style="--lg-radius:26px;">
  <button class="lg-glass lg-press lg-btn" data-glass style="--lg-radius:22px;">Home</button>
  <button class="lg-glass lg-tint-blue lg-press lg-btn" data-glass style="--lg-radius:22px;">New</button>
</nav>

<script src="../../packages/core/liquid-glass.js"></script>
<script>LiquidGlass.init({ refraction:18, bezel:22, blur:3, specular:0.9 });</script>
```

## Common mistakes to avoid

- Shipping blur without refraction (the #1 failure).
- Blur > 4, which erases the lensing.
- Tint opacity so high the surface reads as a solid colored card (keep ≤ ~0.15).
- Clear variant over text or plain backgrounds (illegible / flat), or Clear with no scrim.
- Forgetting the backdrop, so the effect is invisible.
- Claiming cross-browser refraction — it is **Chromium-only** on the web (`../../docs/07-browser-support.md`).
- Glass-on-glass stacking (muddy depth, slow).
- `--lg-radius` not matching the visual radius, so the map is built for the wrong corners.

## References in this repo

- `../../packages/core/liquid-glass.js` / `liquid-glass.css` / `tokens.css` — the engine + styles.
- `../../docs/06-web-implementation.md` — step-by-step web build.
- `../../docs/10-api-reference.md` — every option, class, and `data-lg-*` attribute.
- `../../docs/02-optics-and-physics.md` — the refraction math.
- `../../docs/04-variants-regular-clear.md` — Regular vs Clear decision table.
- `../../docs/07-browser-support.md` — fallback matrix.
- `../../docs/09-accessibility.md` — a11y contract.
