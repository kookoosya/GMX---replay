# GMXReply Design System

## Direction

**Cinematic Technical Editorial**: a dark, precise workspace for writing short GM/GN replies. The product should feel like a private terminal with editorial restraint: deep graphite surfaces, porcelain text, one controlled electric-cyan accent, and premium imagery used as atmosphere rather than decoration.

## Product rules

- GMXReply is copy-first: generate, copy, paste manually on X.
- Generation, saved banks, entitlement, and extension sync are product logic. Visual work must not alter those contracts.
- Theme and wallpaper cards show a title and state only. No long descriptions, stock-photo captions, or filler notes.
- Site wallpapers and extension skins are separate catalogs with explicit IDs and manifests.
- Production assets live under the active public asset paths. Review renders, contact sheets, prompts, and rejected candidates stay outside production catalogs.

## Visual tokens

```css
:root {
  --gmx-bg: #080b12;
  --gmx-surface: #101621;
  --gmx-surface-raised: #151d2a;
  --gmx-ink: #f3f6fb;
  --gmx-muted: #99a5b7;
  --gmx-line: rgba(214, 225, 240, 0.14);
  --gmx-accent: #63d8ff;
  --gmx-accent-deep: #1d8fbd;
  --gmx-warm: #d6a56d;
  --gmx-radius-sm: 10px;
  --gmx-radius-md: 16px;
  --gmx-radius-lg: 24px;
}
```

## Typography

- Display: a deliberate condensed or sharp grotesk already available to the project; do not introduce a new font dependency for a cosmetic pass.
- Body: readable system sans with 16px minimum body text and 1.45–1.7 line-height.
- Labels: restrained uppercase or compact mono only for state, tier, and IDs.
- Avoid all-caps paragraphs, equal-weight headings, and long descriptions inside gallery cards.

## Gallery system

- Site: landscape-first cards with a stable focal-point crop and lazy thumbnails.
- Extension: portrait-first cards with a stable focal-point crop and lazy thumbnails.
- Card hierarchy: image, short title, entitlement state. No prose block.
- Use one signature interaction: quiet hover preview/prefetch, with reduced-motion support.
- Keep full-size images out of the initial grid load.

## Quality gate

Before a visual change is committed:

1. Verify the source catalog, generated public mirrors, and on-disk assets agree.
2. Run focused UI, wallpaper, extension, and generation tests.
3. Run the full test suite and strict audits.
4. Check desktop, narrow popup, keyboard focus, contrast, and reduced motion.
5. Review the diff and keep review artifacts out of production paths.

## Current cleanup target

The first visual pass removes `note`/description rendering and replaces long wallpaper captions with short, unique titles. The active runtime catalogs remain 100 site wallpapers and 60 extension skins until a separately verified premium art pack replaces them.
