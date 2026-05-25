---
title: "Horizontal Scroll as Narrative Device"
date: "2026-04-10"
tags: ["design"]
excerpt: "Why horizontal scrolling changes how users experience content."
---

# Horizontal Scroll as Narrative Device

Vertical scroll is the default. It's how we read — top to bottom, left to right. But horizontal scroll changes the **relationship** between the user and content.

## Time as Space

Horizontal movement naturally maps to time. Left = past, right = future. This makes horizontal scroll perfect for:

- **Timelines** — history, progress, evolution
- **Stories** — chapter by chapter, panel by panel
- **Portfolios** — a journey through work

## The Snap Effect

When you add scroll-snap to horizontal navigation, each section becomes a **frame**. Not a page, not a screen — a deliberate moment. The user doesn't scroll *through* content, they move *between* scenes.

## Implementation Gotchas

The biggest challenge is fighting the browser's native scroll behavior. CSS `scroll-snap-type` and JavaScript `scrollLeft` assignment create a tug-of-war. The solution:

1. Remove CSS scroll-snap entirely
2. Use requestAnimationFrame for smooth interpolation
3. Add delayed snap only after scrolling stops
4. Convert wheel delta to horizontal movement

## The Result

A site that feels like flipping through a book, not scrolling through a feed. Each panel is a full-screen experience. Navigation is intentional, not accidental.
