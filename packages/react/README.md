# @liquidlens/react

React (TypeScript) bindings for **LiquidLens** — an Apple-style _Liquid Glass_
material for the web. This package is a thin, declarative wrapper around the
framework-agnostic engine in [`@liquidlens/core`](../core): it renders the glass
element, maps props to the classes/attributes the core understands, and calls
the engine's `apply()` after mount and on resize.

> **What makes it "liquid"?** The core generates a per-element SVG displacement
> map and uses it as a `backdrop-filter`, producing genuine edge **refraction**
> (a magnifying rim), not just a blur. See browser support below.

---

## Install

```bash
npm install @liquidlens/react @liquidlens/core
```

`react` and `react-dom` are **peer dependencies** — bring your own (React 17+,
hooks required).

Import the core stylesheet **once** at your app root:

```ts
import '@liquidlens/core/liquid-glass.css';
```

(The component imports the JS engine for you as a side effect.)

---

## Usage

### Basic

```tsx
import { LiquidGlass, useLiquidGlass } from '@liquidlens/react';
import '@liquidlens/core/liquid-glass.css';

export function App() {
  // Initialise the engine once (wires pointer/resize/observers).
  useLiquidGlass({ refraction: 18, bezel: 22, blur: 3 });

  return (
    <LiquidGlass radius={28} style={{ padding: 24 }}>
      <h2>Frosted, refracting glass</h2>
      <p>Content sits above the material layers.</p>
    </LiquidGlass>
  );
}
```

### Clear variant

Thinner, more transparent glass. A darkening scrim is rendered automatically so
foreground text stays legible over busy backdrops.

```tsx
<LiquidGlass variant="clear" radius={32} style={{ padding: 28 }}>
  <strong>Clear glass over a photo</strong>
</LiquidGlass>
```

### Tinted, interactive button

```tsx
<LiquidGlass
  as="button"
  tint="blue"
  interactive
  className="lg-btn lg-pill"
  onClick={() => console.log('tapped')}
>
  Continue
</LiquidGlass>
```

`interactive` adds the `lg-interactive` (hover-lift) and `lg-press` (tap
feedback) behaviours. `as` makes the component polymorphic — here it renders a
real `<button>`.

### Live controls with `useLiquidGlass().set`

```tsx
function Controls() {
  const { set } = useLiquidGlass();
  return (
    <input
      type="range"
      min={0}
      max={40}
      defaultValue={18}
      onChange={(e) => set({ refraction: Number(e.target.value) })}
    />
  );
}
```

`set()` merges parameters into the engine's global state, updates the CSS
custom properties, and re-renders every glass element on the next frame.

### Glass on your own element (`useGlassRef`)

```tsx
import { useGlassRef } from '@liquidlens/react';

function Card() {
  const ref = useGlassRef({ refraction: 24 });
  return (
    <section ref={ref} className="lg-glass lg-card" data-glass>
      Custom element, same material.
    </section>
  );
}
```

---

## Props

| Prop          | Type                                                   | Default     | Description                                                                 |
| ------------- | ------------------------------------------------------ | ----------- | --------------------------------------------------------------------------- |
| `variant`     | `'regular' \| 'clear'`                                 | `'regular'` | `clear` = thinner glass + auto scrim (`lg-clear` + `lg-scrim`).             |
| `radius`      | `number`                                               | —           | Corner radius in px. Sets `--lg-radius`.                                     |
| `refraction`  | `number`                                               | —           | Per-element edge-bend strength → `data-lg-refraction`.                      |
| `bezel`       | `number`                                               | —           | Per-element refracting band width → `data-lg-bezel`.                        |
| `blur`        | `number`                                               | —           | Per-element backdrop blur (px) → `data-lg-blur`. Keep low (0–4).            |
| `tint`        | `'blue' \| 'green' \| 'red' \| 'purple' \| 'amber'`    | —           | Semantic tint preset → `.lg-tint-*`.                                        |
| `interactive` | `boolean`                                              | `false`     | Adds `lg-interactive` (hover-lift) and `lg-press` (tap) behaviours.         |
| `as`          | `keyof JSX.IntrinsicElements`                          | `'div'`     | Polymorphic element type.                                                    |
| `className`   | `string`                                               | —           | Merged after the generated classes (`lg-glass …`).                          |
| `style`       | `React.CSSProperties`                                  | —           | Merged after `--lg-radius`.                                                  |
| `children`    | `React.ReactNode`                                      | —           | Content, rendered above the glass layers.                                   |
| …rest         | native attributes of the `as` element                 | —           | `onClick`, `id`, ARIA, etc. are forwarded.                                  |

The component always emits `class="lg-glass …"` and the `data-glass` attribute
so the core engine can find and observe it.

### Hooks

- `useLiquidGlass(options?) → { set }` — initialise the engine once (idempotent
  across the tree) and get a bound `set()` for live control.
- `useGlassRef(opts?) → (node) => void` — a ref callback that applies (and
  keeps re-applying, via `ResizeObserver`) glass to any element.

---

## Browser support

The specular rim, tint, saturation, and depth work everywhere modern
`backdrop-filter` does. The **refraction** layer relies on using an SVG filter
as a `backdrop-filter`, which today is a **Chromium-only** capability
(Chrome / Edge / Arc / Brave / Opera). Safari and Firefox gracefully fall back
to blur + specular — still glassy, just without the magnifying edge. The core
also respects `prefers-reduced-transparency`, `prefers-contrast`, and
`prefers-reduced-motion`.
