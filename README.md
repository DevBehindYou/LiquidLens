<!--
  LiquidLens — Apple Liquid Glass UI library (iOS 26 glass effect) for Web, React,
  React Native, Flutter & SwiftUI. Real refraction via CSS backdrop-filter + SVG
  feDisplacementMap, Skia SkSL and GLSL shaders, and Apple's native glassEffect.
  Keywords: liquid glass css, ios 26 liquid glass, apple liquid glass effect, liquid
  glass react, liquid glass flutter, swiftui glasseffect, glassmorphism refraction,
  backdrop-filter, frosted glass ui, liquid glass ui kit, wwdc25 design, glass ui.
-->

<div align="center">

<img src="assets/banner.png" alt="LiquidLens — Apple Liquid Glass UI library for Web, React, React Native, Flutter and SwiftUI, with real edge refraction" width="100%" />

# 💧 LiquidLens — Apple Liquid Glass for Every Platform

**The iOS 26 Liquid Glass effect with _real_ edge refraction — not just another blur.**
One optical engine, five platforms: **Web · React · React Native · Flutter · SwiftUI.**

[![Platforms](https://img.shields.io/badge/platforms-Web%20·%20React%20·%20React%20Native%20·%20Flutter%20·%20SwiftUI-8a5cff?style=for-the-badge)](#-one-engine-five-platforms)
[![Zero dependencies](https://img.shields.io/badge/core-zero%20dependencies-ff5ea8?style=for-the-badge)](packages/core)
[![License MIT](https://img.shields.io/badge/license-MIT-2bd6ff?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.1-1abc9c?style=for-the-badge)](CHANGELOG.md)

<img src="assets/hero.gif" alt="Live demo of the Liquid Glass effect: draggable glass panels refracting a colorful wallpaper, with a Material Lab panel tuning refraction, bezel, blur and tint in real time" width="90%" />

*↑ Real footage from [`artifacts/01-playground.html`](artifacts/01-playground.html) — drag any panel, tune the material live.*

**⭐ If LiquidLens saves you a week of shader math, star the repo — it helps others find it.**

</div>

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 📖 Table of Contents

**[Why blur is not Liquid Glass](#-blur-is-not-liquid-glass)** ·
**[Features](#-features)** ·
**[Quick start](#-quick-start-30-seconds-to-glass)** ·
**[Five platforms](#-one-engine-five-platforms)** ·
**[Showcase](#-showcase-gallery)** ·
**[How it works](#-how-the-refraction-works-the-60-second-physics)** ·
**[The vision](#-why-i-built-this)** ·
**[Docs](#-documentation)** ·
**[FAQ](#-faq)** ·
**[Contributing](#-contributing)**

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 🔍 Blur is NOT Liquid Glass

Search "liquid glass CSS" and almost every tutorial hands you `backdrop-filter: blur(12px)` with a white tint. That's **glassmorphism** — a 2020 trend. Apple's **Liquid Glass** (WWDC 2025, iOS 26 / macOS Tahoe) is a different animal: a *meta-material* whose defining trait is that **light bends at its edges**, exactly like the rim of a real lens.

<div align="center">
<img src="assets/compare.png" alt="Side-by-side comparison: glassmorphism blur-only card versus LiquidLens card with genuine edge refraction that bends and magnifies the background" width="100%" />
</div>

| | 🧊 Glassmorphism (what tutorials teach) | 💧 Liquid Glass (what Apple ships / what LiquidLens does) |
|---|:---:|:---:|
| Backdrop blur + tint | ✅ | ✅ |
| **Edge refraction / lensing** | ❌ | ✅ **the defining trait** |
| Motion-tracking specular highlight | ❌ | ✅ |
| Chromatic edge (light dispersion) | ❌ | ✅ |
| Adaptive shadow & legibility | ❌ | ✅ |
| Regular / Clear variants (Apple's vocabulary) | ❌ | ✅ |

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## ⚡ Features

🔬 **Physically-based refraction** — convex-squircle edge + Snell's law (air n=1.0 → glass n=1.5) + signed-distance fields, compiled into a per-element displacement map. Not an approximation of the look; an implementation of the optics.

🪶 **Zero-dependency core** — one JS file, two CSS files. No build step, no framework, no npm required. `<script>` tag and go.

🎛️ **Live-tunable material** — refraction, bezel, blur, saturation, specular, tint hue/opacity — all adjustable at runtime with `LiquidGlass.set()`.

✨ **Motion-reactive specular** — highlights glide with the pointer (or device tilt on mobile), just like tilting an iPhone.

🧩 **Apple's real vocabulary** — `Regular` and `Clear` variants, semantic tints, interactive press illumination, morph containers.

♿ **Accessible by default** — honors `prefers-reduced-transparency` (opaque fallback + GPU work skipped), `prefers-reduced-motion`, and `prefers-contrast`.

📱 **Five platforms, one mental model** — the same parameters mean the same pixels on Web, React, React Native (Skia shader), Flutter (GLSL shader), and SwiftUI (Apple's native `glassEffect`).

🤖 **AI-ready** — ships `AI_CONTEXT.md` and five agent skills so AI coding assistants build correct Liquid Glass from this repo cold.

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 🚀 Quick start (30 seconds to glass)

```html
<link rel="stylesheet" href="packages/core/tokens.css">
<link rel="stylesheet" href="packages/core/liquid-glass.css">

<div class="lg-glass" data-glass style="--lg-radius:28px; padding:24px;">
  Hello, glass.
</div>

<script src="packages/core/liquid-glass.js"></script>
<script>LiquidGlass.init({ refraction: 18, bezel: 22, blur: 3 });</script>
```

That's it — a fully composited Liquid Glass pane with genuine edge refraction. More recipes:

```html
<!-- Clear variant over bright media (scrim keeps text legible) -->
<div class="lg-glass lg-clear" data-glass><span class="lg-scrim"></span> Play ▶ </div>

<!-- Semantic tint + press illumination -->
<button class="lg-glass lg-btn lg-tint-blue lg-press" data-glass>Confirm</button>

<!-- Tune the physics live -->
<script>LiquidGlass.set({ refraction: 34, tintHue: 280 });</script>
```

Or from npm: `npm i @liquidlens/core` → `import LiquidGlass from '@liquidlens/core'`.

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 🌍 One engine, five platforms

| Platform | Package | How refraction happens | Fallback |
|----------|---------|------------------------|----------|
| 🌐 **Web / vanilla JS** | [`packages/core`](packages/core) | SVG `feDisplacementMap` as `backdrop-filter` | blur + specular (Safari/Firefox) |
| ⚛️ **React** | [`packages/react`](packages/react) | `<LiquidGlass>` + `useLiquidGlass` over the core | same as web |
| 📱 **React Native** | [`packages/react-native`](packages/react-native) | `@shopify/react-native-skia` SkSL runtime shader | `expo-blur` glassmorphism |
| 🐦 **Flutter** | [`packages/flutter`](packages/flutter) | bundled GLSL fragment shader (`liquid_glass.frag`) | `BackdropFilter` blur |
| 🍎 **SwiftUI** | [`packages/swiftui`](packages/swiftui) | **Apple's native** `.glassEffect` (iOS 26+) | `.ultraThinMaterial` (≤ iOS 15) |

<details>
<summary><b>⚛️ React — show me the code</b></summary>

```tsx
import { LiquidGlass, useLiquidGlass } from '@liquidlens/react';
import '@liquidlens/core/liquid-glass.css';

function Card() {
  const { set } = useLiquidGlass({ refraction: 18, bezel: 22, blur: 3 });
  return <LiquidGlass radius={28} tint="blue" interactive>Hello</LiquidGlass>;
}
```
</details>

<details>
<summary><b>📱 React Native — show me the code</b></summary>

```tsx
import { LiquidGlassSkia } from '@liquidlens/react-native';

<LiquidGlassSkia width={300} height={160} radius={28} refraction={18} bezel={22}>
  <Text style={{ color: 'white' }}>Hello</Text>
</LiquidGlassSkia>
```
</details>

<details>
<summary><b>🐦 Flutter — show me the code</b></summary>

```dart
await LiquidGlassRefractive.load();          // once at startup
LiquidGlassRefractive(
  size: const Size(280, 160), borderRadius: 30, refraction: 18, bezel: 22,
  child: const Center(child: Text('Hello', style: TextStyle(color: Colors.white))),
);
```
</details>

<details>
<summary><b>🍎 SwiftUI — show me the code</b></summary>

```swift
Text("Hello").padding()
    .liquidGlass()                                    // native .glassEffect on iOS 26+
Button("Save") {}.liquidGlassStyle(prominent: true, tint: .blue)
```
</details>

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 🖼️ Showcase gallery

Six production-quality screens, each a **single self-contained HTML file** — open in Chrome/Edge/Arc, no build step:

| | | |
|:---:|:---:|:---:|
| <img src="assets/screens/02-music-player.png" alt="Liquid Glass music player UI with glass scrubber, transport buttons and bottom toolbar" width="100%"/><br>[🎵 Music player](artifacts/02-music-player.html) | <img src="assets/screens/03-lockscreen.png" alt="iOS-style lock screen with Liquid Glass notification cards and circular glass buttons" width="100%"/><br>[🔒 Lock screen](artifacts/03-lockscreen.html) | <img src="assets/screens/05-weather.png" alt="Weather app with Liquid Glass forecast cards and hourly chips" width="100%"/><br>[⛅ Weather](artifacts/05-weather.html) |
| <img src="assets/screens/04-control-center.png" alt="iOS Control Center rebuilt with Liquid Glass toggle tiles and vertical sliders" width="100%"/><br>[🎛️ Control Center](artifacts/04-control-center.html) | <img src="assets/screens/06-dashboard.png" alt="Desktop dashboard with Liquid Glass sidebar, top bar and stat cards" width="100%"/><br>[📊 Dashboard](artifacts/06-dashboard.html) | <img src="assets/screens/01-playground.png" alt="Interactive Liquid Glass playground with draggable panels and live material controls" width="100%"/><br>[🧪 Playground](artifacts/01-playground.html) |

Plus **14 focused component examples** in [`examples/`](examples): buttons, toolbars, docks, segmented controls, sliders, notifications, search bars, modals, chips, side panels, tooltips…

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 🧠 How the refraction works (the 60-second physics)

<div align="center">
<img src="assets/diagram-refraction.png" alt="Diagram: how a convex squircle glass edge bends light via Snell's law, encoded into an SVG displacement map" width="49%" />
<img src="assets/diagram-layers.png" alt="Diagram: the six compositing layers of the Liquid Glass material — refraction, blur, tint, specular highlight, chromatic rim, adaptive shadow" width="49%" />
</div>

1. Model the glass **edge** as a **convex squircle**: `height(x) = (1 − (1−x)⁴)^¼` — Apple's superellipse shape language.
2. Across the edge band, apply **Snell's law** (`n₁ sin θ₁ = n₂ sin θ₂`, air → glass 1.5) to get each ray's deflection.
3. Get every pixel's depth + outward direction from a rounded-rect **signed distance field**.
4. Encode deflections into a bitmap — **Red = X shift, Green = Y shift, 128 = neutral**.
5. `feDisplacementMap` shifts the backdrop by `((R−128)/127) × scale` → the background **magnifies at the rim**, exactly like real glass.

The same model is ported as an **SkSL shader** (React Native) and a **GLSL fragment shader** (Flutter), so `refraction: 18` means the same 18 pixels everywhere. Full math: [`docs/02-optics-and-physics.md`](docs/02-optics-and-physics.md).

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 🎯 Why I built this

When Apple unveiled Liquid Glass at WWDC 2025, I went looking for a faithful web implementation. What I found was an ocean of `blur(12px)` tutorials calling themselves "liquid glass." The *actual* optics — the lensing that makes the material feel alive — were nowhere, and nothing spanned the platforms real products ship on.

So I did it properly: read the physics, reverse-engineered the displacement-map technique, verified every pixel in a real rendering engine, and wrapped it in Apple's own design vocabulary — Regular/Clear, tints, interactive, morph. Then I ported the same optical model to Skia, GLSL, and Apple's native API so **one mental model works everywhere your app does**.

The goal: **any developer — or any AI agent — should be able to ship correct, accessible, performant Liquid Glass in minutes, on any platform, without a PhD in optics.** This repo is the library *and* the complete knowledge base behind it.

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 📚 Documentation

Start with the friendly **[ELI5 explainer](docs/00-eli5.md)** 🧒 — then go as deep as you like:

| Learn | Build | Master |
|---|---|---|
| [What is Liquid Glass?](docs/01-what-is-liquid-glass.md) | [Web implementation guide](docs/06-web-implementation.md) | [Full API reference](docs/10-api-reference.md) |
| [Optics & physics](docs/02-optics-and-physics.md) | [Design tokens & theming](docs/08-design-tokens.md) | [Cross-platform guide](docs/11-cross-platform.md) |
| [Material anatomy](docs/03-material-anatomy.md) | [Regular vs Clear variants](docs/04-variants-regular-clear.md) | [Browser support & perf](docs/07-browser-support.md) |
| [UI/UX guidelines (HIG)](docs/05-ui-ux-guidelines.md) | [Accessibility](docs/09-accessibility.md) | [FAQ](docs/12-faq.md) |

🤖 **For AI agents:** [`AI_CONTEXT.md`](AI_CONTEXT.md) is a dense machine-readable spec, and [`skills/`](skills) contains five ready-to-use skills (web, React, Flutter, SwiftUI builders + a QA **auditor**).

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## ❓ FAQ

<details><summary><b>Why does my glass look like plain blur in Safari or Firefox?</b></summary>
Using an SVG filter as a <code>backdrop-filter</code> (the refraction path) currently renders in <b>Chromium</b> engines only — Chrome, Edge, Arc, Brave, Opera. Safari and Firefox automatically fall back to blur + specular, which still looks like quality glass. Apple's native platforms refract everywhere, which is why the SwiftUI port uses the system <code>glassEffect</code>. <a href="docs/07-browser-support.md">Details →</a></details>

<details><summary><b>How is this different from a glassmorphism CSS generator?</b></summary>
Generators output a blur + tint + border. LiquidLens additionally computes a physically-based displacement map per element and bends the backdrop at the edges — the optical signature of Apple's material. See the <a href="#-blur-is-not-liquid-glass">comparison above</a>.</details>

<details><summary><b>My glass is invisible — why?</b></summary>
Two usual causes: the element sits over a flat background (glass needs a rich backdrop to refract — gradients, photos, text), or <code>blur</code> is set so high it erases the lensing. Keep blur 0–4 px.</details>

<details><summary><b>Does it hurt performance?</b></summary>
Displacement maps are generated only on create/resize (capped by the <code>quality</code> parameter), and animation should target <code>transform</code>/<code>scale</code>, which is cheap. Use a few large panes rather than dozens of tiny ones. <a href="docs/07-browser-support.md">Performance model →</a></details>

<details><summary><b>Is it accessible?</b></summary>
Yes — <code>prefers-reduced-transparency</code> swaps in an opaque surface (and skips the GPU work), <code>prefers-reduced-motion</code> freezes highlights, <code>prefers-contrast</code> strengthens edges. <a href="docs/09-accessibility.md">Accessibility guide →</a></details>

<details><summary><b>Can I use it in production?</b></summary>
The core is dependency-free, MIT-licensed, and degrades gracefully. Treat the refraction as progressive enhancement (Chromium gets the full effect), keep contrast WCAG-compliant, and you're production-ready. The RN Skia and Flutter shader paths are marked experimental — test on your target devices.</details>

<details><summary><b>Does it work with Tailwind / Next.js / Vue / Svelte?</b></summary>
Yes. The core is framework-agnostic — any element with <code>class="lg-glass" data-glass</code> works. The React package adds idiomatic bindings; other frameworks can call <code>LiquidGlass.apply(el)</code> directly.</details>

<img src="assets/divider.svg" alt="" width="100%" height="24" />

## 🤝 Contributing

PRs welcome — the bar is in [CONTRIBUTING.md](CONTRIBUTING.md) (short version: refraction is non-negotiable, accessibility ships with features, core stays dependency-free). Found a bug? Open an issue with a screenshot over a busy background.

**⭐ Star the repo** if this saved you time — it's the best way to help other developers discover real Liquid Glass.

## 📄 License

[MIT](LICENSE) © Akash Sharma. *"Liquid Glass" is Apple's design language; LiquidLens is an independent, educational implementation not affiliated with or endorsed by Apple Inc.*

---

<div align="center">
<img src="assets/logo.png" alt="LiquidLens logo — a glass lens droplet on an iOS-style squircle app icon" width="88" /><br>
<sub><b>LiquidLens</b> · Apple Liquid Glass UI library · iOS 26 glass effect · CSS refraction · glassmorphism, evolved<br>
Web · React · React Native · Flutter · SwiftUI — made with Snell's law and love for the craft.</sub>
</div>
