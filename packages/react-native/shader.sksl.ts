/**
 * LiquidLens — React Native port · SkSL refraction shader
 * =====================================================================
 * This is the GPU port of the web engine's optical model. Where the web
 * core bakes the model into an SVG displacement map and lets the browser's
 * `feDisplacementMap` do the sampling, here we do the whole thing live in a
 * Skia runtime shader (SkSL): for every output pixel we compute how much the
 * glass edge would bend a ray, then sample the backdrop image at the
 * displaced coordinate.
 *
 * The optical model is identical to the web engine
 * (see core/liquid-glass.js → buildProfile / makeDisplacementMap):
 *
 *   1. Rounded-rect signed distance field (SDF). Negative = inside.
 *   2. Convex "squircle" edge profile:  h(t) = (1 - (1 - t)^4)^(1/4)
 *      over the bezel band, where t = depth / bezel, depth = -sdf.
 *   3. Snell refraction across that surface (air n=1 → glass n=1.5).
 *      slope → incidence angle θ₁ → θ₂ = asin((1/1.5)·sinθ₁) →
 *      ray deflection d = tan(θ₁ − θ₂).
 *   4. Displace along the OUTWARD SDF normal by d·scale. Sampling the
 *      backdrop from further outside pulls the surroundings inward, which
 *      reads as a magnifying lens at the rim — the signature Liquid Glass look.
 *
 * Uniforms (set from LiquidGlassSkia.tsx):
 *   shader  uBackdrop     the snapshot/backdrop to refract (an ImageShader)
 *   float2  uResolution   canvas size in px
 *   float   uRadius       corner radius in px
 *   float   uBezel        refracting band width in px
 *   float   uScale        refraction strength in px (feDisplacementMap "scale")
 *   float   uProfileMax   normalisation constant so the profile peaks at 1
 *                         (computed on the JS side, mirroring the core)
 *   float   uBlur         cheap edge softening (px) applied outside the band
 *   float4  uTint         premultiplied-ish tint (rgb, a) layered over glass
 *
 * NOTE: `uBackdrop` is expected to be an ImageShader in *local pixel* space
 * (same coordinate space as `main`'s fragcoord), so we can sample it directly
 * with displaced coordinates.
 */

export const LIQUID_GLASS_SKSL = /* glsl */ `
uniform shader uBackdrop;
uniform float2 uResolution;
uniform float  uRadius;
uniform float  uBezel;
uniform float  uScale;
uniform float  uProfileMax;
uniform float  uBlur;
uniform float4 uTint;

const float N_RATIO = 1.0 / 1.5; // air (1.0) entering glass (1.5)

// Signed distance to a rounded rectangle centred at the origin.
// p: point relative to centre, b: half-extents, r: corner radius.
float sdRoundRect(float2 p, float2 b, float r) {
  float2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Convex squircle edge height at normalised depth t in [0,1].
// h(t) = (1 - (1 - t)^4)^(1/4)
float edgeHeight(float t) {
  float u = 1.0 - clamp(t, 0.0, 1.0);
  float g = 1.0 - u * u * u * u;
  return pow(max(g, 0.0), 0.25);
}

// Analytic slope of edgeHeight():  h'(t) = u^3 / (1 - u^4)^(3/4)
// (guarded so the near-vertical outer edge stays finite, matching the
//  finite-difference sampling the web core uses).
float edgeSlope(float t) {
  float u = 1.0 - clamp(t, 0.0, 1.0);
  float g = max(1.0 - u * u * u * u, 1e-4);
  return (u * u * u) / pow(g, 0.75);
}

// Snell deflection magnitude for a given surface slope.
// θ₁ = atan(slope);  θ₂ = asin((1/1.5)·sinθ₁);  d = tan(θ₁ − θ₂)
float refractMagnitude(float slope) {
  float th1 = atan(slope);
  float th2 = asin(clamp(N_RATIO * sin(th1), -1.0, 1.0));
  return tan(th1 - th2);
}

half4 main(float2 fragCoord) {
  float2 res = uResolution;
  float2 halfRes = res * 0.5;
  float2 p = fragCoord - halfRes;          // centre-relative
  float2 b = halfRes;                      // half-extents
  float  r = min(uRadius, min(halfRes.x, halfRes.y));
  float  bez = max(min(uBezel, min(halfRes.x, halfRes.y) - 1.0), 2.0);

  float dist = sdRoundRect(p, b, r);

  // Outside the glass shape → fully transparent (the canvas is the glass).
  if (dist > 0.75) {
    return half4(0.0);
  }

  // Outward SDF normal via the analytic gradient of the rounded-rect SDF.
  float2 eps = float2(1.0, 0.0);
  float gx = sdRoundRect(p + eps.xy, b, r) - sdRoundRect(p - eps.xy, b, r);
  float gy = sdRoundRect(p + eps.yx, b, r) - sdRoundRect(p - eps.yx, b, r);
  float2 normal = normalize(float2(gx, gy) + 1e-6);

  // Displacement only within the bezel band nearest the edge.
  float depth = -dist;                     // >= 0 inside
  float2 sampleCoord = fragCoord;
  if (depth < bez) {
    float t   = depth / bez;               // 0 at edge → 1 at inner band
    float mag = refractMagnitude(edgeSlope(t)) / max(uProfileMax, 1e-4);
    mag = clamp(mag, 0.0, 1.0);
    // Push the sample outward → magnifying rim (matches feDisplacementMap).
    sampleCoord = fragCoord + normal * (mag * uScale);
  }

  // Sample the backdrop at the (possibly displaced) coordinate. A tiny bit of
  // extra sampling gives cheap edge softening in lieu of a true blur pass.
  half4 bg = uBackdrop.eval(sampleCoord);
  if (uBlur > 0.01) {
    half4 s1 = uBackdrop.eval(sampleCoord + float2(uBlur, 0.0));
    half4 s2 = uBackdrop.eval(sampleCoord - float2(uBlur, 0.0));
    half4 s3 = uBackdrop.eval(sampleCoord + float2(0.0, uBlur));
    half4 s4 = uBackdrop.eval(sampleCoord - float2(0.0, uBlur));
    bg = (bg * 2.0 + s1 + s2 + s3 + s4) / 6.0;
  }

  // Layer the environment tint over the refracted backdrop.
  half3 col = mix(bg.rgb, uTint.rgb, half(uTint.a));

  // Antialias the outer edge over the last ~0.75px of the SDF.
  float alpha = 1.0 - smoothstep(-0.75, 0.75, dist);
  return half4(col * half(alpha), half(alpha));
}
`;

export default LIQUID_GLASS_SKSL;
