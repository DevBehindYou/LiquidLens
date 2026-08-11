---
name: liquid-glass-auditor
description: >
  Review/QA an existing "Liquid Glass" (iOS 26 glassmorphism) implementation on ANY platform (web,
  React, Flutter, SwiftUI) against a fidelity + accessibility + performance checklist, and report
  issues with concrete fixes. Fire on "review my liquid glass", "audit this glass UI", "why doesn't
  my glass look like Apple's", "is this real liquid glass", "check my glassmorphism".
---

# Liquid Glass — Auditor

A QA/review skill. Given a Liquid Glass implementation (code, screenshot, or live page, any
platform), audit it against the checklist below and report findings as a table plus a pass/fail
verdict. You are grading, not building — if asked to also fix, hand off to the matching platform
skill (`liquid-glass-web` / `-react` / `-flutter` / `-swiftui`).

## When to use

Trigger on: "review/audit my liquid glass", "is this actually Apple-style glass or just blur?", "why
does my glass look flat/muddy?", "check accessibility/performance of my glass UI". Works from code or
a screenshot; ask for the backdrop context if it is not provided (the effect can only be judged over
its real background).

## The one rule that matters

**Liquid Glass = glassmorphism + genuine edge refraction (lensing). Blur alone is a fail.** The
first and most important question in every audit: **does the rim actually bend/magnify the backdrop,
or is it just a frosted blur?** If there is no refraction (web: no SVG `feDisplacementMap` /
`backdrop-filter: url(#...)`; Flutter: bare `BackdropFilter` with no shader; RN: BlurView with no
Skia shader), that is an automatic **FAIL** on fidelity no matter how polished the rest is. (Native
SwiftUI `.glassEffect` always has real refraction — there the fidelity risk is misuse, below.)

## Checklist (audit every item)

**Fidelity**
1. **Real refraction, not just blur?** Rim visibly lenses the backdrop. Web: displacement map present
   and `backdrop-filter` includes `url(#...)`. Missing → FAIL.
2. **Blur ≤ 4?** High blur washes out the refraction. Over ~4px it stops reading as Liquid Glass.
3. **Rich backdrop present?** Glass over flat/solid color shows nothing — needs gradient/photo/content.
4. **Regular vs Clear chosen correctly?** Regular is the safe default (self-legible, anywhere). Clear
   only over bright media **with a dimming scrim and bold/bright foreground** — never over text or
   plain backgrounds.
5. **Tint subtle (≤ ~0.15 alpha)?** Heavier tint reads as a solid colored card, not glass.
6. **No glass-on-glass stacking?** Nested glass = muddy depth and slow. One glass layer over content.

**Accessibility**
7. **Legibility/contrast on the composited result** — text meets WCAG AA (4.5:1 body / 3:1 large)
   measured against the actual blurred+tinted+refracted backdrop over the **worst-case** (brightest,
   busiest) background, not against the tint color alone.
8. **Reduced transparency** → opaque fallback surface (and, on web, map generation skipped).
9. **Reduced motion** → specular/morph animation frozen.
10. **Focus visibility** — focus rings survive over the brightest backdrop; meaning never encoded in
    the glass alone.

**Performance**
11. **Few, large panes** rather than many small glass elements; displacement maps are size-capped.
12. **Animate transform/scale, not geometry** — resizing regenerates the displacement map; animating
    width/height/radius is expensive. Prefer `transform`/`scale`.

**Cross-platform**
13. **Fallback acknowledged?** Web refraction is Chromium-only; Safari/Firefox get blur+specular. RN
    needs Skia; Flutter needs the shader. The implementation should degrade gracefully and the author
    should know it is not refracting everywhere.

## Procedure

1. Identify the platform and locate the glass layer(s) in the code/screenshot.
2. Walk the checklist top to bottom. For each item decide pass/fail and note the evidence (the line,
   the value, the visual).
3. Rank findings by severity: **Critical** (no refraction; illegible text; no reduced-transparency
   fallback), **Major** (blur too high; Clear misused; glass-on-glass; missing scrim), **Minor**
   (tint slightly high; missing focus polish; perf nits).
4. Give each finding a concrete, copy-pasteable fix.
5. Output the findings table, then a one-line verdict.

## Output format

```
### Liquid Glass Audit — <platform>

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | Critical | Only `backdrop-filter: blur(12px)` — no refraction at all. | Add the LiquidLens engine (displacement map + `feDisplacementMap`) or the platform's shader; drop blur to 3. |
| 2 | Major    | Clear variant over a text list, no scrim — illegible. | Switch to Regular, or move over media and add `.lg-scrim`. |
| 3 | Minor    | Tint alpha 0.28 reads as a colored card. | Lower `tintOpacity` to ≤ 0.15. |

**Verdict: FAIL** — no genuine edge refraction (item 1). Blur alone is not Liquid Glass. Fix the
Critical item, then re-audit.
```

Verdict rule: **FAIL** if any Critical item fails (no refraction, illegible composited text, or no
reduced-transparency fallback). **PASS with notes** if only Major/Minor remain. **PASS** if the whole
checklist clears.

## Common mistakes the audit catches

- Frosted blur passed off as Liquid Glass (no lensing) — the top failure.
- Blur so high the refraction is invisible even when present.
- Contrast measured against the tint token instead of the composited backdrop.
- Clear variant everywhere / without scrim; heavy tint; glass-on-glass stacks.
- Missing reduced-transparency / reduced-motion fallbacks.
- Claiming refraction works in every browser when it is Chromium-only.

## References in this repo

- `../../docs/09-accessibility.md` — the a11y checklist and composited-contrast trap.
- `../../docs/04-variants-regular-clear.md` — Regular vs Clear decision table.
- `../../docs/05-ui-ux-guidelines.md` — navigation-layer usage, no glass-on-glass.
- `../../docs/07-browser-support.md` — Chromium-only refraction and fallbacks.
- `../../docs/02-optics-and-physics.md` — what "real refraction" means, to judge item 1.
- `../../docs/10-api-reference.md` — option ranges (blur ≤ 4, tint ≤ 0.4) to check values against.
- `../../packages/core/liquid-glass.{js,css}` — reference for how a correct web impl looks.
