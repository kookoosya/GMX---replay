# Site app source (`site-src/`)

The production bundle `public/app.js` is **built** from these parts — do not edit `public/app.js` by hand.

```bash
# After editing any site-src/*.js:
npm run build:site

# Checks
npm test
npm run audit:logic
```

To re-split from a monolith (rare):

```bash
node tools/split-site-app.mjs
```
