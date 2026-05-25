// Posts system — server-rendered cards, client-side pagination + reading view.
// Phase 4: reads embedded post data from <script id="post-data">, no posts.json fetch.

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  index: number;
}

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

// Read post metadata from embedded JSON
function loadPostData(): PostMeta[] {
  const el = document.getElementById('post-data');
  if (!el) return [];
  try {
    return JSON.parse(el.textContent || '[]') as PostMeta[];
  } catch {
    return [];
  }
}

// Re-render post cards for current page (client-side pagination)
function renderPostCards(posts: PostMeta[]): void {
  const grid = document.getElementById('postsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const ditherClasses = ['', ' post-dither-alt', ' post-dither-alt2'];
  const start = (currentPage - 1) * postsPerPage;
  const pagePosts = posts.slice(start, start + postsPerPage);

  pagePosts.forEach((post) => {
    const article = document.createElement('article');
    article.className = 'post-card';
    article.setAttribute('data-slug', post.slug);
    const globalIdx = start + pagePosts.indexOf(post);
    article.innerHTML =
      '<span class="post-badge">' + String(post.index + 1).padStart(2, '0') + '</span>' +
      '<div class="post-dither' + ditherClasses[post.index % 3] + '"></div>' +
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

// Open reading view — reads pre-rendered HTML from hidden store
function openReadingView(post: PostMeta): void {
  const contentEl = document.getElementById('post-content-' + post.slug);
  if (!contentEl) return;

  const bodyHtml = contentEl.innerHTML;

  const existing = document.querySelector('.reading-overlay');
  if (existing) existing.remove();

  scrollContainer = document.getElementById('scrollContainer');
  if (scrollContainer) scrollContainer.style.pointerEvents = 'none';

  const tagsHtml = Array.isArray(post.tags)
    ? post.tags.map((t) => '<span class="reading-tag">#' + t + '</span>').join('')
    : '<span class="reading-tag">#' + post.tags + '</span>';

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
              '<span class="reading-date">' + formatDate(post.date) + '</span>' +
              '<span class="reading-tags">' + tagsHtml + '</span>' +
            '</div>' +
            '<h2 class="reading-title">' + post.title + '</h2>' +
            '<div class="reading-title-line"></div>' +
          '</div>' +
          '<div class="reading-body">' + bodyHtml + '</div>' +
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

// Expose globally for timeline
(window as Record<string, unknown>).openReadingView = openReadingView;

// Bind click handlers
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

// Initialize — read embedded data, render pagination
export function initPostInteractions(): void {
  allPostsList = loadPostData();
  if (allPostsList.length === 0) return;

  postsPerPage = calcPostsPerPage();
  currentPage = 1;

  renderPagination(allPostsList.length);
  bindPostListeners(allPostsList);
  bindPagination(allPostsList);
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
