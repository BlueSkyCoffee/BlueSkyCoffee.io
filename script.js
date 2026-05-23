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
    let lastScrollLeft = 0;
    let scrollDirection = 0; // -1 = left, 0 = none, 1 = right
    const SCROLL_SPEED = 3;
    const SNAP_DELAY = 250; // ms to wait before snapping
    const SNAP_THRESHOLD = 0.3; // only snap if within 30% of panel center

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
      const viewCenter = container.scrollLeft + container.clientWidth / 2;
      let nearest = panels[0];
      let minDist = Infinity;

      panels.forEach(function(panel) {
        const panelCenter = panel.offsetLeft + panel.offsetWidth / 2;
        const dist = Math.abs(panelCenter - viewCenter);
        if (dist < minDist) {
          minDist = dist;
          nearest = panel;
        }
      });

      // Only snap if the distance is within threshold of panel width
      const panelWidth = nearest ? nearest.offsetWidth : container.clientWidth;
      if (minDist < panelWidth * SNAP_THRESHOLD || !isScrolling) {
        scrollToTarget(nearest.offsetLeft);
      }
    }

    // Convert vertical wheel to horizontal scroll
    container.addEventListener('wheel', function(e) {
      // Check if we're over a vertically scrollable area
      const target = e.target;
      const scrollableParent = target.closest('.panel[style*="overflow-y: auto"], .scroll-container-y, .reading-body, .reading-inner, .archive-list, .posts-grid');

      // If in a vertically scrollable area and there's vertical scroll content, let it scroll vertically
      if (scrollableParent) {
        const el = scrollableParent;
        const canScrollVertically = el.scrollHeight > el.clientHeight;
        if (canScrollVertically && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          // Allow vertical scroll — don't prevent default
          return;
        }
      }

      e.preventDefault();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      // Track scroll direction
      const prevScroll = container.scrollLeft;
      targetScroll += delta * SCROLL_SPEED;
      scrollDirection = targetScroll > prevScroll ? 1 : -1;

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

  // --- Posts System ---
  const postCache = new Map(); // Cache fetched post content by slug

  // Initialize marked.js when available
  function initMarked() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
      return true;
    }
    return false;
  }

  // Parse YAML frontmatter from raw markdown
  function parseFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const frontmatter = match[1];
    const body = match[2];
    const meta = {};

    frontmatter.split('\n').forEach(function(line) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      // Parse arrays like ["tech", "design"]
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(function(s) {
          return s.trim().replace(/^["']|["']$/g, '');
        });
      }
      // Parse booleans
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      meta[key] = val;
    });

    return { meta, body };
  }

  // Fetch and parse a single post's markdown file
  async function loadPostContent(post) {
    if (postCache.has(post.slug)) {
      return postCache.get(post.slug);
    }

    try {
      const res = await fetch(post.file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const raw = await res.text();
      const parsed = parseFrontmatter(raw);
      const bodyHtml = typeof marked !== 'undefined'
        ? marked.parse(parsed.body)
        : '<pre>' + parsed.body.replace(/</g, '&lt;') + '</pre>';

      const content = {
        slug: post.slug,
        title: parsed.meta.title || post.title,
        date: parsed.meta.date || post.date,
        tags: parsed.meta.tags || post.tags,
        bodyHtml: bodyHtml
      };

      postCache.set(post.slug, content);
      return content;
    } catch (err) {
      console.error('[BlueSkyCoffee] Failed to load post:', post.slug, err);
      return {
        slug: post.slug,
        title: post.title,
        date: post.date,
        tags: post.tags,
        bodyHtml: '<p><em>Content unavailable.</em></p>'
      };
    }
  }

  // Format date string YYYY-MM-DD → YYYY.MM.DD
  function formatDate(dateStr) {
    return dateStr.replace(/-/g, '.');
  }

  // Format date MM.DD → just show month.day
  function formatShortDate(dateStr) {
    const parts = dateStr.split('-');
    return parts[1] + '.' + parts[2];
  }

  // Render post cards to #postsGrid
  function renderPostCards(posts) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    const ditherClasses = ['', ' post-dither-alt', ' post-dither-alt2'];

    posts.forEach(function(post, i) {
      const article = document.createElement('article');
      article.className = 'post-card';
      article.setAttribute('data-slug', post.slug);
      article.innerHTML =
        '<span class="post-badge">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<div class="post-dither' + ditherClasses[i % 3] + '"></div>' +
        '<div class="post-meta">' +
          '<span class="post-date">' + formatDate(post.date) + '</span>' +
          '<span class="post-tag">#' + (Array.isArray(post.tags) ? post.tags[0] : post.tags) + '</span>' +
        '</div>' +
        '<h3 class="post-title">' + post.title + '</h3>' +
        '<p class="post-excerpt">' + post.excerpt + '</p>' +
        '<a href="#" class="post-link">[read more] →</a>';

      grid.appendChild(article);
    });
  }

  // Render archive entries grouped by year to #archiveList
  function renderArchive(posts) {
    const list = document.getElementById('archiveList');
    if (!list) return;

    // Group by year
    const years = {};
    posts.forEach(function(post) {
      const year = post.date.split('-')[0];
      if (!years[year]) years[year] = [];
      years[year].push(post);
    });

    const sortedYears = Object.keys(years).sort(function(a, b) { return b - a; });

    sortedYears.forEach(function(year, idx) {
      const yearGroup = document.createElement('div');
      yearGroup.className = 'archive-year-group';

      const entries = years[year].sort(function(a, b) { return b.date.localeCompare(a.date); });

      yearGroup.innerHTML =
        '<div class="year-header">' +
          '<div class="year-dot"></div>' +
          '<h3 class="year-label">' + year + '</h3>' +
          '<span class="year-count">' + entries.length + ' posts</span>' +
        '</div>' +
        '<ul class="archive-entries">' +
          entries.map(function(post) {
            return '<li class="archive-item" data-slug="' + post.slug + '">' +
              '<span class="entry-date">' + formatShortDate(post.date) + '</span>' +
              '<span class="entry-tag">#' + (Array.isArray(post.tags) ? post.tags[0] : post.tags) + '</span>' +
              '<span class="entry-title">' + post.title + '</span>' +
              '<span class="entry-arrow">→</span>' +
            '</li>';
          }).join('') +
        '</ul>';

      list.appendChild(yearGroup);

      // Add divider between years (not after last)
      if (idx < sortedYears.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'year-divider';
        list.appendChild(divider);
      }
    });
  }

  // Update archive stats
  function renderArchiveStats(posts) {
    const totalEl = document.getElementById('archiveTotalCount');
    const yearEl = document.getElementById('archiveYearCount');
    const tagEl = document.getElementById('archiveTagCount');

    if (totalEl) totalEl.textContent = posts.length;

    const years = new Set(posts.map(function(p) { return p.date.split('-')[0]; }));
    if (yearEl) yearEl.textContent = years.size;

    const tags = new Set();
    posts.forEach(function(p) {
      if (Array.isArray(p.tags)) p.tags.forEach(function(t) { tags.add(t); });
    });
    if (tagEl) tagEl.textContent = tags.size;
  }

  // Bind click handlers for post cards and archive items
  function bindPostListeners(allPosts) {
    // Post card "read more" links
    document.querySelectorAll('.post-card .post-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const card = link.closest('.post-card');
        const slug = card ? card.getAttribute('data-slug') : null;
        if (slug) {
          const post = allPosts.find(function(p) { return p.slug === slug; });
          if (post) openReadingView(post);
        }
      });
    });

    // Archive item clicks
    document.querySelectorAll('.archive-item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        const slug = item.getAttribute('data-slug');
        if (slug) {
          const post = allPosts.find(function(p) { return p.slug === slug; });
          if (post) openReadingView(post);
        }
      });
    });
  }

  // Open reading view — dynamically inject a panel
  async function openReadingView(post) {
    const content = await loadPostContent(post);
    const track = document.querySelector('.scroll-track');
    if (!track) return;

    // Remove existing reading view if any
    const existing = document.querySelector('.panel-reading-view');
    if (existing) existing.remove();

    const tagsHtml = Array.isArray(content.tags)
      ? content.tags.map(function(t) { return '<span class="reading-tag">#' + t + '</span>'; }).join('')
      : '<span class="reading-tag">#' + content.tags + '</span>';

    const panel = document.createElement('section');
    panel.className = 'panel panel-reading-view';
    panel.id = 'reading-' + content.slug;
    panel.innerHTML =
      '<div class="panel-inner reading-inner">' +
        '<div class="reading-header">' +
          '<button class="reading-back" onclick="closeReadingView()">' +
            '<span class="back-arrow">←</span>' +
            '<span class="back-label">BACK</span>' +
          '</button>' +
          '<div class="reading-meta">' +
            '<span class="reading-date">' + formatDate(content.date) + '</span>' +
            '<span class="reading-tags">' + tagsHtml + '</span>' +
          '</div>' +
          '<h2 class="reading-title">' + content.title + '</h2>' +
          '<div class="reading-title-line"></div>' +
        '</div>' +
        '<div class="reading-body">' + content.bodyHtml + '</div>' +
        '<div class="reading-footer">' +
          '<div class="reading-footer-line"></div>' +
          '<button class="reading-back-btn" onclick="closeReadingView()">[← BACK TO POSTS]</button>' +
        '</div>' +
      '</div>';

    track.appendChild(panel);

    // Scroll to the new panel
    if (typeof scrollToTarget === 'function') {
      scrollToTarget(panel.offsetLeft);
    }
  }

  // Close reading view — remove panel and scroll back
  function closeReadingView() {
    const panel = document.querySelector('.panel-reading-view');
    if (!panel) return;

    const postsPanel = document.getElementById('posts');
    const targetLeft = postsPanel ? postsPanel.offsetLeft : 0;

    panel.remove();

    if (typeof scrollToTarget === 'function') {
      scrollToTarget(targetLeft);
    }
  }

  // Make closeReadingView globally accessible for onclick handlers
  window.closeReadingView = closeReadingView;

  // Initialize posts system
  async function initPosts() {
    if (!initMarked()) {
      console.warn('[BlueSkyCoffee] marked.js not loaded, posts will render as plain text');
    }

    try {
      const res = await fetch('posts.json?t=' + Date.now());
      if (!res.ok) throw new Error('posts.json not found');
      const data = await res.json();
      const posts = data.posts;

      // Sort by date descending
      posts.sort(function(a, b) { return b.date.localeCompare(a.date); });

      // Render featured posts (top 3)
      const featured = posts.filter(function(p) { return p.featured !== false; }).slice(0, 3);
      renderPostCards(featured);

      // Render archive
      renderArchive(posts);
      renderArchiveStats(posts);

      // Bind click handlers
      bindPostListeners(posts);
    } catch (err) {
      console.error('[BlueSkyCoffee] Failed to load posts:', err);
      // Fallback: show error indicator
      const grid = document.getElementById('postsGrid');
      if (grid) {
        grid.innerHTML = '<p style="opacity:0.4;font-size:12px;">Posts unavailable — run via HTTP server, not file://</p>';
      }
    }
  }

  // Initialize posts on DOM ready
  initPosts();

  // Add Escape key to close reading view
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.querySelector('.panel-reading-view')) {
      e.preventDefault();
      closeReadingView();
    }
  });

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
