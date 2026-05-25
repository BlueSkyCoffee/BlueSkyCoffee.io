---
title: "CSS Dithering Patterns: A Deep Dive"
date: "2026-04-22"
tags: ["css"]
excerpt: "How to create texture with only two colors."
---

# CSS Dithering Patterns: A Deep Dive

When you only have two colors — pure black and pure white — you need to get creative. Dithering is the oldest trick in the graphics book: simulate shades by alternating pixels of available colors.

## Checkerboard

The simplest pattern. Alternate black and white squares:

```css
.checkerboard {
  background-image: repeating-conic-gradient(
    #000 0% 25%, #fff 0% 50%
  );
  background-size: 8px 8px;
}
```

## Dot Matrix

Simulate gray with a grid of dots. The smaller the dots, the lighter the perceived gray.

```css
.dots {
  background-image: radial-gradient(circle, #fff 1px, transparent 1px);
  background-size: 4px 4px;
}
```

## Diagonal Lines

Diagonal hatching creates a directional texture that feels more dynamic than dots.

```css
.diagonal {
  background-image: repeating-linear-gradient(
    45deg,
    #000,
    #000 1px,
    #fff 1px,
    #fff 3px
  );
}
```

## Why It Matters

In a 1bit world, dithering isn't decoration — it's **information hierarchy**. Dense patterns feel heavy, sparse patterns feel light. You can build an entire visual language from just two colors and geometry.

The best part? Zero bandwidth. These patterns are pure CSS. No images, no SVGs, no external assets. Just math.
