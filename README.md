# Lorenz Attractor Demo

A very small static website styled with a Scala-documentation-inspired layout and an animated Lorenz attractor.

## Files

- `index.html` — page structure and styling
- `lorenz.js` — Lorenz system simulation and canvas rendering

## Run locally

You can open `index.html` directly in a browser, or serve the directory locally.

```sh
cd /Users/jrule/git/web
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Notes

- The canvas is responsive and supports high-DPI displays.
- If the device requests reduced motion, the page renders a still frame instead of a continuous animation.
- Styling is embedded in `index.html` to keep the site portable and simple.

