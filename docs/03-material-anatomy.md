# 03 · Material anatomy — the layer stack

Liquid Glass is not one effect; it is **six layers composited in a fixed order**. Getting the order and the subtlety right is what separates a convincing material from a muddy blur. Below is the exact stack produced by `packages/core/liquid-glass.css` + `liquid-glass.js`, bottom to top.

```
        ┌─────────────────────────────────────────────┐  z
  (6)   │  your content  (text, icons)                 │  3   ← lifted above all glass layers
        ├─────────────────────────────────────────────┤
  (5)   │  ::before  specular rim + chromatic edge     │  2
        ├─────────────────────────────────────────────┤
  (4)   │  ::after   moving specular highlight         │  1   ← tracks pointer / device motion
        ├─────────────────────────────────────────────┤
  (3)   │  background: hsla tint                       │  0
        ├─────────────────────────────────────────────┤
  (2)   │  backdrop-filter: blur + saturate            │  ↓   ← applied to what's BEHIND the box
  (1)   │  backdrop-filter: url(#displacement)         │  ↓   ← the refraction (see 02)
        └─────────────────────────────────────────────┘
                     ▼ the page content behind the element
```

`isolation: isolate` on `.lg-glass` creates a stacking context so the `z-index` values below are self-contained and never leak into the page.

## Layer 1 — Refraction (the lens)

`backdrop-filter: url(#displacementFilter)`. The SVG filter — built **per element** by the JS engine from the element's live size and radius — bends the backdrop at the edges. This is the defining layer; without it you have glassmorphism. Controlled by `refraction` (the displacement `scale`, in px) and `bezel` (the band width, in px). See **[02 · Optics & Physics](02-optics-and-physics.md)** for how the map is generated.

## Layer 2 — Translucency (blur + saturation)

The same `backdrop-filter`, chained: `blur(var(--lg-blur)) saturate(var(--lg-sat))`. Blur softens the refracted backdrop; saturation makes the transmitted color richer so the glass "glows" with the scene behind it. **Keep blur low (0–4px)** — heavy blur smears away the very refraction detail that defines the material.

> **Order note.** The engine composes `blur() saturate() url(#f)` left → right onto the backdrop. Putting `url()` **last** keeps the refracted edges crisp over the already-blurred field. In CSS the base rule only declares `blur + saturate`; the JS overwrites the property with the full three-part chain (including `url(#id)`) once it has generated a per-element map.

## Layer 3 — Tint

`background: hsla(var(--lg-tint-h), var(--lg-tint-s), var(--lg-tint-l), var(--lg-tint-a))`. A *thin* wash of color. On Apple platforms the tint is content-derived and adaptive; here it is a controllable hue plus a low alpha. Keep alpha ≤ ~0.15, or the pane stops looking like glass and starts looking like a colored card. Semantic helper classes (`.lg-tint-blue`, `.lg-tint-green`, etc.) set sensible hue/alpha pairs — see **[08 · Design Tokens](08-design-tokens.md)**.

## Layer 4 — Moving specular highlight (`::after`)

A soft radial gradient positioned at `var(--lg-lx) var(--lg-ly)`, blended with `mix-blend-mode: screen`. The engine updates those two variables on `pointermove` (and, when `tilt: true`, from `DeviceOrientation`), so the glint **slides as you move** — the hallmark "responds to motion" cue. Its intensity scales with `--lg-spec`. On `.lg-press:active` the highlight snaps to the center and brightens, which reads as **illumination on touch**.

## Layer 5 — Specular rim + chromatic edge (`::before`)

A border-only gradient (drawn into a 1px pad and masked with `mask-composite: exclude` so only the rim shows) draws a **bright edge** whose brightest points follow the sweep angle `--lg-edge`. Layered on top are two faint inset shadows — one cool (`--lg-chroma-cool`, blue) and one warm (`--lg-chroma-warm`, pink) — on opposite edges to fake **chromatic aberration**, the rainbow fringe of real refracted light. This sells "glass" cheaply, without an expensive per-channel displacement pass.

## Layer 6 — Depth: adaptive shadow + inner light lines

Everything lives on `box-shadow`, split into two tokens:

- `--lg-shadow-inner` — `inset 0 1px 1px rgba(255,255,255,.35)` plus a fainter bottom inset. These are **inner light lines** that read as the lit top facet and the dim bottom facet of a glass slab.
- `--lg-shadow-drop` — `0 12px 34px rgba(0,0,0,.28)` plus a tighter `0 2px 8px`. This is the **drop shadow** that lifts the pane off the content.

Apple's version deepens the shadow over busy/text backgrounds and lightens it over plain ones to preserve legibility ("adaptive shadow"). To reproduce that fully, sample the backdrop luminance under the element and modulate the shadow alpha — optional; see **[06 · Web Implementation](06-web-implementation.md)** §Advanced.

## Content layer

`.lg-glass > *` is forced to `z-index: 3` so your text and icons render **above** every glass layer and stay crisp. Never place content behind the highlights — the point of the material is to hold legible controls, not to bury them.

## The CSS in one glance

```css
.lg-glass {
  position: relative;
  border-radius: var(--lg-radius);
  background: hsla(var(--lg-tint-h), var(--lg-tint-s), var(--lg-tint-l), var(--lg-tint-a)); /* L3 */
  backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-sat));  /* L2 (+ L1 url appended by JS) */
  box-shadow: var(--lg-shadow-inner), var(--lg-shadow-drop);      /* L6 inner light + drop */
  isolation: isolate;
}
.lg-glass::after  { /* L4 moving highlight, mix-blend-mode: screen */ }
.lg-glass::before { /* L5 rim + chromatic edge, masked to the border */ }
.lg-glass > *     { position: relative; z-index: 3; }             /* content */
```

## Tuning cheat-sheet

| Want… | Change | Watch out for |
|---|---|---|
| Stronger lens / thicker rim | ↑ `refraction`, ↑ `bezel` | Bezel is clamped to < half the shortest side |
| Frostier, softer | ↑ `blur` | Above ~4px you start erasing the refraction |
| More "wet" / shiny | ↑ `specular` (`--lg-spec`) | Above ~1.2 it reads as glare, not glass |
| More colored | ↑ `tintOpacity` / set `tintHue` | Above ~0.2 alpha it becomes a colored card |
| Floatier | Larger `--lg-shadow-drop` | Too large detaches it from context |
| Crisper glass | ↓ `blur`, keep `refraction` moderate | Needs a rich backdrop to show anything |
| Warmer / cooler dispersion | Edit `--lg-chroma-warm` / `--lg-chroma-cool` | Keep both faint (~0.2 alpha) |
