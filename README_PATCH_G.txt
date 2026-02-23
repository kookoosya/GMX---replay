PATCH G — Fix Vite crash (invalid proxy regex)

What was happening:
- Patch F used a regex-style proxy context (strings starting with '^').
- On Windows/Node, backslashes in that string were not preserved as intended, producing an invalid RegExp.
- Vite crashed with: "Invalid regular expression ... Nothing to repeat"

What this patch does:
- Replaces regex contexts with ONLY string-prefix proxy rules.
- Proxies /app plus the known legacy root files (/app.js, /app.css, /mode.js, /themes.json, etc.)
- Proxies /assets/** so legacy UI loads fully inside the iframe on http://localhost:5173

How to apply:
- Stop dev (Ctrl+C)
- Expand-Archive this zip into Backend/ with -Force
- Run:
    Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
    npm run dev

Verify:
- http://localhost:5173 should show the full legacy UI inside the iframe and everything should be clickable.
