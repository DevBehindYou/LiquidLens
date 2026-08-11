# 07 · Browser support, fallbacks & performance

## Support matrix (as of 2025–2026)

| Feature | Chromium (Chrome/Edge/Arc/Brave/Opera) | Safari (WebKit) | Firefox (Gecko) |
|---|:---:|:---:|:---:|
| `backdrop-filter: blur() saturate()` | ✅ | ✅ | ✅ |
| SVG `<filter>` used as a **`backdrop-filter`** (the refraction) | ✅ | ❌ | ❌ |
| SVG `<filter>` as a normal `filter:` (on the element's own pixels) | ✅ | ✅ | ✅ |
| `mask-composite` (specular rim) | ✅ | ✅ (`-webkit-`) | ✅ |
| `mix-blend-mode: screen` (moving highlight) | ✅ | ✅ | ✅ |

**Bottom line:** genuine backdrop **refraction is Chromium-only** on the web today. Everything else — blur, tint, specular rim, moving highlight, shadow, morph — works everywhere. Native Apple platforms render true refraction universally; this is purely a web-engine gap, not a limitation of the material itself.

## How the fallback works (automatic)

When a browser doesn't support an SVG filter as a `backdrop-filter`, it simply **ignores the `url(#…)`** token and keeps the rest of the chain:

```
blur(3px) saturate(1.8) url(#f)   →   effectively   blur(3px) saturate(1.8)
```

So on Safari and Firefox you still get a clean frosted-glass card with a rim highlight, moving glint, and shadow — it just lacks the edge lensing. No branching is required. If you want to compensate, you can feature-detect and boost blur where refraction is absent:

```js
// Heuristic: SVG-as-backdrop support is Chromium-ish. Bump blur where refraction is missing.
const noRefraction =
  !/Chrome|Chromium|Edg|OPR/.test(navigator.userAgent) || /Firefox/.test(navigator.userAgent);
if (noRefraction) LiquidGlass.set({ blur: 8 });
```

Always ship an **opaque** fallback for accessibility as well — `liquid-glass.css` already provides one under `@media (prefers-reduced-transparency: reduce)`, and the engine skips map generation entirely in that mode. See **[09 · Accessibility](09-accessibility.md)**.

## Performance model

**Map generation** is CPU work, **O(width × height)** per element, capped by the `quality` parameter (default max dimension 360px — the engine scales the canvas down when either side exceeds it). Guidelines:

- Generate on **create** and on **resize** — never per animation frame.
- To animate lens strength, animate the filter **`scale`** (cheap) rather than rebuilding the map.
- To move or resize a pane smoothly, animate `transform` and rebuild the map only once it settles.

**Compositing** — each `backdrop-filter` element is its own GPU layer that samples the scene behind it, and those costs add up:

- Prefer a **few larger** glass panes over **many tiny** ones.
- Avoid deep **glass-on-glass** stacks (also a design anti-pattern — see **[05 · UI/UX Guidelines](05-ui-ux-guidelines.md)**).
- On low-end or mobile hardware, consider reducing `quality`, lowering `refraction`, or disabling refraction entirely and leaning on the blur fallback.

**Memory** — data-URL maps are small (a 360×360 RGBA PNG is tens of KB). There is one per distinct element size, and the library holds all `<filter>` nodes inside a single hidden `<svg>` root, which it removes on `destroy()`.

**What's cheap vs expensive to animate:**

| Cheap (animate freely) | Expensive (forces a map rebuild) |
|---|---|
| `transform`, `opacity` | `width`, `height` |
| The `--lg-*` highlight vars | `border-radius` |
| `feDisplacementMap` `scale` | `bezel` |

## Testing checklist

- [ ] **Chromium:** confirm the edge actually *bends* the backdrop (not just blurs). Drag a pane over text or a photo and watch the rim magnify it.
- [ ] **Safari + Firefox:** confirm the fallback looks good — no missing or broken element.
- [ ] Light **and** dark backgrounds.
- [ ] Busy (photo / text) **and** plain backgrounds — check legibility.
- [ ] `prefers-reduced-transparency: reduce` → opaque surface, no GPU work.
- [ ] `prefers-reduced-motion: reduce` → highlight and morph animation frozen.
- [ ] `prefers-contrast: more` → crisp inner border appears.
- [ ] Resize the window → maps regenerate with no stretching artifacts.
- [ ] Many elements → acceptable frame rate on your target hardware.

## Sources

- MDN — `backdrop-filter` (support notes): https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- Can I use — `backdrop-filter`: https://caniuse.com/css-backdrop-filter
- kube.io — notes Chromium-only SVG backdrop filters: https://kube.io/blog/liquid-glass-css-svg/
- MDN — `<feDisplacementMap>`: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap
