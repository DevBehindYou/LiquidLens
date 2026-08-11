# Contributing to LiquidLens

Thanks for helping make Liquid Glass correct, accessible, and available everywhere. 💧

## Ground rules

1. **Refraction is non‑negotiable.** A PR that ships blur-only "glass" isn't Liquid Glass — see [`docs/02-optics-and-physics.md`](docs/02-optics-and-physics.md). The defining trait is edge lensing.
2. **The core is the source of truth.** `packages/core/liquid-glass.js` + `.css` + `tokens.css`. Platform ports should mirror its model and parameter names (`refraction`, `bezel`, `blur`, `saturation`, `specular`, `tintHue`, `tintOpacity`).
3. **Accessibility ships with the feature**, not after. Honor `prefers-reduced-transparency`, `prefers-reduced-motion`, `prefers-contrast`.
4. **Keep the core dependency‑free.** No runtime deps in `packages/core`.

## Local dev

There's no build step. Open any file in `examples/` or `artifacts/` directly in a Chromium browser (Chrome/Edge/Arc), or run `npx serve .`.

## Before you open a PR

- [ ] Every glass element has both `class="lg-glass"` and `data-glass`.
- [ ] `blur` kept ≤ 4 where `refraction > 0` (higher blur erases the lensing).
- [ ] Verified in a Chromium engine that the **edge actually bends** the backdrop (not just blurs).
- [ ] Verified the Safari/Firefox fallback still looks like clean glass.
- [ ] Ran the example self‑test (a small Playwright script that asserts no console errors and that every `[data-glass]` element received a `url(#…)` backdrop filter).
- [ ] Ran the **auditor skill** ([`skills/liquid-glass-auditor`](skills/liquid-glass-auditor)) against your change.
- [ ] Docs/API reference updated if you changed the API.

## Adding an example

Copy `examples/01-basic-panel.html`, link the three core files, add your component with `data-glass`, call `LiquidGlass.init()`, and add it to the examples list in the README.

## Adding a platform port

Open an issue first. A port must implement genuine refraction (a shader or native material), not just blur, and document its fallback. See the React Native (Skia) and Flutter (fragment shader) ports as references.

## Code of conduct

Be kind, be rigorous, assume good faith. Reviews focus on the work, not the person.
