# CLAUDE.md — LiquidLens project context

LiquidLens is a multi-platform implementation of Apple's **Liquid Glass** (iOS 26) with
genuine edge refraction. Web (vanilla), React, React Native (Skia), Flutter (GLSL),
SwiftUI (native `glassEffect`).

## Read first

- `AI_CONTEXT.md` — the dense machine spec: decision tree, refraction algorithm, API
  contract, do/avoid rules. **Authoritative. Read it before writing any glass code.**
- `docs/10-api-reference.md` — full web API. `docs/11-cross-platform.md` — native APIs.

## Ground rules (enforced in review)

1. **Liquid Glass = blur + REAL edge refraction.** Blur-only output is a failed task.
2. `packages/core/liquid-glass.js` is the source of truth; platform ports mirror its
   model and parameter names (refraction, bezel, blur, saturation, specular, tintHue,
   tintOpacity). Core stays zero-dependency.
3. Web glass element = `class="lg-glass"` + `data-glass` attribute + `LiquidGlass.init()`.
4. Keep `blur` ≤ 4 when refraction is on. Rich backdrop required (glass is invisible
   over flat color). No glass-on-glass stacking. Tint alpha ≤ ~0.15.
5. Accessibility ships with features: `prefers-reduced-transparency` → opaque fallback,
   `prefers-reduced-motion`, `prefers-contrast`. Already wired in the core CSS.
6. Refraction is Chromium-only on the web (Safari/Firefox auto-fallback to
   blur + specular). Never claim otherwise in code comments or docs.

## Verification (before claiming done)

Run a headless-Chromium check on any HTML you touch: zero console errors AND every
`[data-glass]` element's `backdropFilter` contains `url(` (the displacement filter).
The pattern lives in CONTRIBUTING.md. For visual work, screenshot over a busy
background and confirm the edge actually bends the backdrop.

## Layout

`packages/` (core/react/react-native/flutter/swiftui) · `examples/` (14 component demos)
· `artifacts/` (6 self-contained showcase screens — these INLINE the core; if you edit
`packages/core/liquid-glass.js`, re-sync the inlined copies) · `docs/` (13 files) ·
`skills/` (5 agent skills incl. an auditor) · `assets/` (brand, diagrams, screenshots).

## Branding

Name is **LiquidLens** (final). Never "Apple LiquidLens" — Apple's name appears only
descriptively ("implements Apple's Liquid Glass design language"). Keep the
not-affiliated-with-Apple disclaimer in README and LICENSE. Tagline: "Apple's Liquid
Glass, for every platform." Author: Ashutosh Sharma (DevBehindYou — github.com/DevBehindYou, devbehindyou.vercel.app). License: MIT.
