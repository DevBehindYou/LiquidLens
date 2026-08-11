# Changelog

All notable changes to LiquidLens are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); versioning is [SemVer](https://semver.org/).

## [1.0.1] — 2026-08-11

Full-repo accuracy audit (automated syntax checks, link validation, docs-vs-code
consistency, native-API review, and a functional re-test of all 20 HTML pages).

### Fixed
- **Core (UMD)**: the wrapper now resolves its global via `globalThis` (was `self`/`this`),
  and the root manifest no longer declares `"type": "module"` — `require('@liquidlens/core')`
  and `import` both work in Node now (both previously threw). Artifacts re-synced with the
  updated inline engine.
- **Packaging**: root `package.json` is now a private monorepo manifest; added a proper
  `packages/core/package.json` publishing as **`@liquidlens/core`** (matching the name the
  React package and docs already referenced), plus a core README.
- **React Native (Skia)**: `LiquidGlassSkia` now wraps the SkSL in a `RuntimeShader`
  **image filter** for `BackdropFilter` (a plain `Shader` element is not an image filter),
  and no longer renders a bare `<Fill />` (which painted black).
- **Flutter**: shader asset path corrected for copy-into-app usage
  (`shaders/liquid_glass.frag`); `LiquidGlassRefractive.load()` now accepts the asset path.

### Audit results
- 20/20 example + artifact pages: zero console errors, refraction filter verified on every
  glass element. 86/86 relative links across 26 Markdown files resolve. All 8 TS/TSX files
  parse. Docs API tables match code defaults exactly. Skill frontmatter matches directories.

## [1.0.0] — 2026-08-11

The first complete release. Apple Liquid Glass with real edge refraction, across five platforms.

### Added
- **Core web engine** (`packages/core`) — zero-dependency `liquid-glass.js` + `liquid-glass.css` + `tokens.css`.
  - Physically-based refraction: convex-squircle edge + Snell's law + rounded-rect SDF → per-element SVG `feDisplacementMap` used as a `backdrop-filter`.
  - Six-layer material: refraction, blur+saturation, tint, pointer/tilt-tracked specular highlight, chromatic rim, adaptive shadow.
  - **Regular** and **Clear** variants; semantic tint, shape, and interaction helper classes.
  - Public API: `init`, `apply`, `applyAll`, `set`, `refresh`, `destroy`, `makeDisplacementMap`.
  - Per-element overrides via `data-lg-refraction` / `-bezel` / `-blur` / `data-glass-variant`.
  - UMD/CommonJS/ESM export; `ResizeObserver` + `MutationObserver`; optional device-tilt specular.
  - Accessibility: automatic opaque fallback under `prefers-reduced-transparency`; reduced-motion & contrast handling.
- **React port** (`packages/react`) — `<LiquidGlass>` component + `useLiquidGlass` / `useGlassRef` hooks.
- **React Native port** (`packages/react-native`) — `LiquidGlass` (BlurView) + `LiquidGlassSkia` (real refraction via a Skia SkSL shader).
- **Flutter port** (`packages/flutter`) — `LiquidGlass` widget + `LiquidGlassRefractive` with a bundled GLSL fragment shader.
- **SwiftUI port** (`packages/swiftui`) — `.liquidGlass()` over Apple's native iOS 26 `glassEffect`, with a pre-26 `.ultraThinMaterial` fallback.
- **14 example pages** (`examples/`) and **6 self-contained showcase artifacts** (`artifacts/`).
- **13 documentation files** (`docs/`) from ELI5 to full API and cross-platform reference.
- **5 AI skills** (`skills/`) — web, react, flutter, swiftui builders + an auditor.
- **Brand & diagrams** (`assets/`) — logo, banner, refraction + layer diagrams (SVG + PNG).

### Known limitations
- SVG-filter-as-`backdrop-filter` refraction renders in Chromium engines; Safari/Firefox fall back to blur + specular. Apple platforms refract natively.
