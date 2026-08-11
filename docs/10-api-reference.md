# 10 · API reference

Complete reference for the LiquidLens JavaScript engine (`packages/core/liquid-glass.js`, v1.0) and its CSS classes. The engine has **zero dependencies** and is exposed as both `window.LiquidGlass` and the brand alias `window.LiquidLens` — they are the same object.

## Methods

### `init(options?) → api`

Scan the document for `[data-glass]` elements, apply the material to each, and wire up all listeners: `pointermove` (specular tracking), `resize`, a `ResizeObserver` on each glass element, a `MutationObserver` on `document.body` (so glass added later is picked up automatically), and `deviceorientation` when `tilt` is enabled. Also writes the global CSS variables from the current state. **Call once.**

Runs `applyAll()` on `load` (plus a 150ms retry to catch late layout), and again when fonts finish loading. Returns the api object for chaining.

```js
LiquidGlass.init({ refraction: 18, bezel: 22, blur: 3 });
```

### `apply(el, opts?)`

(Re)apply the material to a single element. Reads the element's **live** size (`getBoundingClientRect`), its computed corner radius, and any `data-lg-*` overrides, then generates a fresh displacement map and sets the `backdrop-filter`. Use this for elements injected after `init()`.

- Returns early (no-op) if `prefers-reduced-transparency: reduce` is set, or if the element is smaller than 4px on either side.
- Detects the Clear variant via the `.lg-clear` class **or** `data-glass-variant="clear"`, halving the refraction scale and capping blur (≤2) and saturation (1.4) for that variant.

```js
const el = document.querySelector('#late-panel');
LiquidGlass.apply(el, { refraction: 24, bezel: 28 });
```

### `applyAll()`

Re-apply to **every** `[data-glass]` element in the document. Internally scheduled via `requestAnimationFrame` on resize and mutation.

### `set(partial)`

Merge a partial params object into the global `state`, rewrite the global CSS variables, and schedule a re-render of all glass elements. This is the method for **live controls** (sliders, theme switches).

```js
LiquidGlass.set({ refraction: 30, blur: 2, tintHue: 275 });
```

### `refresh(el)`

Alias of `apply(el)`. Use it after you mutate an element's size to make the intent readable.

### `destroy()`

Disconnect all observers, remove the `pointermove` and `deviceorientation` listeners, and remove the injected `<svg>` filter root. Use before tearing down a single-page-app view that created glass.

### `makeDisplacementMap(w, h, radius, bezel) → dataURL`

Low-level. Generate the displacement-map bitmap for the given geometry and return it as a PNG data URL. Advanced/testing use — `apply()` calls this for you. The canvas is scaled down so its longest side never exceeds `state.quality`. See **[02 · Optics & Physics](02-optics-and-physics.md)** for the algorithm.

### `state`

The current global params object (live — reading it reflects the latest `set()`). Treat as read-only; mutate via `set()` so CSS variables and renders stay in sync. (`_defaults` holds the pristine defaults.)

## Options

Global defaults set by `init()`; overridable per call via `opts`, and per element via `data-lg-*` attributes. Ranges are copied from the source comments.

| Option | Type | Range | Default | Meaning |
|---|---|---|---|---|
| `refraction` | number | 0–60 | `18` | `feDisplacementMap` scale (px) — edge bend strength. |
| `bezel` | number | 4–60 | `22` | Width (px) of the refracting edge band. Clamped to < half the shortest side. |
| `blur` | number | 0–20 | `3` | Backdrop blur (px). Keep **LOW (0–4)** or refraction is lost. |
| `saturation` | number | 1.0–3.0 | `1.8` | Backdrop `saturate()` multiplier. |
| `specular` | number | 0–1.5 | `0.9` | Rim/highlight intensity (drives `--lg-spec`). |
| `tintHue` | number | 0–360 | `220` | HSL hue of the tint. |
| `tintOpacity` | number | 0–0.4 | `0.10` | Tint alpha. Keep low; heavy tint kills translucency. |
| `quality` | number | 128–512 | `360` | Max displacement-map dimension (performance cap). |
| `tilt` | boolean | — | `false` | If true, the specular highlight tracks `DeviceOrientation` (mobile). |

> `specular`, `tintHue`, and `tintOpacity` affect the CSS layers (via variables), so they take effect through `set()`/`init()` even in browsers without refraction. `refraction`, `bezel`, `blur`, `saturation`, `quality`, and the Clear variant affect map generation and the `backdrop-filter`.

## Per-element data attributes

Set these on the element to override the global params for that element only. The engine reads them in `apply()`.

| Attribute | Overrides | Example |
|---|---|---|
| `data-glass` | (marker) marks the element for management | `data-glass` |
| `data-lg-refraction` | `refraction` | `data-lg-refraction="34"` |
| `data-lg-bezel` | `bezel` | `data-lg-bezel="30"` |
| `data-lg-blur` | `blur` | `data-lg-blur="1"` |
| `data-lg-saturation` | `saturation` | `data-lg-saturation="2.2"` |
| `data-glass-variant="clear"` | selects Clear (same as class `.lg-clear`) | `data-glass-variant="clear"` |

```html
<div class="lg-glass" data-glass
     data-lg-refraction="34" data-lg-bezel="30" style="--lg-radius:28px;">
  Extra-lensy panel
</div>
```

## CSS classes

Defined in `packages/core/liquid-glass.css`.

| Class | Role |
|---|---|
| `.lg-glass` | The material. Compose with your own size/padding class. |
| `.lg-clear` | Clear variant (more transparent). Pair with a `.lg-scrim` child. |
| `.lg-scrim` | Dimming layer for Clear-over-media legibility. |
| `.lg-press` | Interactive: scale-down + illuminate on `:active`. |
| `.lg-interactive` | Lifts (`translateY(-2px)`) on hover. |
| `.lg-morph` | Flex container for glass elements that flow together. |
| `.lg-tint-{blue,green,red,purple,amber}` | Semantic tint hue + alpha. |
| `.lg-pill`, `.lg-circle`, `.lg-sm`, `.lg-lg` | Shape helpers (set `--lg-radius`). |
| `.lg-btn`, `.lg-toolbar`, `.lg-card` | Component primitives (radius + padding). |

Per-element custom property: **`--lg-radius`** — set it to match the visual corner radius; the engine reads it to build the map. See **[08 · Design Tokens](08-design-tokens.md)** for the full token list.

## Module usage

The file is a UMD-style wrapper — it works three ways with no build step.

**Global (plain `<script>`):**

```html
<script src="packages/core/liquid-glass.js"></script>
<script>
  LiquidGlass.init({ refraction: 18 });   // window.LiquidGlass or window.LiquidLens
</script>
```

**CommonJS:**

```js
const LiquidGlass = require('liquidlens');
LiquidGlass.init({ refraction: 18 });
```

**ES module:**

```js
import LiquidGlass from 'liquidlens';
LiquidGlass.init({ refraction: 18 });
```

> The wrapper assigns to `module.exports` when present and to the global otherwise. In a bundler, import the default export; in the browser, use the global. Either way the object is identical, and `LiquidLens` is an alias of `LiquidGlass`.

## Minimal end-to-end example

```html
<link rel="stylesheet" href="packages/core/tokens.css">
<link rel="stylesheet" href="packages/core/liquid-glass.css">

<nav class="lg-glass lg-toolbar" data-glass style="--lg-radius:26px;">
  <button class="lg-glass lg-press lg-btn" data-glass>Home</button>
  <button class="lg-glass lg-tint-blue lg-press lg-btn" data-glass>New</button>
</nav>

<script src="packages/core/liquid-glass.js"></script>
<script>
  LiquidGlass.init({ refraction: 18, bezel: 22, blur: 3, specular: 0.9 });
</script>
```
