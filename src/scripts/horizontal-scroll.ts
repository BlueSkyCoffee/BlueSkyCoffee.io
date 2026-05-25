// Horizontal scroll engine — converts vertical wheel to horizontal,
// smooth scroll with RAF, auto-snap, nav sync, keyboard navigation.

let container: HTMLElement | null = null;
let currentScroll = 0;
let targetScroll = 0;
let isScrolling = false;
let snapTimeout: ReturnType<typeof setTimeout> | null = null;
let scrollDirection = 0;
const SCROLL_SPEED = 3;
const SNAP_DELAY = 250;
const SNAP_THRESHOLD = 0.3;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function animate(): void {
  if (!container) return;
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

function startScroll(): void {
  if (!isScrolling) {
    isScrolling = true;
    requestAnimationFrame(animate);
  }
}

export function scrollToTarget(target: number): void {
  if (!container) return;
  targetScroll = Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth));
  startScroll();
}

function snapToNearest(): void {
  if (!container) return;
  const panels = document.querySelectorAll<HTMLElement>('.panel');
  const viewCenter = container.scrollLeft + container.clientWidth / 2;
  let nearest = panels[0];
  let minDist = Infinity;

  panels.forEach((panel) => {
    const panelCenter = panel.offsetLeft + panel.offsetWidth / 2;
    const dist = Math.abs(panelCenter - viewCenter);
    if (dist < minDist) {
      minDist = dist;
      nearest = panel;
    }
  });

  if (!nearest) return;
  const panelWidth = nearest.offsetWidth;
  if (minDist < panelWidth * SNAP_THRESHOLD || !isScrolling) {
    scrollToTarget(nearest.offsetLeft);
  }
}

export function initHorizontalScroll(): void {
  container = document.getElementById('scrollContainer');
  if (!container) return;

  currentScroll = container.scrollLeft;
  targetScroll = container.scrollLeft;

  // Convert vertical wheel to horizontal scroll
  container.addEventListener('wheel', (e: WheelEvent) => {
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest(
      '.scroll-container-y, .reading-body, .reading-inner, .archive-list, .posts-grid'
    );

    if (scrollableParent) {
      const el = scrollableParent as HTMLElement;
      const canScrollVertically = el.scrollHeight > el.clientHeight;
      const isVerticalDominant = Math.abs(e.deltaY) > Math.abs(e.deltaX);

      if (canScrollVertically && isVerticalDominant) {
        const scrollTop = el.scrollTop;
        const scrollBottom = scrollTop + el.clientHeight;
        const atTop = scrollTop <= 1;
        const atBottom = scrollBottom >= el.scrollHeight - 1;

        if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
          // Fall through to horizontal
        } else {
          return; // Allow vertical scroll
        }
      }
    }

    e.preventDefault();
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

    const prevScroll = container!.scrollLeft;
    targetScroll += delta * SCROLL_SPEED;
    scrollDirection = targetScroll > prevScroll ? 1 : -1;

    startScroll();

    if (snapTimeout) clearTimeout(snapTimeout);
    snapTimeout = setTimeout(snapToNearest, SNAP_DELAY);
  }, { passive: false });

  // Scroll progress bar + nav sync
  container.addEventListener('scroll', () => {
    if (!container) return;

    const progressBar = document.getElementById('scrollProgressBar');
    if (progressBar) {
      const max = container.scrollWidth - container.clientWidth;
      progressBar.style.width = max > 0 ? (container.scrollLeft / max * 100) + '%' : '0%';
    }

    const panels = document.querySelectorAll<HTMLElement>('.panel');
    const dots = document.querySelectorAll<HTMLElement>('.nav-dot');
    const center = container.scrollLeft + container.clientWidth / 2;

    panels.forEach((panel, i) => {
      if (center >= panel.offsetLeft && center < panel.offsetLeft + panel.offsetWidth) {
        dots.forEach((d) => d.classList.remove('active'));
        if (dots[i]) dots[i].classList.add('active');
      }
    });
  });

  // Nav dot clicks
  document.querySelectorAll<HTMLAnchorElement>('.nav-dot').forEach((dot) => {
    dot.addEventListener('click', (e: Event) => {
      e.preventDefault();
      const href = dot.getAttribute('href');
      if (!href) return;
      const target = document.getElementById(href.slice(1));
      if (target) {
        scrollToTarget(target.offsetLeft);
      }
    });
  });

  // Arrow click
  const arrow = document.querySelector<HTMLElement>('.scroll-arrow');
  if (arrow) {
    arrow.addEventListener('click', () => {
      scrollToTarget(container!.scrollLeft + container!.clientWidth);
    });
  }

  // Expose globally for keyboard nav and game check
  (window as Record<string, unknown>).scrollToTarget = scrollToTarget;

  // Keyboard
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const isGameActive = (window as Record<string, unknown>).isGameActive as (() => boolean) | undefined;
    if (isGameActive && isGameActive()) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToTarget(container!.scrollLeft + container!.clientWidth);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToTarget(container!.scrollLeft - container!.clientWidth);
    }
  });
}
