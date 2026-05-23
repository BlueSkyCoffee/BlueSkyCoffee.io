# BlueSkyCoffee — 1bit Blog

A minimal, black-and-white personal blog with horizontal scrolling, built in pure HTML/CSS/JS.

## Features

- **1bit Aesthetic** — Pure black (#000) and white (#fff) only. No grayscale, no gradients.
- **Dithering Patterns** — CSS-generated checkerboard, dot matrix, diagonal lines, crosshatch, and noise textures.
- **Horizontal Scroll** — Mouse wheel maps to horizontal navigation. Arrow keys for keyboard control.
- **Animated Background** — Full-screen canvas with flickering pixel-block noise (CRT effect).
- **Matrix Rain Footer** — Falling 1bit characters (`01░▒▓█▀▄■□▪▫`) with scanline overlay and glitch ASCII art.
- **Typewriter Effect** — Terminal-style text reveal animation on the hero section.
- **Zero Dependencies** — No frameworks, no build step, no external JS libraries.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | CSS3 (Variables, Grid, Flexbox, `scroll-snap`, `repeating-conic-gradient`, `repeating-linear-gradient`) |
| Interaction | Vanilla JS (IIFE) |
| Fonts | Google Fonts — `Silkscreen` (pixel display), `Space Mono` (monospace body) |
| Deployment | GitHub Pages (static) |

## File Structure

```
BlueSkyCoffee/
├── index.html    # Main page — sections, terminal UI, navigation
├── styles.css    # 1bit styles, dithering patterns, animations, responsive
├── script.js     # Typewriter, horizontal scroll, nav sync, canvas animations
└── README.md     # This file
```

## Local Development

```bash
# Start a local server
python3 -m http.server 8080

# Or with Node.js
npx serve .
```

Then open `http://localhost:8080`.

## Deploy to GitHub Pages

```bash
# Using gh-pages
npx gh-pages -d .

# Or push to main and enable Pages in repo Settings
git push origin main
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| `←` / `→` | Navigate sections |
| `Scroll` | Horizontal scroll (wheel maps to horizontal) |

## License

MIT
