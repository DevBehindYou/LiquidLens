# AI_CONTEXT — LiquidLens (machine-oriented spec)

> Audience: an AI coding agent. This is the dense, authoritative contract for the whole repo.
> Read it before generating any Liquid Glass code. Human narrative is in `README.md` + `docs/`.

## 0. One-line truth

**Liquid Glass = glassmorphism (blur+tint) + genuine EDGE REFRACTION + motion specular + adaptive depth.**
If you ship only blur, you built glassmorphism and FAILED the task. Refraction is mandatory.

## 1. Pick the platform, then the entry point

| If the target is… | Use | Entry |
|---|---|---|
| a web page / any DOM | `packages/core` | `class="lg-glass"` + `data-glass` + `LiquidGlass.init()` |
| React (DOM) | `packages/react` | `<LiquidGlass>` + `useLiquidGlass()` (wraps the core) |
| React Native | `packages/react-native` | `LiquidGlassSkia` (real refraction) or `LiquidGlass` (blur only) |
| Flutter | `packages/flutter` | `LiquidGlassRefractive` (+ `liquid_glass.frag`) or `LiquidGlass` |
| Apple (SwiftUI, iOS/macOS 26+) | `packages/swiftui` | `.liquidGlass()` → Apple's **native** `glassEffect` |

Need a single self-contained HTML file (artifact/email)? Inline `tokens.css`+`liquid-glass.css` into a `<style>` and `liquid-glass.js` into a `<script>` (escape the literal `</script>` in its doc comment as `<\/script>`). Pattern: any file in `artifacts/`.

## 2. The refraction algorithm (authoritative; matches packages/core/liquid-glass.js)

```
INPUT: width w, height h, corner radius r, bezel b (px), refraction scale s (px)
1. EDGE = convex squircle:  height(x) = (1 - (1-x)^4)^(1/4),  x∈[0,1] = depth into bezel.
2. PROFILE(x): slope=d/dx height; θ1=atan(slope); θ2=asin((1/1.5)·sinθ1); deflection=tan(θ1-θ2).
   Normalize PROFILE to [0,1] by its max. Precompute (128 samples).
3. Per pixel: dist=signedDistanceRoundRect(...); depth=-dist.
   if (dist<0 && depth<b): t=depth/b; mag=PROFILE(t); n=normalize(∇dist)  // outward normal
                           (dx,dy)=n·mag           // push OUTWARD ⇒ magnifying lens
   else (dx,dy)=0
   R=128+dx·127; G=128+dy·127; B=128; A=255
4. canvas → toDataURL → <feImage> in a <filter>;
   <feDisplacementMap in="SourceGraphic" in2="map" scale="s" xChannelSelector="R" yChannelSelector="G"/>
5. el.style.backdropFilter = `blur(${blur}px) saturate(${sat}) url(#id)`
```
Constants: air n=1, glass n=1.5; 128=neutral; regenerate map on size/radius/bezel change; animate `scale` cheaply, never geometry per-frame.

## 3. Web core API (packages/core/liquid-glass.js — global `LiquidGlass`/`LiquidLens`)

```
init(options?)  apply(el,opts?)  applyAll()  set(partial)  refresh(el)  destroy()
state           makeDisplacementMap(w,h,radius,bezel)->dataURL
```
Options (defaults / range): refraction 18 /0–60 · bezel 22 /4–60 · blur 3 /0–20 (keep 0–4!) ·
saturation 1.8 /1–3 · specular 0.9 /0–1.5 · tintHue 220 /0–360 · tintOpacity 0.10 /0–0.4 ·
quality 360 /128–512 · tilt false.
Per-element overrides: `data-lg-refraction|-bezel|-blur`, `data-glass-variant="clear"`, `style="--lg-radius:..px"`.
Required DOM: `<div class="lg-glass" data-glass>…</div>`. Element must have a resolved size before applyAll (runs on load +150ms, resize, ResizeObserver, MutationObserver for late nodes; else call apply(el) yourself).

## 4. CSS (packages/core) — classes

Material `.lg-glass`; variant `.lg-clear` (+ child `<span class="lg-scrim">`); helpers
`.lg-btn .lg-toolbar .lg-card .lg-pill .lg-circle .lg-sm .lg-lg`;
tints `.lg-tint-blue|green|red|purple|amber`; interaction `.lg-press .lg-interactive`; `.lg-morph`.
Tokens live in `tokens.css` (all `--lg-*`); re-theme by overriding on `:root` or a scope. `[data-lg-env="dark"]` = dark scope.

## 5. Do / Avoid (all platforms)

DO: keep blur ≤4 with refraction on; match `--lg-radius` to visual radius; bezel < min(w,h)/2; rich backdrop
(glass over flat gray is invisible); Regular by default; Clear+scrim ONLY over bright media; subtle tint (≤~0.15);
respect reduced-transparency/motion (CSS already does); one glass layer over content.
AVOID: blur-only "glass"; glass-on-glass stacks; heavy tint (colored card); assuming Safari/FF refract
(they fall back to blur — never claim otherwise); rebuilding maps every frame for size changes.

## 6. Native API cheat-sheets (for the ports)

SwiftUI (iOS 26+): `.glassEffect(_ glass: Glass = .regular, in: Shape = Capsule())`; `Glass.regular/.clear/.identity`,
`.tint(_:)`, `.interactive()`; `GlassEffectContainer(spacing:)`; `.glassEffectID(_:in:)`+`@Namespace`;
`.glassEffectTransition(_:)`; `.buttonStyle(.glass)`/`.glassProminent`; `.rect(cornerRadius:.containerConcentric)`;
fallback `if #available(iOS 26.0,*) … else .ultraThinMaterial`. Reserve for navigation layer; no glass-on-glass.

Flutter: `BackdropFilter(ImageFilter.blur)` = translucency; a `FragmentProgram` shader (`liquid_glass.frag`, same
squircle+Snell+SDF model) = refraction. Or pub.dev `liquid_glass_renderer` (LiquidGlass/LiquidGlassLayer/Glassify;
thickness, blur, refractiveIndex≈1.5, glassColor, lightAngle).

React Native: no `backdrop-filter`. Blur via `expo-blur`/`@react-native-community/blur`; REAL refraction via
`@shopify/react-native-skia` runtime SkSL shader (ported from the core model). Plain blur = glassmorphism only.

## 7. Browser support

Chromium (Chrome/Edge/Arc/Brave/Opera): full refraction. Safari(WebKit)/Firefox(Gecko): SVG-as-backdrop-filter
ignored → automatic blur+specular fallback (still glassy). Apple native platforms refract everywhere.

## 8. Where things are

Optics `docs/02` · anatomy `docs/03` · variants `docs/04` · HIG `docs/05` · web build `docs/06` · support `docs/07` ·
tokens `docs/08` · a11y `docs/09` · full API `docs/10` · cross-platform `docs/11` · FAQ `docs/12` · ELI5 `docs/00`.
Code: `packages/*`. Runnable: `examples/*` (14), `artifacts/*` (6). Build/audit procedures: `skills/*` (5).
