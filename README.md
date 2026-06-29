# Lorenz Attractor Demo

> In script and spark the bright web learns,
> JavaScript: a trickster with a velvet pull;
> we curse its knots, then follow where it turns,
> and hear tomorrow singing through the wires.

A small static site with a Scala-doc-inspired layout and an animated Lorenz attractor, configured for Cloudflare Workers.

## Project files

- `public/index.html` — page structure and styling
- `public/lorenz.js` — Lorenz system simulation and canvas rendering
- `worker.js` — minimal Cloudflare Worker that serves static assets
- `wrangler.toml` — Cloudflare Workers configuration
- `package.json` — local scripts for dev, config checking, and deployment

## Run locally

Run commands from the project root (`web/`).

### Simple static preview

```sh
python3 -m http.server 8000 --directory public
```

Then open <http://localhost:8000>.

### Cloudflare Workers preview

```sh
npm install
npm run dev
```

Wrangler will print a local preview URL, typically <http://127.0.0.1:8787>.

## Deploy to Cloudflare Workers

Before deploying, make sure `public/` is committed to git. Cloudflare's remote build only sees files present in the repository snapshot it checks out.

1. Authenticate Wrangler if needed:

```sh
npx wrangler login
```

2. Optionally validate the config and bundle before deployment:

```sh
npm run check
```

3. Deploy:

```sh
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

