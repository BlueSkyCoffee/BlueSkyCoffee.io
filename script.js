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
      const target = e.target;
      const scrollableParent = target.closest('.scroll-container-y, .reading-body, .reading-inner, .archive-list, .posts-grid');

      // If in a vertically scrollable area, check boundaries
      if (scrollableParent) {
        const el = scrollableParent;
        const canScrollVertically = el.scrollHeight > el.clientHeight;
        const isVerticalDominant = Math.abs(e.deltaY) > Math.abs(e.deltaX);

        if (canScrollVertically && isVerticalDominant) {
          const scrollTop = el.scrollTop;
          const scrollBottom = scrollTop + el.clientHeight;
          const atTop = scrollTop <= 1;
          const atBottom = scrollBottom >= el.scrollHeight - 1;

          // At boundary and scrolling further out — let horizontal scroll take over
          if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
            // Fall through to horizontal
          } else {
            return; // Allow vertical scroll
          }
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

    // Expose scroll functions globally for keyboard nav
    window.scrollToTarget = scrollToTarget;

    // Keyboard
    document.addEventListener('keydown', function(e) {
      // Don't navigate if game is active
      if (window.isGameActive && window.isGameActive()) return;

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
  let allPostsList = []; // All posts for pagination
  let currentPage = 1;
  let postsPerPage = 3;

  // Calculate posts per page based on viewport width
  function calcPostsPerPage() {
    const w = window.innerWidth;
    if (w <= 768) return 1;
    if (w <= 1024) return 2;
    return 3;
  }

  // Render post cards to #postsGrid for a given page
  function renderPostCards(posts) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const ditherClasses = ['', ' post-dither-alt', ' post-dither-alt2'];
    const start = (currentPage - 1) * postsPerPage;
    const pagePosts = posts.slice(start, start + postsPerPage);

    pagePosts.forEach(function(post, i) {
      const article = document.createElement('article');
      article.className = 'post-card';
      article.setAttribute('data-slug', post.slug);
      const globalIdx = start + i;
      article.innerHTML =
        '<span class="post-badge">' + String(globalIdx + 1).padStart(2, '0') + '</span>' +
        '<div class="post-dither' + ditherClasses[globalIdx % 3] + '"></div>' +
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

  // Render pagination buttons
  function renderPagination(totalPosts) {
    const container = document.getElementById('postsPagination');
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(totalPosts / postsPerPage);
    if (totalPages <= 1) return;

    // Prev button
    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn' + (currentPage === 1 ? ' disabled' : '');
    prevBtn.textContent = '←';
    prevBtn.setAttribute('data-page', String(currentPage - 1));
    prevBtn.setAttribute('type', 'button');
    container.appendChild(prevBtn);

    // Page numbers
    for (var p = 1; p <= totalPages; p++) {
      (function(pageNum) {
        var btn = document.createElement('button');
        btn.className = 'page-btn' + (pageNum === currentPage ? ' active' : '');
        btn.textContent = String(pageNum);
        btn.setAttribute('data-page', String(pageNum));
        btn.setAttribute('type', 'button');
        container.appendChild(btn);
      })(p);
    }

    // Next button
    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn' + (currentPage === totalPages ? ' disabled' : '');
    nextBtn.textContent = '→';
    nextBtn.setAttribute('data-page', String(currentPage + 1));
    nextBtn.setAttribute('type', 'button');
    container.appendChild(nextBtn);
  }

  // Handle pagination click via event delegation
  function bindPagination(allPosts) {
    var container = document.getElementById('postsPagination');
    if (!container) return;
    container.addEventListener('click', function(e) {
      var btn = e.target.closest('.page-btn');
      if (!btn || btn.classList.contains('disabled')) return;
      e.preventDefault();
      var page = parseInt(btn.getAttribute('data-page'), 10);
      if (isNaN(page)) return;
      currentPage = page;
      renderPostCards(allPosts);
      renderPagination(allPosts.length);
    });
  }

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

  // Shared: Group posts by year and return HTML string for timeline
  function buildTimelineHTML(posts) {
    var years = {};
    posts.forEach(function(post) {
      var year = post.date.split('-')[0];
      if (!years[year]) years[year] = [];
      years[year].push(post);
    });

    var sortedYears = Object.keys(years).sort(function(a, b) { return b - a; });
    var html = '';

    sortedYears.forEach(function(year, idx) {
      var entries = years[year].sort(function(a, b) { return b.date.localeCompare(a.date); });

      html += '<div class="tl-year">';
      html += '<div class="tl-line"></div>';
      html += '<div class="tl-year-head">';
      html += '<div class="tl-node"></div>';
      html += '<h3 class="tl-year-label">' + year + '</h3>';
      html += '<span class="tl-year-count">' + entries.length + ' posts</span>';
      html += '</div>';

      entries.forEach(function(post) {
        html += '<div class="tl-item" data-slug="' + post.slug + '">';
        html += '<span class="tl-date">' + formatShortDate(post.date) + '</span>';
        html += '<span class="tl-tag">#' + (Array.isArray(post.tags) ? post.tags[0] : post.tags) + '</span>';
        html += '<span class="tl-title">' + post.title + '</span>';
        html += '<span class="tl-arrow">→</span>';
        html += '</div>';
      });

      html += '</div>';

      if (idx < sortedYears.length - 1) {
        html += '<div class="tl-sep"></div>';
      }
    });

    return html;
  }

  // Render archive entries grouped by year to #archiveList
  function renderArchive(posts) {
    const list = document.getElementById('archiveList');
    if (!list) return;
    list.innerHTML = buildTimelineHTML(posts);
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

  // Bind click handlers for post cards and archive items using event delegation
  function bindPostListeners(allPosts) {
    function handlePostClick(e) {
      const link = e.target.closest('.post-link');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        const card = link.closest('.post-card');
        const slug = card ? card.getAttribute('data-slug') : null;
        if (slug) {
          const post = allPosts.find(function(p) { return p.slug === slug; });
          if (post) openReadingView(post);
        }
        return;
      }
    }

    function handleArchiveClick(e) {
      const archiveItem = e.target.closest('.archive-item');
      if (archiveItem) {
        e.preventDefault();
        e.stopPropagation();
        const slug = archiveItem.getAttribute('data-slug');
        if (slug) {
          const post = allPosts.find(function(p) { return p.slug === slug; });
          if (post) openReadingView(post);
        }
      }
    }

    const postsSection = document.getElementById('posts');
    if (postsSection) {
      postsSection.addEventListener('click', handlePostClick);
    }
  }

  // Open reading view — create overlay that slides up from bottom
  async function openReadingView(post) {
    const content = await loadPostContent(post);

    // Remove existing reading view if any
    const existing = document.querySelector('.reading-overlay');
    if (existing) existing.remove();

    // Disable horizontal scroll during reading
    if (container) {
      container.style.pointerEvents = 'none';
    }

    const tagsHtml = Array.isArray(content.tags)
      ? content.tags.map(function(t) { return '<span class="reading-tag">#' + t + '</span>'; }).join('')
      : '<span class="reading-tag">#' + content.tags + '</span>';

    const overlay = document.createElement('div');
    overlay.className = 'reading-overlay';
    overlay.innerHTML =
      '<div class="reading-backdrop"></div>' +
      '<div class="reading-slide">' +
        '<div class="reading-scroll">' +
          '<div class="reading-inner">' +
            '<div class="reading-header">' +
              '<button class="reading-back">' +
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
              '<button class="reading-back-btn">[← BACK TO POSTS]</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Trigger slide-up animation on next frame
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add('active');
      });
    });

    // Bind back buttons
    overlay.querySelector('.reading-back').addEventListener('click', closeReadingView);
    overlay.querySelector('.reading-back-btn').addEventListener('click', closeReadingView);

    // Click backdrop to close
    overlay.querySelector('.reading-backdrop').addEventListener('click', closeReadingView);
  }

  // Close reading view — slide down then remove
  function closeReadingView() {
    const overlay = document.querySelector('.reading-overlay');
    if (!overlay) return;

    overlay.classList.add('closing');
    overlay.classList.remove('active');

    // Re-enable horizontal scroll after animation
    if (container) {
      container.style.pointerEvents = '';
    }

    // Remove after animation completes
    setTimeout(function() {
      overlay.remove();
    }, 450);
  }

  // Initialize posts system
  async function initPosts() {
    postsPerPage = calcPostsPerPage();

    if (!initMarked()) {
      console.warn('[BlueSkyCoffee] marked.js not loaded, posts will render as plain text');
    }

    try {
      const res = await fetch('posts.json?t=' + Date.now());
      if (!res.ok) throw new Error('posts.json not found');
      const data = await res.json();
      allPostsList = data.posts;

      // Sort by date descending
      allPostsList.sort(function(a, b) { return b.date.localeCompare(a.date); });

      // Render current page
      renderPostCards(allPostsList);
      renderPagination(allPostsList.length);

      // Bind click handlers
      bindPostListeners(allPostsList);
      bindPagination(allPostsList);
    } catch (err) {
      console.error('[BlueSkyCoffee] Failed to load posts:', err);
      // Fallback: show error indicator
      const grid = document.getElementById('postsGrid');
      if (grid) {
        grid.innerHTML = '<p style="opacity:0.4;font-size:12px;">Posts unavailable — run via HTTP server, not file://</p>';
      }
    }
  }

  // Responsive: recalc pagination on resize
  window.addEventListener('resize', function() {
    if (allPostsList.length === 0) return;
    var newPerPage = calcPostsPerPage();
    if (newPerPage !== postsPerPage) {
      postsPerPage = newPerPage;
      currentPage = 1;
      renderPostCards(allPostsList);
      renderPagination(allPostsList.length);
    }
  });

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
        fctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * FS, drops[i] * FS);
        if (drops[i] * FS > fc.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(drawFooter);
    }

    window.addEventListener('resize', resizeFooter);
    setTimeout(function() { resizeFooter(); drawFooter(); }, 200);
  }

  // --- About Timeline Overlay ---
  (function() {
    const btn = document.getElementById('timelineToggleBtn');
    let rendered = false;
    let allPosts = [];
    let overlay = null;

    if (!btn) return;

    function openTimeline() {
      // Remove existing overlay if any
      const existing = document.querySelector('.timeline-overlay');
      if (existing) existing.remove();

      overlay = document.createElement('div');
      overlay.className = 'timeline-overlay';
      overlay.innerHTML =
        '<div class="timeline-backdrop"></div>' +
        '<div class="timeline-slide">' +
          '<div class="timeline-scroll">' +
            '<div class="timeline-header">' +
              '<button class="timeline-back" id="timelineBackBtn" type="button">' +
                '<span class="back-arrow">←</span>' +
                '<span class="back-label">BACK</span>' +
              '</button>' +
              '<h2 class="timeline-title">TIMELINE</h2>' +
              '<div class="timeline-title-line"></div>' +
            '</div>' +
            '<div class="timeline-body" id="timelineBody">' +
              (rendered ? buildTimelineHTML(allPosts) : '<p style="font-size:12px;opacity:0.5;">Loading...</p>') +
            '</div>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      // Trigger slide-up animation on next frame
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          overlay.classList.add('active');
          btn.classList.add('active');
        });
      });

      // Bind back button
      overlay.querySelector('.timeline-back').addEventListener('click', closeTimeline);
      overlay.querySelector('.timeline-backdrop').addEventListener('click', closeTimeline);

      // Lazy render on first open
      if (!rendered) {
        fetch('posts.json?t=' + Date.now())
          .then(function(res) { return res.json(); })
          .then(function(data) {
            allPosts = data.posts;
            allPosts.sort(function(a, b) { return b.date.localeCompare(a.date); });
            rendered = true;
            const body = document.getElementById('timelineBody');
            if (body) body.innerHTML = buildTimelineHTML(allPosts);
            bindTimelineClicks();
          })
          .catch(function() {
            const body = document.getElementById('timelineBody');
            if (body) body.innerHTML = '<p style="font-size:12px;opacity:0.5;">Timeline unavailable.</p>';
          });
      } else {
        bindTimelineClicks();
      }
    }

    function closeTimeline() {
      if (!overlay) return;
      overlay.classList.add('closing');
      overlay.classList.remove('active');
      btn.classList.remove('active');
      setTimeout(function() {
        if (overlay) overlay.remove();
        overlay = null;
      }, 450);
    }

    function bindTimelineClicks() {
      var body = document.getElementById('timelineBody');
      if (!body) return;
      body.addEventListener('click', function(ev) {
        var item = ev.target.closest('.tl-item');
        if (item) {
          ev.preventDefault();
          ev.stopPropagation();
          var slug = item.getAttribute('data-slug');
          if (slug) {
            var post = allPosts.find(function(p) { return p.slug === slug; });
            if (post) openReadingView(post);
          }
        }
      });
    }

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (document.querySelector('.timeline-overlay')) {
        closeTimeline();
      } else {
        openTimeline();
      }
    });
  })();

  // --- Footer Snake Game ---
  (function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;   // 320
    const H = canvas.height;  // 240
    const GRID = 16;
    const COLS = W / GRID;    // 20
    const ROWS = H / GRID;    // 15

    let snake, dir, nextDir, food, score, gameLoop, state;

    const promptEl = document.getElementById('gamePrompt');
    const hudEl = document.getElementById('gameHud');
    const scoreEl = document.getElementById('gameScore');
    const overScreenEl = document.getElementById('gameOverScreen');
    const overScoreEl = document.getElementById('gameOverScore');
    const startBtn = document.getElementById('gameStartBtn');
    const quitBtn = document.getElementById('gameQuitBtn');
    const restartBtn = document.getElementById('gameRestartBtn');

    state = 'idle';

    function initGame() {
      snake = [
        { x: 10, y: 7 },
        { x: 9, y: 7 },
        { x: 8, y: 7 }
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      placeFood();
      if (scoreEl) scoreEl.textContent = '0';
    }

    function placeFood() {
      const occupied = {};
      snake.forEach(function(s) { occupied[s.x + ',' + s.y] = true; });
      const candidates = [];
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          if (!occupied[x + ',' + y]) candidates.push({ x: x, y: y });
        }
      }
      if (candidates.length === 0) { gameOver(); return; }
      food = candidates[Math.floor(Math.random() * candidates.length)];
    }

    function draw() {
      // Clear — solid black
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Draw subtle dithered grid dots
      ctx.fillStyle = '#fff';
      for (let x = 0; x <= COLS; x++) {
        for (let y = 0; y <= ROWS; y++) {
          if ((x + y) % 2 === 0) {
            ctx.fillRect(x * GRID, y * GRID, 1, 1);
          }
        }
      }

      // Draw snake (white blocks with 1px gap for pixel feel)
      ctx.fillStyle = '#fff';
      snake.forEach(function(s, i) {
        const gap = i === 0 ? 0 : 1;
        ctx.fillRect(s.x * GRID + gap, s.y * GRID + gap, GRID - gap * 2, GRID - gap * 2);
      });

      // Draw food (blinking)
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

      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, W, H);
    }

    function update() {
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { gameOver(); return; }

      // Self collision
      for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) { gameOver(); return; }
      }

      snake.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (scoreEl) scoreEl.textContent = score;
        placeFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function startGame() {
      initGame();
      state = 'playing';
      if (promptEl) promptEl.style.display = 'none';
      if (overScreenEl) overScreenEl.style.display = 'none';
      if (hudEl) hudEl.style.display = 'flex';
      draw();
      gameLoop = setInterval(update, 120);
    }

    function gameOver() {
      state = 'over';
      clearInterval(gameLoop);
      if (overScoreEl) overScoreEl.textContent = score;
      if (overScreenEl) overScreenEl.style.display = 'flex';

      // Flash effect
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      setTimeout(function() { draw(); }, 150);
    }

    function quitGame() {
      state = 'idle';
      clearInterval(gameLoop);
      if (promptEl) promptEl.style.display = 'flex';
      if (hudEl) hudEl.style.display = 'none';
      if (overScreenEl) overScreenEl.style.display = 'none';

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, W, H);
    }

    // Key handler for game — capture phase to intercept before nav handler
    function handleGameKey(e) {
      if (state !== 'playing') return;
      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(key) !== -1) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (key === 'ArrowUp' && dir.y !== 1) nextDir = { x: 0, y: -1 };
      else if (key === 'ArrowDown' && dir.y !== -1) nextDir = { x: 0, y: 1 };
      else if (key === 'ArrowLeft' && dir.x !== 1) nextDir = { x: -1, y: 0 };
      else if (key === 'ArrowRight' && dir.x !== -1) nextDir = { x: 1, y: 0 };
    }

    document.addEventListener('keydown', handleGameKey, true);

    // Button handlers
    if (startBtn) startBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); startGame(); });
    if (quitBtn) quitBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); quitGame(); });
    if (restartBtn) restartBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); startGame(); });

    // Expose state for keyboard nav check
    window.isGameActive = function() { return state === 'playing'; };

    // Draw initial idle canvas
    quitGame();
  })();

})();
