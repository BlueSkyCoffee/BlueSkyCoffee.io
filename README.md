# BlueSkyCoffee — 1bit Blog

A minimal, black-and-white personal blog with horizontal scrolling, built with Astro.

## Features

- **1bit Aesthetic** — Pure black (#000) and white (#fff) only. No grayscale, no gradients.
- **Dithering Patterns** — CSS-generated checkerboard, dot matrix, diagonal lines, crosshatch, and noise textures.
- **Horizontal Scroll** — Mouse wheel maps to horizontal navigation. Arrow keys for keyboard control.
- **Animated Background** — Full-screen canvas with flickering pixel-block noise (CRT effect).
- **Matrix Rain Footer** — Falling 1bit characters with scanline overlay and glitch ASCII art.
- **Snake Game** — Footer easter egg, press START to play.
- **Content Collections** — Markdown posts with frontmatter, auto-indexed by Astro.
- **Reading View** — Slide-up overlay for full article reading.
- **Timeline** — About panel timeline, grouped by year, clickable to read posts.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 6 |
| Structure | Astro components (.astro) |
| Content | Astro Content Collections (Markdown) |
| Styling | CSS3 (Variables, Grid, Flexbox, dither patterns) |
| Interaction | TypeScript modules (client-side) |
| Fonts | Google Fonts — Silkscreen, Space Mono |
| Deployment | GitHub Pages (static, Astro build) |

## File Structure

```
BlueSkyCoffee/
├── src/
│   ├── components/     # Panel components (Hero, About, Posts, Contact, Footer)
│   ├── layouts/        # BaseLayout with global CSS + fonts
│   ├── pages/          # index.astro (single-page)
│   ├── scripts/        # TypeScript modules (scroll, dither, game, timeline, posts)
│   ├── styles/         # global.css (all 1bit styles)
│   └── content/posts/  # Markdown blog posts
├── public/             # Static assets (.nojekyll)
├── astro.config.mjs    # Astro configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Build

```bash
npm run build
```

Output: `dist/`

## Deploy to GitHub Pages

Push to `main` branch. GitHub Actions builds and deploys automatically.

Or manually:

```bash
npm run build
# dist/ is ready to serve
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| `←` / `→` | Navigate panels |
| `Escape` | Close reading view or timeline |
| Arrow keys | Snake game (when active) |

## License

MIT
