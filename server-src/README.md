# Server source (`server-src/`)

`index.js` is **built** from these parts. Edit `server-src/*.js`, not `index.js` directly.

```bash
npm run build:server
node --check index.js
```

Re-split from monolith (rare):

```bash
node tools/split-server.mjs
```
