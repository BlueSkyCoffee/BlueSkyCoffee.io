// About timeline overlay — slides up from bottom, shows posts grouped by year.
// Phase 4: reads embedded timeline data instead of fetching posts.json.

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
}

let btn: HTMLElement | null = null;
let allPosts: PostMeta[] = [];
let overlay: HTMLElement | null = null;

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return parts[1] + '.' + parts[2];
}

function buildTimelineHTML(posts: PostMeta[]): string {
  const years: Record<string, PostMeta[]> = {};
  posts.forEach((post) => {
    const year = post.date.split('-')[0];
    if (!years[year]) years[year] = [];
    years[year].push(post);
  });

  const sortedYears = Object.keys(years).sort((a, b) => Number(b) - Number(a));
  let html = '';

  sortedYears.forEach((year, idx) => {
    const entries = years[year].sort((a, b) => b.date.localeCompare(a.date));

    html += '<div class="tl-year">';
    html += '<div class="tl-line"></div>';
    html += '<div class="tl-year-head">';
    html += '<div class="tl-node"></div>';
    html += '<h3 class="tl-year-label">' + year + '</h3>';
    html += '<span class="tl-year-count">' + entries.length + ' posts</span>';
    html += '</div>';

    entries.forEach((post) => {
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

function bindTimelineClicks(): void {
  const body = document.getElementById('timelineBody');
  if (!body) return;
  body.addEventListener('click', (ev) => {
    const item = (ev.target as HTMLElement).closest('.tl-item');
    if (item) {
      ev.preventDefault();
      ev.stopPropagation();
      const slug = item.getAttribute('data-slug');
      if (slug) {
        const openReadingView = (window as Record<string, unknown>).openReadingView as ((post: PostMeta) => void) | undefined;
        if (openReadingView) {
          const post = allPosts.find((p) => p.slug === slug);
          if (post) openReadingView(post);
        }
      }
    }
  });
}

function closeTimeline(): void {
  if (!overlay) return;
  overlay.classList.add('closing');
  overlay.classList.remove('active');
  if (btn) btn.classList.remove('active');
  setTimeout(() => {
    if (overlay) overlay.remove();
    overlay = null;
  }, 450);
}

function openTimeline(): void {
  if (!btn) return;
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
          buildTimelineHTML(allPosts) +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay!.classList.add('active');
      btn!.classList.add('active');
    });
  });

  const backBtn = overlay.querySelector('.timeline-back');
  const backdrop = overlay.querySelector('.timeline-backdrop');
  if (backBtn) backBtn.addEventListener('click', closeTimeline);
  if (backdrop) backdrop.addEventListener('click', closeTimeline);

  bindTimelineClicks();
}

export function initTimeline(): void {
  btn = document.getElementById('timelineToggleBtn');
  if (!btn) return;

  // Read embedded timeline data
  const el = document.getElementById('timeline-data');
  if (el) {
    try {
      allPosts = JSON.parse(el.textContent || '[]') as PostMeta[];
      allPosts.sort((a, b) => b.date.localeCompare(a.date));
    } catch {
      allPosts = [];
    }
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (document.querySelector('.timeline-overlay')) {
      closeTimeline();
    } else {
      openTimeline();
    }
  });
}
