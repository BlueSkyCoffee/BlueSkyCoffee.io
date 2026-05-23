/* ============================================================
   BlueSkyCoffee — 1bit Blog Script
   Typewriter, horizontal scroll, nav sync
   ============================================================ */

(function () {
  'use strict';

  // --- 1bit Background Dither Animation ---
  const canvas = document.getElementById('bgDither');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const CELL = 6; // pixel block size
    let cols, rows, grid;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / CELL);
      rows = Math.ceil(canvas.height / CELL);
      grid = new Uint8Array(cols * rows);
      // Initialize random
      for (let i = 0; i < grid.length; i++) {
        grid[i] = Math.random() > 0.5 ? 1 : 0;
      }
    }

    function draw() {
      // Randomly flip a small fraction of cells each frame
      const flipRate = 0.003; // 0.3% of cells change per frame
      const flips = Math.floor(grid.length * flipRate);
      for (let i = 0; i < flips; i++) {
        const idx = Math.floor(Math.random() * grid.length);
        grid[idx] = grid[idx] === 1 ? 0 : 1;
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // --- Footer Matrix Rain Animation ---
  const footerCanvas = document.getElementById('footerCanvas');
  if (footerCanvas) {
    const fCtx = document.createElement('canvas');
    footerCanvas.appendChild(fCtx);
    const ctx = fCtx.getContext('2d');

    const CHARS = '01░▒▓█▀▄■□▪▫';
    const FONT_SIZE = 12;
    let columns, drops;

    function resizeFooter() {
      const rect = footerCanvas.parentElement.getBoundingClientRect();
      fCtx.width = rect.width;
      fCtx.height = rect.height;
      columns = Math.floor(fCtx.width / FONT_SIZE);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
      }
    }

    function drawFooterMatrix() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, fCtx.width, fCtx.height);

      ctx.fillStyle = '#fff';
      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        // Bright head, dim trail
        if (Math.random() > 0.95) {
          ctx.fillStyle = '#fff';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        }

        ctx.fillText(char, x, y);

        if (y > fCtx.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      requestAnimationFrame(drawFooterMatrix);
    }

    window.addEventListener('resize', resizeFooter);
    setTimeout(() => {
      resizeFooter();
      drawFooterMatrix();
    }, 200);
  }

  // --- Date Display ---
  function updateDate() {
    const el = document.getElementById('currentDate');
    if (!el) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    el.textContent = `${y}.${m}.${d}`;
  }
  updateDate();

  // --- Typewriter Effect ---
  function typewrite(element, text, speed = 60) {
    return new Promise(resolve => {
      let i = 0;
      element.textContent = '';
      element.style.opacity = '1';
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  async function initTypewriters() {
    const elements = document.querySelectorAll('.typewriter[data-text]');
    for (const el of elements) {
      const text = el.getAttribute('data-text');
      const delay = parseInt(el.getAttribute('data-delay')) || 0;
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      await typewrite(el, text, 50);
      await new Promise(r => setTimeout(r, 200));
    }
  }

  setTimeout(initTypewriters, 500);

  // --- Horizontal Scroll via Wheel ---
  const mainScroll = document.getElementById('mainScroll');

  if (mainScroll) {
    mainScroll.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        mainScroll.scrollLeft += e.deltaY * 2.5;
      }
    }, { passive: false });
  }

  // --- Scroll Progress Bar ---
  const progressBar = document.getElementById('scrollProgressBar');

  function updateScrollProgress() {
    if (!mainScroll || !progressBar) return;
    const scrollLeft = mainScroll.scrollLeft;
    const maxScroll = mainScroll.scrollWidth - mainScroll.clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  }

  if (mainScroll) {
    mainScroll.addEventListener('scroll', updateScrollProgress);
  }

  // --- Nav Dot Sync ---
  const sections = document.querySelectorAll('.section[id]');
  const navDots = document.querySelectorAll('.nav-dot');

  function updateNavDots() {
    if (!mainScroll || sections.length === 0) return;
    const scrollPos = mainScroll.scrollLeft + mainScroll.clientWidth / 2;
    let activeIndex = 0;

    sections.forEach((section, i) => {
      const sectionLeft = section.offsetLeft;
      const sectionRight = sectionLeft + section.offsetWidth;
      if (scrollPos >= sectionLeft && scrollPos < sectionRight) {
        activeIndex = i;
      }
    });

    navDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  }

  if (mainScroll) {
    mainScroll.addEventListener('scroll', updateNavDots);
  }

  navDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = dot.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target && mainScroll) {
        mainScroll.scrollTo({
          left: target.offsetLeft,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Keyboard Navigation ---
  document.addEventListener('keydown', (e) => {
    if (!mainScroll) return;
    const sectionWidth = mainScroll.clientWidth;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      mainScroll.scrollBy({ left: sectionWidth, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      mainScroll.scrollBy({ left: -sectionWidth, behavior: 'smooth' });
    }
  });

  // --- Scroll Arrow Click ---
  const scrollArrow = document.querySelector('.scroll-arrow');
  if (scrollArrow && mainScroll) {
    scrollArrow.addEventListener('click', () => {
      mainScroll.scrollBy({ left: mainScroll.clientWidth, behavior: 'smooth' });
    });
    scrollArrow.style.cursor = 'pointer';
  }

  // --- Init ---
  if (mainScroll) {
    mainScroll.scrollLeft = 0;
  }

})();
