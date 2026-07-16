# GMXReply Design System

## Direction

**Midnight Signal Desk**: a premium crypto writing console with the visual density of a private trading desk and the clarity of an editorial tool. The app is not a generic glass dashboard: it uses a framed navigation rail, a deliberate masthead, a high-contrast command hero, and a small number of strong visual anchors. The product's own material language is signal routing, copy buffers, GM/GN modes, and a copy-first safety boundary.

The primary app job is immediate orientation: choose GM or GN, generate a human line, copy it, and paste it manually on X. The signature is a split hero that pairs the real copy-first promise with a live-looking but truthful signal console: GM/GN mode, copy-only, no auto-post, and the current session state. No fake activity, testimonials, trading metrics, or invented social proof.

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
  --night: #07090d;
  --panel: #10151d;
  --panel-raised: #161d27;
  --ink: #f5f7f4;
  --muted: #99a5af;
  --line: rgba(215, 230, 239, 0.14);
  --cobalt: #4a7dff;
  --mint: #a7f56a;
  --violet: #9f79ff;
  --signal: #55d6d0;
  --coral: #ff8c71;
}
```

The app shell keeps its own graphite/cyan token layer so the functional workspace remains restrained while the landing carries the stronger point of view.

## Typography

- Display: `Arial Narrow`, `Roboto Condensed`, `Bahnschrift`, or the platform fallback; use the narrow face for the brand, hero title, and rail section labels.
- Body: `Segoe UI Variable`, `Inter`, or a readable system sans with 15–16px body text and 1.5 line-height.
- Utility: a compact system mono stack for state labels and IDs only.
- Do not use all-caps paragraphs, equal-weight headings, or tiny low-contrast notes as primary content.

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

## App-shell redesign contract

- Desktop matrix: 1440×900 and 1600×900 must show a stable rail, a two-zone masthead, and a hero with no dead black half-panel.
- Tablet matrix: 1024×768 and 768×1024 collapse the rail into a compact navigation band without horizontal overflow.
- Mobile matrix: 390×844 and 320×740 keep the primary GM/GN actions visible, use the existing mobile navigation, and never rely on hover to reveal meaning.
- States: default, hover, focus-visible, active, disabled, loading, empty, error, success, offline, and reduced-motion are explicit. Color is never the only state cue.
- Performance: no new external font, image, or animation dependency for the shell. Hero art remains an existing tracked asset; full wallpaper assets stay lazy.
- Anti-slop audit: remove generic nested glass cards, arbitrary gradients, fake KPI numbers, excessive rounded pills, and decorative text that does not explain a real control.

## Current cleanup target

The catalog pass removes `note`/description rendering and replaces long wallpaper captions with short, unique titles. The app-shell pass now replaces the old generic top-tabs composition with the Midnight Signal Desk layout while preserving the existing product contracts. The active runtime catalogs remain 100 site wallpapers and 60 extension skins until a separately verified premium art pack replaces them.
