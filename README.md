# Lorenz Attractor Demo

A small static website styled with a Scala-documentation-inspired layout and an animated Lorenz attractor, now set up for deployment on Cloudflare Workers.

## Files

- `public/index.html` — page structure and styling
- `public/lorenz.js` — Lorenz system simulation and canvas rendering
- `worker.js` — minimal Cloudflare Worker that serves static assets
- `wrangler.toml` — Cloudflare Workers configuration
- `package.json` — local scripts for dev, config checking, and deployment

## Run locally

### Simple static preview

```sh
cd /Users/jrule/git/web
python3 -m http.server 8000 --directory public
```

Then open <http://localhost:8000>.

### Cloudflare Workers preview

```sh
cd /Users/jrule/git/web
npm install
npm run dev
```

Wrangler will print a local preview URL, typically <http://127.0.0.1:8787>.

## Deploy to Cloudflare Workers

Before deploying, make sure the `public/` directory is committed to git. Cloudflare's remote build only sees files that are in the repo snapshot it checks out.

1. Authenticate Wrangler if needed:

```sh
cd /Users/jrule/git/web
npx wrangler login
```

2. Optionally validate the config and bundle before deployment:

```sh
cd /Users/jrule/git/web
npm run check
```

3. Deploy:

```sh
cd /Users/jrule/git/web
npm run deploy
```

If you are deploying from a Git-connected Cloudflare project, also make sure the project root is the repository root that contains `wrangler.toml`, `worker.js`, and `public/`.

## Notes

- The Worker serves everything from the `public/` directory via the `ASSETS` binding.
- The canvas is responsive and supports high-DPI displays.
- If the device requests reduced motion, the page renders a still frame instead of a continuous animation.
- Styling is embedded in `public/index.html` to keep the site portable and simple.
- The project is pinned to `wrangler` 3.x so it can be validated locally on Node 18 in this workspace.
- `npm run verify:cloudflare` checks that the required deploy files exist before a dry run or real deploy.

