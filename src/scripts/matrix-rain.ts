// Footer matrix rain — falling characters canvas animation.

let fc: HTMLCanvasElement | null = null;
let fctx: CanvasRenderingContext2D | null = null;
const CHARS = '01░▒▓█▀▄■□▪▫';
const FS = 12;
let cols = 0;
let drops: number[] = [];

function resizeFooter(): void {
  if (!fc) return;
  const rect = fc.parentElement?.getBoundingClientRect();
  if (!rect) return;
  fc.width = rect.width;
  fc.height = rect.height;
  cols = Math.floor(fc.width / FS);
  drops = [];
  for (let i = 0; i < cols; i++) drops[i] = Math.random() * -100;
}

function drawFooter(): void {
  if (!fctx || !fc) return;
  fctx.fillStyle = 'rgba(0,0,0,0.08)';
  fctx.fillRect(0, 0, fc.width, fc.height);
  fctx.fillStyle = '#fff';
  fctx.font = FS + 'px monospace';
  for (let i = 0; i < drops.length; i++) {
    fctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FS, drops[i] * FS);
    if (drops[i] * FS > fc.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
  requestAnimationFrame(drawFooter);
}

export function initMatrixRain(): void {
  const footerCanvasEl = document.getElementById('footerCanvas');
  if (!footerCanvasEl) return;

  fc = document.createElement('canvas');
  footerCanvasEl.appendChild(fc);
  fctx = fc.getContext('2d');
  if (!fctx) return;

  window.addEventListener('resize', resizeFooter);
  setTimeout(() => { resizeFooter(); drawFooter(); }, 200);
}
