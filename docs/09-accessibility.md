# 09 · Accessibility

Translucent materials are beautiful and, done carelessly, hostile. Liquid Glass can reduce contrast, add motion, and hide meaning behind visual effects. LiquidLens is built to degrade gracefully in every case below — but you still own the final result, so verify it.

## Reduced transparency

Some users enable **Reduce Transparency** system-wide precisely because see-through UI is hard for them to read. Honor it.

LiquidLens responds in **two** places:

1. **CSS** — under `@media (prefers-reduced-transparency: reduce)`, `.lg-glass` drops the backdrop filter entirely and becomes a solid, opaque surface (`rgba(28,28,36,.9)`) with a plain drop shadow; the `::before` and `::after` highlight layers are hidden, and `.lg-clear` becomes opaque too.
2. **JS** — `apply()` checks `prefers-reduced-transparency` first and **returns early**, so no displacement map is generated and **no GPU work happens at all**. You get an opaque panel *and* a lighter machine.

```css
@media (prefers-reduced-transparency: reduce) {
  .lg-glass {
    background: rgba(28, 28, 36, .9);
    backdrop-filter: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, .4);
  }
  .lg-glass::before, .lg-glass::after { display: none; }
}
```

## Reduced motion

The sliding specular highlight and the morph/press transitions are motion. Under **Reduce Motion**, LiquidLens freezes them:

```css
@media (prefers-reduced-motion: reduce) {
  .lg-glass, .lg-glass::after, .lg-interactive { transition: none; }
}
```

The pointer handler still updates the highlight position variables, but with transitions disabled there is no animated travel — the material stays calm. If you drive `tilt` on mobile, consider gating that behind the same query in your own code.

## Increased contrast

Under **Increase Contrast**, glass edges can get lost. LiquidLens adds a crisp definition border:

```css
@media (prefers-contrast: more) {
  .lg-glass { box-shadow: var(--lg-shadow-inner), var(--lg-shadow-drop), inset 0 0 0 1px rgba(255,255,255,.6); }
}
```

## WCAG contrast — measure the composited result

This is the trap that catches most implementations. Text contrast must be measured against **what is actually behind the text after compositing** — the blurred, tinted, refracted backdrop — **not** against the tint color alone. A blurred bright photo can push effective contrast below WCAG AA even though your tint token looks dark on paper.

Rules of thumb:

- Aim for **4.5:1** for body text and **3:1** for large text, on the *composited* pixels.
- Test over your **worst-case** backdrop (brightest, busiest) — not a convenient dark gradient.
- If you can't guarantee contrast, add a **scrim** (`.lg-scrim`) or use **Regular** rather than **Clear** (Regular is self-legible; Clear is not — see **[04 · Variants](04-variants-regular-clear.md)**).
- Keep `--lg-fg` high-contrast (the default is `#fff`) and avoid `--lg-fg-dim` for anything that must be read.

Verify with a real tool: browser DevTools contrast checkers sample the rendered pixels, which is exactly what you want here.

## Focus visibility

Focus rings must remain visible against a translucent, shifting surface. LiquidLens does not remove focus styles, and you should not either. If your design system uses a subtle ring, test it over the brightest backdrop the glass will sit on, and consider a high-contrast or double (light + dark) ring so it survives both light and dark backdrops.

## Don't encode meaning in the glass alone

The refraction, tint, and highlight are decoration and affordance — never the *only* signal. A tinted "primary" button must still carry a text label; a glass toggle must still expose its on/off state to assistive technology via proper semantics (`role`, `aria-pressed`, etc.). If you removed all the glass, the UI must still be fully understandable. Glass is the layer *above* meaning, not a substitute for it.

## Accessibility checklist

- [ ] Text meets WCAG AA on the **composited** result, tested over the worst-case backdrop.
- [ ] `prefers-reduced-transparency` → opaque surface (CSS) and no map generation (JS). Verified.
- [ ] `prefers-reduced-motion` → highlight and transitions frozen. Verified.
- [ ] `prefers-contrast: more` → definition border present.
- [ ] Focus rings visible over the brightest backdrop.
- [ ] All state and meaning available without relying on the glass effect.
- [ ] Clear variant only used with a scrim and bold/bright foreground.
