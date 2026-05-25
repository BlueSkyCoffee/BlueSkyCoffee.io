// Footer snake game — 1bit easter egg with canvas rendering.

interface Pos { x: number; y: number }
interface Dir { x: number; y: number }

type GameState = 'idle' | 'playing' | 'over';

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const W = 320;
const H = 240;
const GRID = 16;
const COLS = W / GRID;
const ROWS = H / GRID;

let snake: Pos[] = [];
let dir: Dir = { x: 1, y: 0 };
let nextDir: Dir = { x: 1, y: 0 };
let food: Pos = { x: 0, y: 0 };
let score = 0;
let gameLoop: ReturnType<typeof setInterval> | null = null;
let state: GameState = 'idle';

let promptEl: HTMLElement | null = null;
let hudEl: HTMLElement | null = null;
let scoreEl: HTMLElement | null = null;
let overScreenEl: HTMLElement | null = null;
let overScoreEl: HTMLElement | null = null;
let startBtn: HTMLElement | null = null;
let quitBtn: HTMLElement | null = null;
let restartBtn: HTMLElement | null = null;

function placeFood(): void {
  const occupied = new Set<string>();
  snake.forEach((s) => occupied.add(s.x + ',' + s.y));
  const candidates: Pos[] = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!occupied.has(x + ',' + y)) candidates.push({ x, y });
    }
  }
  if (candidates.length === 0) { gameOver(); return; }
  food = candidates[Math.floor(Math.random() * candidates.length)];
}

function draw(): void {
  if (!ctx) return;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  for (let x = 0; x <= COLS; x++) {
    for (let y = 0; y <= ROWS; y++) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * GRID, y * GRID, 1, 1);
      }
    }
  }

  ctx.fillStyle = '#fff';
  snake.forEach((s, i) => {
    const gap = i === 0 ? 0 : 1;
    ctx.fillRect(s.x * GRID + gap, s.y * GRID + gap, GRID - gap * 2, GRID - gap * 2);
  });

  const blink = Math.floor(Date.now() / 300) % 2;
  if (blink) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(food.x * GRID, food.y * GRID, GRID, GRID);
  } else {
    for (let fx = 0; fx < GRID; fx += 4) {
      for (let fy = 0; fy < GRID; fy += 4) {
        if ((fx + fy) % 8 === 0) {
          ctx.fillRect(food.x * GRID + fx, food.y * GRID + fy, 2, 2);
        }
      }
    }
  }

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, W, H);
}

function update(): void {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { gameOver(); return; }

  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) { gameOver(); return; }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    if (scoreEl) scoreEl.textContent = String(score);
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function gameOver(): void {
  state = 'over';
  if (gameLoop) clearInterval(gameLoop);
  if (overScoreEl) overScoreEl.textContent = String(score);
  if (overScreenEl) overScreenEl.style.display = 'flex';

  if (ctx) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    setTimeout(() => draw(), 150);
  }
}

function initGame(): void {
  snake = [
    { x: 10, y: 7 },
    { x: 9, y: 7 },
    { x: 8, y: 7 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  placeFood();
  if (scoreEl) scoreEl.textContent = '0';
}

function startGame(): void {
  initGame();
  state = 'playing';
  if (promptEl) promptEl.style.display = 'none';
  if (overScreenEl) overScreenEl.style.display = 'none';
  if (hudEl) hudEl.style.display = 'flex';
  draw();
  gameLoop = setInterval(update, 120);
}

function quitGame(): void {
  state = 'idle';
  if (gameLoop) clearInterval(gameLoop);
  if (promptEl) promptEl.style.display = 'flex';
  if (hudEl) hudEl.style.display = 'none';
  if (overScreenEl) overScreenEl.style.display = 'none';

  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, H);
  }
}

function handleGameKey(e: KeyboardEvent): void {
  if (state !== 'playing') return;
  const key = e.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (key === 'ArrowUp' && dir.y !== 1) nextDir = { x: 0, y: -1 };
  else if (key === 'ArrowDown' && dir.y !== -1) nextDir = { x: 0, y: 1 };
  else if (key === 'ArrowLeft' && dir.x !== 1) nextDir = { x: -1, y: 0 };
  else if (key === 'ArrowRight' && dir.x !== -1) nextDir = { x: 1, y: 0 };
}

export function initSnakeGame(): void {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  promptEl = document.getElementById('gamePrompt');
  hudEl = document.getElementById('gameHud');
  scoreEl = document.getElementById('gameScore');
  overScreenEl = document.getElementById('gameOverScreen');
  overScoreEl = document.getElementById('gameOverScore');
  startBtn = document.getElementById('gameStartBtn');
  quitBtn = document.getElementById('gameQuitBtn');
  restartBtn = document.getElementById('gameRestartBtn');

  document.addEventListener('keydown', handleGameKey, true);

  if (startBtn) startBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); startGame(); });
  if (quitBtn) quitBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); quitGame(); });
  if (restartBtn) restartBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); startGame(); });

  (window as Record<string, unknown>).isGameActive = () => state === 'playing';

  quitGame();
}
