# 08 · Design tokens

Every visual constant in LiquidLens lives in `packages/core/tokens.css` as a CSS custom property. Override any of them on `:root` (global) or on any scope (local) to re-theme **without touching the engine**. Import order is always:

```
tokens.css  →  liquid-glass.css  →  your styles
```

Some tokens are **static** (you set them and they stay). Some are **live** — the JS engine writes them at runtime from `LiquidGlass.set()` and from pointer/tilt input. Live tokens will overwrite whatever you hand-set if the engine is running, so drive those through the JS API instead (see **[10 · API Reference](10-api-reference.md)**).

## Material parameters

These mirror the JS defaults. When the engine runs, `set()` and `init()` rewrite the first four; `--lg-tint-s` and `--lg-tint-l` are yours to set.

| Token | Purpose | Default | Sensible range | Written by JS? |
|---|---|---|---|:---:|
| `--lg-blur` | Backdrop blur radius | `3px` | 0–20px (keep 0–4 with refraction) | ✅ (`blur`) |
| `--lg-sat` | Backdrop `saturate()` multiplier | `1.8` | 1.0–3.0 | ✅ (`saturation`) |
| `--lg-spec` | Specular highlight/rim intensity | `0.9` | 0–1.5 | ✅ (`specular`) |
| `--lg-tint-h` | Tint hue | `220` | 0–360 | ✅ (`tintHue`) |
| `--lg-tint-s` | Tint saturation | `40%` | 0–100% | ❌ |
| `--lg-tint-l` | Tint lightness | `70%` | 0–100% | ❌ |
| `--lg-tint-a` | Tint alpha | `0.10` | 0–0.4 (keep ≤ 0.15) | ✅ (`tintOpacity`) |

## Dynamic tokens (written by the engine at runtime)

Do not hand-set these unless you are running **without** the JS engine — the pointer/tilt handlers overwrite them continuously.

| Token | Purpose | Default | Driven by |
|---|---|---|---|
| `--lg-lx` | Specular light X position | `32%` | `pointermove` / tilt |
| `--lg-ly` | Specular light Y position | `12%` | `pointermove` / tilt |
| `--lg-edge` | Rim sweep angle | `140deg` | `pointermove` (pointer X) |

## Shape tokens

| Token | Purpose | Default |
|---|---|---|
| `--lg-radius` | Default corner radius (the engine reads this to build the map) | `28px` |
| `--lg-radius-sm` | Small radius (used by `.lg-sm`) | `16px` |
| `--lg-radius-lg` | Large radius (used by `.lg-lg`) | `40px` |
| `--lg-radius-pill` | Pill radius (used by `.lg-pill`) | `999px` |

> **Keep `--lg-radius` in sync with the visual radius.** The engine reads the computed `border-top-left-radius` to build the displacement map; if the token and the rendered radius disagree, the lens will bleed past the box corners.

## Depth tokens (adaptive shadow + inner light)

| Token | Purpose | Default |
|---|---|---|
| `--lg-shadow-drop` | Outer drop shadow that lifts the pane | `0 12px 34px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.20)` |
| `--lg-shadow-inner` | Inner light lines (lit top facet / dim bottom) | `0 1px 1px rgba(255,255,255,.35) inset, 0 -1px 1px rgba(255,255,255,.10) inset` |

## Chromatic edge tokens (fake dispersion)

| Token | Purpose | Default |
|---|---|---|
| `--lg-chroma-cool` | Cool (blue) inset fringe on one edge | `rgba(120,180,255,.20)` |
| `--lg-chroma-warm` | Warm (pink) inset fringe on the opposite edge | `rgba(255,120,200,.18)` |

## Spacing scale

Used to build demos and component primitives consistently.

| Token | Default | | Token | Default |
|---|---|---|---|---|
| `--lg-space-1` | `6px` | | `--lg-space-4` | `18px` |
| `--lg-space-2` | `10px` | | `--lg-space-5` | `24px` |
| `--lg-space-3` | `14px` | | `--lg-space-6` | `34px` |

## Type tokens

| Token | Purpose | Default |
|---|---|---|
| `--lg-font` | Font stack (Apple system fonts first) | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, …` |
| `--lg-fg` | Foreground color on glass (keep high-contrast) | `#fff` |
| `--lg-fg-dim` | Dimmed foreground | `rgba(255,255,255,.7)` |

## Motion tokens

| Token | Purpose | Default |
|---|---|---|
| `--lg-ease` | Springy, Apple-ish easing curve | `cubic-bezier(.2, 1, .3, 1)` |
| `--lg-dur` | Base transition duration | `.35s` |

## Helper classes

These are defined in `liquid-glass.css` and set the tokens above for you.

**Tint helpers** (semantic hue + alpha):

| Class | `--lg-tint-h` | `--lg-tint-a` |
|---|---|---|
| `.lg-tint-blue` | 212 | .16 |
| `.lg-tint-green` | 145 | .16 |
| `.lg-tint-red` | 2 | .16 |
| `.lg-tint-purple` | 275 | .16 |
| `.lg-tint-amber` | 38 | .18 |

**Shape helpers:** `.lg-pill`, `.lg-circle` (also sets `aspect-ratio: 1`), `.lg-sm`, `.lg-lg`.

**Component primitives:** `.lg-btn`, `.lg-toolbar`, `.lg-card` (each sets a sensible `--lg-radius` and padding).

**Interaction:** `.lg-press` (scale-down + illuminate on `:active`), `.lg-interactive` (lifts on hover), `.lg-morph` (flex container for elements that flow together).

## Re-theming: two patterns

### Global re-theme (override on `:root`)

```css
:root {
  --lg-tint-h: 275;                 /* purple environment */
  --lg-tint-a: 0.08;
  --lg-radius: 34px;
  --lg-shadow-drop: 0 18px 50px rgba(40, 0, 80, .35);
  --lg-ease: cubic-bezier(.16, 1, .3, 1);
}
```

### Scoped re-theme (override on any ancestor)

```css
.settings-panel {
  --lg-tint-h: 145;                 /* green just inside this panel */
  --lg-blur: 2px;
  --lg-radius: 20px;
}
```

LiquidLens also ships a ready-made dark-environment scope:

```html
<section data-lg-env="dark"> … glass tuned for dark surroundings … </section>
```

which lowers tint lightness and deepens the drop shadow. Because everything is a token cascade, you can nest scopes freely and mix them with the JS API — `LiquidGlass.set()` changes the *live* material params globally, while scoped token overrides handle the static, per-region look.
