# @liquidlens/core

The zero-dependency web engine for Apple-style **Liquid Glass** with genuine edge refraction. This is the source of truth every other LiquidLens package mirrors.

## Install

```bash
npm install @liquidlens/core
```

Or use it with no toolchain at all — copy the three files and add a `<script>` tag.

## Use

```html
<link rel="stylesheet" href="node_modules/@liquidlens/core/tokens.css">
<link rel="stylesheet" href="node_modules/@liquidlens/core/liquid-glass.css">

<div class="lg-glass" data-glass style="--lg-radius:28px; padding:24px;">Hello, glass.</div>

<script src="node_modules/@liquidlens/core/liquid-glass.js"></script>
<script>LiquidGlass.init({ refraction: 18, bezel: 22, blur: 3 });</script>
```

Bundlers: `import LiquidGlass from '@liquidlens/core'` (UMD; also registers `window.LiquidGlass`), plus `import '@liquidlens/core/liquid-glass.css'` and `tokens.css`.

Full API: [`../../docs/10-api-reference.md`](../../docs/10-api-reference.md) · How it works: [`../../docs/02-optics-and-physics.md`](../../docs/02-optics-and-physics.md)

**Refraction requires a Chromium engine** (Chrome/Edge/Arc/Brave/Opera); Safari and Firefox fall back automatically to blur + specular. See [`../../docs/07-browser-support.md`](../../docs/07-browser-support.md).
