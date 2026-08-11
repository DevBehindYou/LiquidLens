// liquid_glass.frag
// LiquidLens — Flutter fragment shader for GENUINE Liquid Glass refraction.
// ---------------------------------------------------------------------------
// Same model as the web engine (packages/core/liquid-glass.js):
//   • rounded-rectangle signed distance field (SDF)
//   • convex-squircle edge profile  h(x) = (1 - (1-x)^4)^(1/4)
//   • Snell refraction (air n=1 → glass n=1.5) giving a per-depth deflection
//   • displacement along the OUTWARD normal → a magnifying rim
// It samples the (already-blurred) backdrop and shifts edge pixels, leaving
// the center flat. Bundle it as a Flutter shader asset (see pubspec in the
// README) and drive it from LiquidGlassRefractive in liquid_glass.dart.

#version 460 core
#include <flutter/runtime_effect.glsl>

precision highp float;

uniform vec2  uSize;     // element size in px
uniform float uRadius;   // corner radius (px)
uniform float uBezel;    // refracting edge band width (px)
uniform float uScale;    // max displacement (px)  == "refraction"
uniform sampler2D uBackdrop; // the (blurred) content behind the glass

out vec4 fragColor;

const float N = 1.0 / 1.5;         // air → glass
const float PI = 3.14159265;

// Signed distance to a rounded rectangle centred in uSize. <0 inside.
float sdRoundRect(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Convex squircle height across the bezel, x in [0,1] (outer → inner).
float squircle(float x) {
    x = clamp(x, 0.0, 1.0);
    return pow(1.0 - pow(1.0 - x, 4.0), 0.25);
}

// Refraction deflection magnitude at normalized depth t (Snell on the slope).
float profile(float t) {
    float e = 0.001;
    float slope = (squircle(t + e) - squircle(t - e)) / (2.0 * e);
    float th1 = atan(slope);
    float th2 = asin(clamp(N * sin(th1), -1.0, 1.0));
    return tan(th1 - th2);
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    vec2 center = uSize * 0.5;
    vec2 p = fragCoord - center;
    vec2 halfSize = center;

    float dist  = sdRoundRect(p, halfSize, uRadius);  // <0 inside
    float depth = -dist;

    vec2 uv = fragCoord / uSize;
    vec2 disp = vec2(0.0);

    if (dist < 0.0 && depth < uBezel) {
        float t = depth / uBezel;

        // normalize the profile against its own max (matches the JS engine)
        float maxMag = 0.0;
        for (int i = 0; i <= 16; i++) {
            maxMag = max(maxMag, profile(float(i) / 16.0));
        }
        float mag = (maxMag > 0.0) ? profile(t) / maxMag : 0.0;

        // outward normal = gradient of the SDF (finite differences)
        float e = 1.0;
        float gx = sdRoundRect(p + vec2(e, 0.0), halfSize, uRadius)
                 - sdRoundRect(p - vec2(e, 0.0), halfSize, uRadius);
        float gy = sdRoundRect(p + vec2(0.0, e), halfSize, uRadius)
                 - sdRoundRect(p - vec2(0.0, e), halfSize, uRadius);
        vec2 n = normalize(vec2(gx, gy) + 1e-6);

        disp = n * mag * uScale;      // push outward → magnifying lens
    }

    // sample the backdrop shifted by the displacement (in uv space)
    vec2 sampleUV = clamp(uv + disp / uSize, 0.0, 1.0);
    vec4 col = texture(uBackdrop, sampleUV);

    // a faint specular rim right at the edge for extra "glass"
    float rim = smoothstep(uBezel, 0.0, depth) * step(0.0, -dist);
    col.rgb += rim * 0.12;

    fragColor = col;
}
