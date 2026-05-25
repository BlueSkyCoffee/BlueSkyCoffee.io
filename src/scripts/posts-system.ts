// Posts system — renders post cards, pagination, reading view overlay.
// Phase 3: still uses posts.json. Phase 4 will replace with content collections.

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  file?: string;
}

interface PostContent {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  bodyHtml: string;
}

const postCache = new Map<string, PostContent>();
let allPostsList: PostMeta[] = [];
let currentPage = 1;
let postsPerPage = 3;
let scrollContainer: HTMLElement | null = null;

function calcPostsPerPage(): number {
  const w = window.innerWidth;
  if (w <= 768) return 1;
  if (w <= 1024) return 2;
  return 3;
}

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.');
}

// Parse YAML frontmatter from raw markdown
function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const frontmatter = match[1];
  const body = match[2];
  const meta: Record<string, unknown> = {};

  frontmatter.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
    }
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    meta[key] = val;
  });

  return { meta, body };
}

// Fetch and parse a single post's markdown file
async function loadPostContent(post: PostMeta): Promise<PostContent> {
  if (postCache.has(post.slug)) {
    return postCache.get(post.slug)!;
  }

  try {
    const res = await fetch(post.file || 'posts/' + post.slug + '.md');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.text();
    const parsed = parseFrontmatter(raw);

    // Check if marked is available
    const markedGlobal = (window as Record<string, unknown>).marked as { parse: (s: string) => string; setOptions: (o: Record<string, unknown>) => void } | undefined;
    const bodyHtml = markedGlobal
      ? markedGlobal.parse(parsed.body as string)
      : '<pre>' + (parsed.body as string).replace(/</g, '&lt;') + '</pre>';

    const content: PostContent = {
      slug: post.slug,
      title: (parsed.meta.title as string) || post.title,
      date: (parsed.meta.date as string) || post.date,
      tags: (parsed.meta.tags as string[]) || post.tags,
      bodyHtml: bodyHtml,
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
      bodyHtml: '<p><em>Content unavailable.</em></p>',
    };
  }
}

// Render post cards to #postsGrid for current page
function renderPostCards(posts: PostMeta[]): void {
  const grid = document.getElementById('postsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const ditherClasses = ['', ' post-dither-alt', ' post-dither-alt2'];
  const start = (currentPage - 1) * postsPerPage;
  const pagePosts = posts.slice(start, start + postsPerPage);

  pagePosts.forEach((post, i) => {
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
function renderPagination(totalPosts: number): void {
  const container = document.getElementById('postsPagination');
  if (!container) return;
  container.innerHTML = '';

  const totalPages = Math.ceil(totalPosts / postsPerPage);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn' + (currentPage === 1 ? ' disabled' : '');
  prevBtn.textContent = '←';
  prevBtn.setAttribute('data-page', String(currentPage - 1));
  prevBtn.setAttribute('type', 'button');
  container.appendChild(prevBtn);

  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
    btn.textContent = String(p);
    btn.setAttribute('data-page', String(p));
    btn.setAttribute('type', 'button');
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn' + (currentPage === totalPages ? ' disabled' : '');
  nextBtn.textContent = '→';
  nextBtn.setAttribute('data-page', String(currentPage + 1));
  nextBtn.setAttribute('type', 'button');
  container.appendChild(nextBtn);
}

// Handle pagination click via event delegation
function bindPagination(posts: PostMeta[]): void {
  const container = document.getElementById('postsPagination');
  if (!container) return;
  container.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.page-btn');
    if (!btn || btn.classList.contains('disabled')) return;
    e.preventDefault();
    const page = parseInt(btn.getAttribute('data-page') || '0', 10);
    if (isNaN(page)) return;
    currentPage = page;
    renderPostCards(posts);
    renderPagination(posts.length);
  });
}

// Open reading view overlay
async function openReadingView(post: PostMeta): Promise<void> {
  const content = await loadPostContent(post);

  const existing = document.querySelector('.reading-overlay');
  if (existing) existing.remove();

  scrollContainer = document.getElementById('scrollContainer');
  if (scrollContainer) scrollContainer.style.pointerEvents = 'none';

  const tagsHtml = Array.isArray(content.tags)
    ? content.tags.map((t) => '<span class="reading-tag">#' + t + '</span>').join('')
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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  });

  const backBtn = overlay.querySelector('.reading-back');
  const backFooterBtn = overlay.querySelector('.reading-back-btn');
  const backdrop = overlay.querySelector('.reading-backdrop');

  const close = () => closeReadingView();
  if (backBtn) backBtn.addEventListener('click', close);
  if (backFooterBtn) backFooterBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
}

// Close reading view
function closeReadingView(): void {
  const overlay = document.querySelector('.reading-overlay');
  if (!overlay) return;

  overlay.classList.add('closing');
  overlay.classList.remove('active');

  scrollContainer = document.getElementById('scrollContainer');
  if (scrollContainer) scrollContainer.style.pointerEvents = '';

  setTimeout(() => {
    overlay.remove();
  }, 450);
}

// Expose openReadingView globally for timeline to call
(window as Record<string, unknown>).openReadingView = openReadingView;

// Bind click handlers for post cards
function bindPostListeners(posts: PostMeta[]): void {
  const postsSection = document.getElementById('posts');
  if (!postsSection) return;

  postsSection.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('.post-link');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      const card = (e.target as HTMLElement).closest('.post-card');
      const slug = card ? card.getAttribute('data-slug') : null;
      if (slug) {
        const post = posts.find((p) => p.slug === slug);
        if (post) openReadingView(post);
      }
    }
  });
}

// Initialize posts system
export async function initPosts(): Promise<void> {
  postsPerPage = calcPostsPerPage();

  // Configure marked.js if available
  const markedGlobal = (window as Record<string, unknown>).marked as { setOptions: (o: Record<string, unknown>) => void } | undefined;
  if (markedGlobal) {
    markedGlobal.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false,
    });
  } else {
    console.warn('[BlueSkyCoffee] marked.js not loaded, posts will render as plain text');
  }

  try {
    const res = await fetch('posts.json?t=' + Date.now());
    if (!res.ok) throw new Error('posts.json not found');
    const data = await res.json();
    allPostsList = data.posts;

    allPostsList.sort((a: PostMeta, b: PostMeta) => b.date.localeCompare(a.date));

    renderPostCards(allPostsList);
    renderPagination(allPostsList.length);
    bindPostListeners(allPostsList);
    bindPagination(allPostsList);
  } catch (err) {
    console.error('[BlueSkyCoffee] Failed to load posts:', err);
    const grid = document.getElementById('postsGrid');
    if (grid) {
      grid.innerHTML = '<p style="opacity:0.4;font-size:12px;">Posts unavailable — run via HTTP server, not file://</p>';
    }
  }
}

// Responsive: recalc pagination on resize
window.addEventListener('resize', () => {
  if (allPostsList.length === 0) return;
  const newPerPage = calcPostsPerPage();
  if (newPerPage !== postsPerPage) {
    postsPerPage = newPerPage;
    currentPage = 1;
    renderPostCards(allPostsList);
    renderPagination(allPostsList.length);
  }
});

// Escape key to close reading view
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.querySelector('.reading-overlay')) {
    e.preventDefault();
    closeReadingView();
  }
});
