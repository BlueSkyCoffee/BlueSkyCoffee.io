(function () {
  'use strict';

  // --- 1bit Background Dither Animation ---
  const bgCanvas = document.getElementById('bgDither');
  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    const CELL = 6;
    let cols, rows, grid;

    function resize() {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      cols = Math.ceil(bgCanvas.width / CELL);
      rows = Math.ceil(bgCanvas.height / CELL);
      grid = new Uint8Array(cols * rows);
      for (let i = 0; i < grid.length; i++) {
        grid[i] = Math.random() > 0.5 ? 1 : 0;
      }
    }

    function draw() {
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

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // --- Date ---
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  }

  // --- Horizontal Scroll ---
  const container = document.getElementById('scrollContainer');

  if (container) {
    // Smooth scroll with RAF + auto-snap
    let currentScroll = container.scrollLeft;
    let targetScroll = container.scrollLeft;
    let isScrolling = false;
    let snapTimeout;
    const SCROLL_SPEED = 3;
    const SNAP_DELAY = 200; // ms to wait before snapping

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate() {
      const diff = targetScroll - currentScroll;
      if (Math.abs(diff) > 0.5) {
        currentScroll += diff * 0.15;
        container.scrollLeft = currentScroll;
        requestAnimationFrame(animate);
      } else {
        isScrolling = false;
        currentScroll = targetScroll;
      }
    }

    function startScroll() {
      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(animate);
      }
    }

    function scrollToTarget(target) {
      targetScroll = Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth));
      startScroll();
    }

    function snapToNearest() {
      const panels = document.querySelectorAll('.panel');
      const center = container.scrollLeft + container.clientWidth / 2;
      let nearest = panels[0];
      let minDist = Infinity;

      panels.forEach(function(panel) {
        const dist = Math.abs(panel.offsetLeft - center);
        if (dist < minDist) {
          minDist = dist;
          nearest = panel;
        }
      });

      scrollToTarget(nearest.offsetLeft);
    }

    // Convert vertical wheel to horizontal scroll
    container.addEventListener('wheel', function(e) {
      e.preventDefault();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      targetScroll += delta * SCROLL_SPEED;
      startScroll();

      // Reset snap timeout on each scroll
      clearTimeout(snapTimeout);
      snapTimeout = setTimeout(snapToNearest, SNAP_DELAY);
    }, { passive: false });

    // Scroll progress bar + nav sync
    container.addEventListener('scroll', function() {
      // Update progress bar
      const progressBar = document.getElementById('scrollProgressBar');
      if (progressBar) {
        const max = container.scrollWidth - container.clientWidth;
        progressBar.style.width = max > 0 ? (container.scrollLeft / max * 100) + '%' : '0%';
      }

      // Update nav dots
      const panels = document.querySelectorAll('.panel');
      const dots = document.querySelectorAll('.nav-dot');
      const center = container.scrollLeft + container.clientWidth / 2;

      panels.forEach(function(panel, i) {
        if (center >= panel.offsetLeft && center < panel.offsetLeft + panel.offsetWidth) {
          dots.forEach(function(d) { d.classList.remove('active'); });
          if (dots[i]) dots[i].classList.add('active');
        }
      });
    });

    // Nav dot clicks
    document.querySelectorAll('.nav-dot').forEach(function(dot) {
      dot.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.getElementById(dot.getAttribute('href').slice(1));
        if (target) {
          scrollToTarget(target.offsetLeft);
        }
      });
    });

    // Arrow click
    const arrow = document.querySelector('.scroll-arrow');
    if (arrow) {
      arrow.addEventListener('click', function() {
        scrollToTarget(container.scrollLeft + container.clientWidth);
      });
    }

    // Keyboard
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToTarget(container.scrollLeft + container.clientWidth);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToTarget(container.scrollLeft - container.clientWidth);
      }
    });
  }

  // --- Footer Matrix Rain ---
  const footerCanvasEl = document.getElementById('footerCanvas');
  if (footerCanvasEl) {
    const fc = document.createElement('canvas');
    footerCanvasEl.appendChild(fc);
    const fctx = fc.getContext('2d');
    const CHARS = '01░▒▓█▀▄■□▪▫';
    const FS = 12;
    let cols, drops;

    function resizeFooter() {
      const rect = footerCanvasEl.parentElement.getBoundingClientRect();
      fc.width = rect.width;
      fc.height = rect.height;
      cols = Math.floor(fc.width / FS);
      drops = [];
      for (let i = 0; i < cols; i++) drops[i] = Math.random() * -100;
    }

    function drawFooter() {
      fctx.fillStyle = 'rgba(0,0,0,0.08)';
      fctx.fillRect(0, 0, fc.width, fc.height);
      fctx.fillStyle = '#fff';
      fctx.font = FS + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        fctx.fillStyle = Math.random() > 0.95 ? '#fff' : 'rgba(255,255,255,0.5)';
        fctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FS, drops[i] * FS);
        if (drops[i] * FS > fc.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(drawFooter);
    }

    window.addEventListener('resize', resizeFooter);
    setTimeout(function() { resizeFooter(); drawFooter(); }, 200);
  }

})();
