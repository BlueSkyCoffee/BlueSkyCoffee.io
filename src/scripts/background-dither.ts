// 1bit background dither animation — canvas-based pixel noise.

let bgCanvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const CELL = 6;
let cols = 0;
let rows = 0;
let grid: Uint8Array | null = null;

function resize(): void {
  if (!bgCanvas) return;
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  cols = Math.ceil(bgCanvas.width / CELL);
  rows = Math.ceil(bgCanvas.height / CELL);
  grid = new Uint8Array(cols * rows);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() > 0.5 ? 1 : 0;
  }
}

function draw(): void {
  if (!grid || !ctx || !bgCanvas) return;
  const flips = Math.floor(grid.length * 0.003);
  for (let i = 0; i < flips; i++) {
    const idx = Math.floor(Math.random() * grid.length);
    grid[idx] = grid[idx] === 1 ? 0 : 1;
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  ctx.fillStyle = '#fff';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y * cols + x]) {
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }
  requestAnimationFrame(draw);
}

export function initBackgroundDither(): void {
  bgCanvas = document.getElementById('bgDither') as HTMLCanvasElement | null;
  if (!bgCanvas) return;

  ctx = bgCanvas.getContext('2d');
  if (!ctx) return;

  window.addEventListener('resize', resize);
  resize();
  draw();
}
