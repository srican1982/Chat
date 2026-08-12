# Deploying Vault Chat (backend‑less / static)

This app is **100% front‑end**. There is no server to run. The browser talks to OpenRouter
directly using **each user's own OpenRouter API key**, which is stored only in that browser's
`localStorage`. All chats and images also stay in the browser. Nothing is stored on any server.

You can host it on any static host: **Hostinger `public_html`**, Netlify, Vercel, GitHub Pages, S3, etc.

---

## 1. Get the code
Push to GitHub from Emergent (Save to GitHub), then on your computer:
```bash
git clone https://github.com/<you>/<repo>.git
cd <repo>/frontend
```

## 2. Build the static site
Requires Node.js 18+.
```bash
yarn install        # or: npm install
yarn build          # or: npm run build
```
This creates a **`frontend/build/`** folder containing `index.html`, a `static/` folder, and
`.htaccess`.

> Note: `REACT_APP_BACKEND_URL` is **not needed** — the app calls OpenRouter directly.
> You can ignore/remove the `backend/` folder entirely; it is not used.

## 3. Upload to Hostinger (public_html)
1. Open Hostinger → **File Manager** (or use FTP).
2. Go into **`public_html`**.
3. Upload the **contents of `frontend/build/`** (not the folder itself) — i.e. `index.html`,
   the `static/` folder, `.htaccess`, `favicon.ico`, etc. — directly into `public_html`.
4. Make sure the included **`.htaccess`** is uploaded (it makes the single‑page app load
   correctly). If you don't see it, enable "show hidden files" in File Manager.

## 4. Open your domain
Visit your site. On first use it asks for an **OpenRouter API key** (get one at
https://openrouter.ai/keys). It's saved on that device and reused automatically.

**Security tip:** on OpenRouter, set a **monthly spend limit** on your key so it can never be
over‑used, and use a dedicated key per device if you like.

---

## Hosting elsewhere (optional)
- **Netlify / Vercel:** connect the GitHub repo, set build command `yarn build`, publish
  directory `frontend/build`. (Add a redirect rule `/* -> /index.html` — Netlify: a `_redirects`
  file; Vercel handles SPAs automatically.)
- **GitHub Pages:** push the contents of `frontend/build/` to a `gh-pages` branch.

## Notes
- Static hosting means **no MongoDB, no Python, no env vars** to configure.
- OpenRouter allows browser (CORS) requests, so the direct call works from any origin.
- Provider is pinned to Google Vertex AI with `allow_fallbacks:false`, `data_collection:"deny"`,
  `zdr:true`, temperature `0.9` — set client‑side in `src/lib/openrouter.js`.
