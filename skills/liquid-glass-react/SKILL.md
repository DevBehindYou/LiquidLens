---
name: liquid-glass-react
description: >
  Build Apple-style "Liquid Glass" (iOS 26) surfaces in React/Next.js — cards, buttons, toolbars,
  docks — with GENUINE edge refraction, not just a frosted blur, using the LiquidLens React port
  (@liquidlens/react). Fire on "liquid glass in React", "iOS 26 glass component", "glassmorphism
  with refraction React", "Apple glass UI" when the output is JSX/TSX.
---

# Liquid Glass — React

Use the LiquidLens React port (`../../packages/react`), a thin wrapper over the same web core.
`<LiquidGlass>` renders a glass surface and re-applies the material on mount/resize; `useLiquidGlass()`
initializes the engine once and returns `set()` for live global changes; `useGlassRef()` attaches the
material to any element you already render.

## When to use

Trigger on: "make a liquid glass card/navbar/button in React/Next", "add the iOS 26 glass effect to
this component", "Apple-style glass UI" where the deliverable is React JSX/TSX. Plain-blur-only
requests are ordinary glassmorphism — this skill is overkill.

## The one rule that matters

**Liquid Glass = glassmorphism + genuine edge refraction (lensing). Blur alone is a fail.** The port
does not re-implement the effect — it calls straight into the core engine, which generates the SVG
displacement map and sets `backdrop-filter`. Refraction is **Chromium-only** on the web; Safari and
Firefox render the blur+specular fallback (that is expected, not a bug). See
`../../docs/07-browser-support.md`.

## Procedure

1. **Import the core stylesheet once** at app root: `import '@liquidlens/core/liquid-glass.css';`
   (and `tokens.css`). The component/hook side-effect-import the JS core themselves.
2. **Initialize once** near the root: `const { set } = useLiquidGlass({ refraction:18, bezel:22,
   blur:3 });`. It is idempotent (module-guarded), so calling it in more than one component is safe.
3. **Render surfaces** with `<LiquidGlass>`. Props map to the core: `variant` ("regular" | "clear"),
   `radius` (→ `--lg-radius`), `refraction` / `bezel` / `blur` (→ `data-lg-*`), `tint`
   ("blue"|"green"|"red"|"purple"|"amber"), `interactive` (adds hover-lift + press), `as` for the
   intrinsic tag (`as="button"`), plus `className` and any native attributes.
4. **Keep blur 0–4.** Higher blur erases the refraction. Keep tint subtle (semantic `tint` presets
   are already low-alpha).
5. **Clear variant** only over bright media with bold foreground — `variant="clear"` auto-renders the
   dimming `.lg-scrim`. Default to `variant="regular"` everywhere else (`../../docs/04-...md`).
6. **Live controls:** drive sliders/theme switches through `set({ refraction, blur, tintHue, ... })`.
7. **Provide a rich backdrop** (gradient/photo/content) behind the glass, or the lensing is invisible.
8. **Late/imperative layout:** after a manual size change call `getEngine()?.refresh(node)`. The
   component/hook already wire a `ResizeObserver`. SSR-safe: `getEngine()` returns `null` on the server.
9. **Verify in Chromium:** confirm the rim actually bends the backdrop over text/photo before
   claiming done; spot-check the Safari/Firefox blur fallback.

## Minimal template (.tsx)

```tsx
import { LiquidGlass, useLiquidGlass } from '@liquidlens/react';
import '@liquidlens/core/tokens.css';
import '@liquidlens/core/liquid-glass.css';

export default function Toolbar() {
  // Initialize the shared engine once (idempotent).
  const { set } = useLiquidGlass({ refraction: 18, bezel: 22, blur: 3, specular: 0.9 });

  return (
    <div style={{ position: 'relative' }}>
      {/* rich backdrop so refraction is visible */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background:
          'radial-gradient(50% 60% at 20% 20%,#ff5ea8,transparent 60%),' +
          'radial-gradient(50% 60% at 80% 80%,#2bd6ff,transparent 60%),#12102b',
      }} />

      <LiquidGlass className="lg-toolbar" radius={26}>
        <LiquidGlass as="button" className="lg-btn" radius={22} interactive
          onClick={() => set({ tintHue: 275 })}>
          Home
        </LiquidGlass>
        <LiquidGlass as="button" className="lg-btn" radius={22} tint="blue" interactive>
          New
        </LiquidGlass>
      </LiquidGlass>
    </div>
  );
}
```

## Common mistakes to avoid

- Shipping blur without refraction (the #1 failure).
- Forgetting `import '@liquidlens/core/liquid-glass.css'` — you get a bare div with no material.
- Blur > 4 (refraction washed out); tint alpha so high it becomes a colored card.
- Claiming refraction cross-browser — it is Chromium-only; other engines get the blur fallback.
- `variant="clear"` over text or plain backgrounds, or without a bright/bold foreground.
- Calling `getEngine()?.destroy()` while other components still use the singleton engine.
- No backdrop behind the glass, so nothing refracts.
- Glass-on-glass stacking.

## References in this repo

- `../../packages/react/LiquidGlass.tsx` — the component + prop → core mapping.
- `../../packages/react/useLiquidGlass.ts` — `useLiquidGlass` / `useGlassRef` hooks.
- `../../packages/react/index.ts` / `README.md` — exports and import paths.
- `../../packages/core/liquid-glass.js` — the underlying engine.
- `../../docs/10-api-reference.md` — option ranges, classes, `data-lg-*`.
- `../../docs/04-variants-regular-clear.md` — Regular vs Clear.
- `../../docs/07-browser-support.md` — Chromium-only refraction, fallbacks.
