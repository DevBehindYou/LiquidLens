# 02 · Optics & Physics of the refraction

This is the math behind the one behavior that makes Liquid Glass *Liquid Glass*: **edge lensing**. The implementation in `packages/core/liquid-glass.js` is a direct, line-for-line encoding of everything on this page. If you read one deep doc, read this one — every other technique hangs off it.

## 1. Why the edges bend light (Snell's law)

When light crosses from one medium into another with a different **refractive index (n)**, it bends. Air ≈ **n₁ = 1.0**; window glass ≈ **n₂ = 1.5**. The relationship is Snell–Descartes:

```
n₁ · sin(θ₁) = n₂ · sin(θ₂)
```

- **θ₁** = angle of the incoming ray relative to the surface **normal** (the line perpendicular to the surface).
- **θ₂** = angle of the ray after it enters the denser medium.

Where the glass surface is **flat** (the center of the pane), a straight-on ray hits with θ₁ = 0, so θ₂ = 0 — **no bending**. Where the surface is **curved** (the rounded rim, or "bezel"), the normal tilts, θ₁ grows, and the ray is deflected sideways. That sideways deflection, accumulated through the glass, is what magnifies and warps the background at the edges.

**Consequence for UI:** refraction is an **edge phenomenon**. We model a thin curved band around the perimeter and leave the interior flat. This is both physically correct and cheap.

## 2. The edge surface: a convex squircle (not a circle)

We need a **height profile** for the bezel — a function describing how the glass surface rises from the outer edge up to the flat interior. Several shapes are possible:

| Surface | height(x), x ∈ [0,1] from edge → inner | Look |
|---|---|---|
| Convex circle | √(1 − (1−x)²) | Spherical dome; abrupt transition to the flat interior |
| **Convex squircle** | **(1 − (1−x)⁴)^(1/4)** | **Apple's choice**; smooth edge→flat blend; survives stretching into rectangles |
| Concave | 1 − convex(x) | Bowl / pool; light diverges instead of magnifying |
| Lip | blend of convex + concave | Raised rim with a shallow dip |

Apple's UI shapes are **squircles** (superellipses), so we use the **convex squircle** height profile. Its key property: it keeps refraction smooth even when a control is a long pill or a wide bar, where a circular dome would look pinched. This is `f(u)` in the code:

```js
// packages/core/liquid-glass.js
var f = function (u) {
  u = clamp(u, 0, 1);
  return Math.pow(1 - Math.pow(1 - u, 4), 1 / 4);   // height(x) = (1 - (1-x)^4)^(1/4)
};
```

## 3. From surface to displacement (per-depth deflection)

For a normalized depth `x` into the bezel (0 = outer edge, 1 = inner flat), we compute how far a straight-down ray gets pushed sideways:

```
slope   = d/dx height(x)                 # numerically: (h(x+ε) − h(x−ε)) / 2ε,  ε = 0.001
θ₁      = atan(slope)                     # surface tilt = incidence angle for a straight-down ray
θ₂      = asin( (n₁/n₂) · sin(θ₁) )       # Snell, with n₁/n₂ = 1/1.5
deflect = tan(θ₁ − θ₂)                    # lateral shift of the refracted ray
```

Compute `deflect` for many `x` samples (128 is plenty), then **normalize** the whole profile by its maximum so it runs 0..1. The pixel `scale` (the `refraction` parameter) turns it back into real pixels later. The profile peaks near the outer edge and falls to ~0 at the inner edge, producing the classic **bright, magnified ring hugging the rim**.

This is exactly `buildProfile` in the engine:

```js
function buildProfile(samples) {
  var f = function (u) { u = clamp(u, 0, 1); return Math.pow(1 - Math.pow(1 - u, 4), 1 / 4); };
  var eps = 0.001, n = 1 / 1.5, arr = [], max = 0;
  for (var i = 0; i <= samples; i++) {
    var t = i / samples;
    var slope = (f(t + eps) - f(t - eps)) / (2 * eps);   // finite-difference derivative
    var th1 = Math.atan(slope);
    var th2 = Math.asin(Math.min(1, n * Math.sin(th1))); // Snell; clamp guards total internal reflection
    var d = Math.tan(th1 - th2);
    arr.push(d); if (d > max) max = d;
  }
  return arr.map(function (v) { return max > 0 ? v / max : 0; });
}
var PROFILE = buildProfile(128);   // precomputed once, reused for every element
```

Precomputing the 128-sample profile once (not per pixel, not per element) is what keeps map generation fast.

## 4. Placing it on a rounded rectangle (SDF)

A UI pane is a rounded rectangle, so for every pixel we need two things: (a) how deep it is from the nearest edge, and (b) which direction is "outward." Both come from the **signed distance function (SDF)** of a rounded rectangle:

```
sdRoundRect(p, halfSize, r):
    q = abs(p) − halfSize + r
    return length(max(q, 0)) + min(max(q.x, q.y), 0) − r     # <0 inside, 0 on the edge, >0 outside
```

In the engine:

```js
function sdRoundRect(x, y, w, h, r) {
  var qx = Math.abs(x - w / 2) - (w / 2 - r);
  var qy = Math.abs(y - h / 2) - (h / 2 - r);
  var ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}
```

From the SDF:

- **depth** = −sd (positive inside). If `depth < bezel`, the pixel is inside the refracting band.
- **outward normal** = normalize(∇sd) — the gradient of the SDF, approximated by finite differences. The gradient points in the direction distance *increases*, which is outward.

At each in-band pixel: `magnitude = profile(depth / bezel)`, and `displacement = normal · magnitude`. Pushing samples **outward** yields a convex, magnifying lens. Flip the sign and you get a concave "pool."

## 5. Encoding into a displacement-map image

`feDisplacementMap` doesn't read numbers — it reads a **bitmap**, taking the X and Y shift for each pixel from two color channels, where the value **128 means zero shift**:

```
RED   (X) = 128 + displacement.x · 127
GREEN (Y) = 128 + displacement.y · 127
BLUE      = 128     (unused)
ALPHA     = 255
```

So an 8-bit channel encodes signed displacement in [−1, +1] before scaling. Here is the pixel loop that writes the map (abridged from `makeDisplacementMap`):

```js
for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
  var i = (y * W + x) * 4;
  var dist = sdRoundRect(x + 0.5, y + 0.5, W, H, R);
  var depth = -dist, rx = 0, ry = 0;
  if (dist < 0 && depth < B) {                       // inside, within the bezel band
    var t = depth / B, mag = sampleProfile(t);       // Snell profile at this depth
    var gx = sdRoundRect(x + 1.5, y + 0.5, W, H, R) - sdRoundRect(x - 0.5, y + 0.5, W, H, R);
    var gy = sdRoundRect(x + 0.5, y + 1.5, W, H, R) - sdRoundRect(x + 0.5, y - 0.5, W, H, R);
    var gl = Math.hypot(gx, gy) || 1;
    rx = (gx / gl) * mag; ry = (gy / gl) * mag;       // outward normal × magnitude → magnify
  }
  d[i] = 128 + rx * 127; d[i + 1] = 128 + ry * 127; d[i + 2] = 128; d[i + 3] = 255;
}
```

The canvas is then exported with `toDataURL()` and handed to an `<feImage>`. The SVG filter does, per backdrop pixel:

```
shiftedX = x + ((R − 128) / 127) · scale
shiftedY = y + ((G − 128) / 127) · scale
```

with `<feDisplacementMap in="SourceGraphic" in2="map" scale="s" xChannelSelector="R" yChannelSelector="G"/>`. Because the channels are 8-bit, the practical displacement resolution is ~±128 steps — more than enough for UI.

## 6. Constants that matter

- **n₂ = 1.5** (window glass). Raise it toward 1.9 (sapphire, diamond-ish) for a stronger bend; lower it toward 1.33 (water) for a gentler one.
- **128 = neutral** in an 8-bit channel; deviation from 128 encodes signed displacement.
- Displacement direction is the **outward SDF normal**, so content magnifies at the rim (convex). Flip the sign for a concave / pool look.
- **Regenerate the map** whenever w, h, r, or b change. Animating only the filter `scale` is cheap; changing geometry forces a full map rebuild — see **[07 · Browser Support](07-browser-support.md)** §Performance.

## 7. Honest limits (what this approximation is not)

This is a fast **2D approximation**, not a ray tracer. It assumes a single refraction event (not entry *and* exit through the far side), orthogonal incoming rays (camera straight-on), no dispersion by default, and shapes built from rounded rectangles. That is more than enough to be visually convincing. Things you can layer on for higher fidelity:

- **Chromatic aberration:** run the displacement slightly differently per color channel, or fake it with a cool/warm rim in CSS (LiquidLens ships the cheap CSS version — see **[03 · Material Anatomy](03-material-anatomy.md)**).
- **Concave / lip profiles:** swap the height function in §2.
- **Virtual thickness:** multiply deflection by a thickness factor for stronger magnification.
- **Full 3D:** capture the backdrop to a texture and render a real IOR glass material in WebGL. Highest fidelity, highest cost, reserved for hero moments.

## Sources

- kube.io — *Liquid Glass in the Browser: Refraction with CSS and SVG* (full derivation): https://kube.io/blog/liquid-glass-css-svg/
- MDN — `<feDisplacementMap>`: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap
- Inigo Quilez — 2D signed distance functions (rounded box): https://iquilezles.org/articles/distfunctions2d/
- Apple Developer — *Adopting Liquid Glass*: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
