# 06 · Web implementation — step by step

How to build Liquid Glass in a browser, from a plain blurred card up to genuine refraction, and then how to stop hand-rolling and use LiquidLens. All code matches `packages/core/liquid-glass.*`. Copy freely.

## Level 0 — Glassmorphism (the starting point, NOT the goal)

```css
.card {
  background: rgba(255, 255, 255, .12);
  backdrop-filter: blur(12px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, .25);
  border-radius: 24px;
}
```

Frosted, blurred, tinted. This is where most tutorials stop. It is **missing refraction** — so it is glassmorphism, not Liquid Glass. (Note the heavy 12px blur, a classic tell: it smears everything into a uniform frost. Liquid Glass keeps blur low so the lensing survives.)

## Level 1 — Add the refraction (the real thing)

The refraction is an SVG filter used as a `backdrop-filter`. It needs two primitives:

1. `<feImage>` loads a **displacement map** — a bitmap where the R and G channels encode X and Y pixel shifts, with 128 meaning "no shift" (see **[02 · Optics & Physics](02-optics-and-physics.md)** §5).
2. `<feDisplacementMap>` shifts the backdrop by those channel values × `scale`.

```html
<svg width="0" height="0" aria-hidden="true">
  <filter id="glassLens" color-interpolation-filters="sRGB"
          x="0" y="0" width="100%" height="100%">
    <feImage href="data:image/png;base64,…the map…"
             x="0" y="0" width="320" height="120"
             preserveAspectRatio="none" result="m"/>
    <feDisplacementMap in="SourceGraphic" in2="m" scale="18"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>

<style>
  .glass {
    backdrop-filter: blur(3px) saturate(1.8) url(#glassLens);
    background: hsla(220, 40%, 70%, .10);
    border-radius: 28px;
  }
</style>
```

Key rules:

- The filter must be **sized to the element** — the `<feImage>` width/height and the element's box must match, because the displacement map is geometry-specific. Different-sized panes need different maps, so LiquidLens builds **one map per element**.
- `color-interpolation-filters="sRGB"` avoids a gamma color shift.
- Put `url(#…)` **after** blur/saturate so the refracted edges stay crisp over the blurred field.

## Level 2 — Generate the displacement map (JavaScript)

You don't hand-draw the map — you compute it from the squircle + Snell model (see **[02](02-optics-and-physics.md)**) onto a canvas and export a data URL. The essence, matching `makeDisplacementMap` in `liquid-glass.js`:

```js
function makeDisplacementMap(w, h, radius, bezel) {
  const cvs = document.createElement('canvas'); cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d'); const img = ctx.createImageData(w, h); const d = img.data;

  // signed distance to a rounded rect (negative inside)
  const sd = (x, y) => {
    const qx = Math.abs(x - w / 2) - (w / 2 - radius), qy = Math.abs(y - h / 2) - (h / 2 - radius);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
  };

  // convex-squircle height + Snell profile, normalized 0..1 across the bezel
  const f = u => Math.pow(1 - Math.pow(1 - Math.min(Math.max(u, 0), 1), 4), 1 / 4);
  const prof = t => {
    const s = (f(t + 1e-3) - f(t - 1e-3)) / 2e-3, a = Math.atan(s),
          b = Math.asin(Math.min(1, (1 / 1.5) * Math.sin(a)));
    return Math.tan(a - b);
  };
  let max = 0; for (let i = 0; i <= 64; i++) max = Math.max(max, prof(i / 64)); max = max || 1;

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, dist = sd(x + .5, y + .5), depth = -dist; let rx = 0, ry = 0;
    if (dist < 0 && depth < bezel) {
      const mag = prof(depth / bezel) / max;
      const gx = sd(x + 1.5, y + .5) - sd(x - .5, y + .5),
            gy = sd(x + .5, y + 1.5) - sd(x + .5, y - .5);
      const gl = Math.hypot(gx, gy) || 1;
      rx = (gx / gl) * mag; ry = (gy / gl) * mag;   // outward normal → magnify
    }
    d[i] = 128 + rx * 127; d[i + 1] = 128 + ry * 127; d[i + 2] = 128; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cvs.toDataURL();
}
```

Then inject a `<filter>` per element and set its `backdrop-filter`. Regenerate on resize. (The shipping engine also precomputes the profile once and caps the canvas at the `quality` dimension for speed — see the real source.)

## Level 3 — Add the other layers (CSS)

Specular rim, moving highlight, chromatic edge, adaptive shadow, and inner light lines are all pure CSS, documented in **[03 · Material Anatomy](03-material-anatomy.md)**. They work in **every** browser, so even where refraction is unsupported the element still reads as glass. Import order matters:

```
tokens.css  →  liquid-glass.css  →  your styles
```

## Level 4 — Use LiquidLens instead of hand-rolling

Everything above is packaged. This is the recommended path:

```html
<link rel="stylesheet" href="packages/core/tokens.css">
<link rel="stylesheet" href="packages/core/liquid-glass.css">

<div class="lg-glass lg-card" data-glass style="--lg-radius:28px; padding:24px;">
  Hello, glass
</div>

<script src="packages/core/liquid-glass.js"></script>
<script>
  LiquidGlass.init({
    refraction: 18, bezel: 22, blur: 3, saturation: 1.8,
    specular: 0.9, tintHue: 220, tintOpacity: 0.10
  });

  // Live-tweak later (e.g. from a control panel):
  //   LiquidGlass.set({ refraction: 30 });
  // Apply to an element you injected after init:
  //   LiquidGlass.apply(myEl);
</script>
```

`data-glass` marks an element as "manage me." `init()` scans for all such elements, generates their maps, and wires up resize, pointer, `ResizeObserver`, and `MutationObserver` (so glass added later is picked up automatically). Full method and option reference in **[10 · API Reference](10-api-reference.md)**.

## Advanced techniques (optional)

- **True chromatic aberration.** Run three `feDisplacementMap` passes at slightly different `scale` values on R/G/B and recombine with `feColorMatrix` + `feBlend`. Heavier; the CSS cool/warm rim is a cheap stand-in that LiquidLens ships by default.
- **Content-aware adaptive shadow/tint.** Draw the region behind the element to an offscreen canvas (via the page's own gradient, or `html2canvas` for arbitrary DOM), measure average luminance, and modulate shadow alpha or tint lightness. This reproduces Apple's "shadow deepens over busy areas."
- **Full 3D refraction.** Capture the backdrop to a texture and render a real IOR glass material in WebGL / Three.js with an environment map. Highest fidelity, highest cost — reserve it for hero moments.
- **Morph transitions.** Animate size and position with springy easing and regenerate the map only when the element settles; during the animation, animate the filter `scale` (cheap) rather than rebuilding.

## Gotchas checklist

- [ ] Element has a resolved size before `applyAll()` runs (otherwise the map generation is skipped for anything under 4px).
- [ ] `--lg-radius` equals the visual corner radius (the map corners must match, or the lens will bleed past the box).
- [ ] `blur` kept low (0–4) so refraction is visible.
- [ ] The backdrop is visually rich — a gradient, photo, or other content. **Glass over flat gray shows nothing.**
- [ ] Tested in a Chromium browser for actual refraction; verified the graceful fallback in Safari/Firefox.
- [ ] Reduced-transparency and reduced-motion fallbacks left intact.
- [ ] Tint opacity kept ≤ ~0.15 so it stays glass, not a colored card.

## Sources

- kube.io — *Liquid Glass in the Browser*: https://kube.io/blog/liquid-glass-css-svg/
- MDN — `backdrop-filter`: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- MDN — `<feDisplacementMap>`: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap
- MDN — `<feImage>`: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feImage
