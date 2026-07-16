# GMXReply Design System

## Direction

**Signal Room**: a dark, precise writing product with an editorial landing page and a quiet app shell. The landing should feel like a private control room for short GM/GN replies: near-black ink, warm porcelain text, electric violet structure, lime action states, hairline rules, and premium imagery used as atmosphere rather than decoration.

The landing page has one job: explain the copy-first loop in seconds and move a visitor into the app. The signature is the asymmetric hero with a status strip that states what the product actually controls: GM/GN, copy + paste, the user's choice, and web + extension.

## Product rules

- GMXReply is copy-first: generate, copy, paste manually on X.
- Generation, saved banks, entitlement, and extension sync are product logic. Visual work must not alter those contracts.
- Theme and wallpaper cards show a title and state only. No long descriptions, stock-photo captions, or filler notes.
- Site wallpapers and extension skins are separate catalogs with explicit IDs and manifests.
- Production assets live under the active public asset paths. Review renders, contact sheets, prompts, and rejected candidates stay outside production catalogs.

## Visual tokens

Landing tokens:

```css
:root {
  --night: #090a0f;
  --panel: #11131b;
  --ink: #f4f1e9;
  --muted: #9c9da9;
  --line: rgba(244, 241, 233, 0.14);
  --violet: #9a70ff;
  --lime: #c9ff68;
  --coral: #ff8369;
}
```

The app shell keeps its own graphite/cyan token layer so the functional workspace remains restrained while the landing carries the stronger point of view.

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
