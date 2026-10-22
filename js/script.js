/* ============================================================
   BETOX — INTERACTION SCRIPT
   1. Infinite marquee mosaic generator
   2. Scroll-triggered reveal animations
   3. Portfolio tab filter
   4. Animated stat counters
   5. Custom cursor dot
   6. Misc (year, video autoplay on hover)
============================================================= */
function cargarVideo(elemento) {
  const wrapper = elemento.closest('.video-embed, .video-embed-short');
  const videoId = wrapper.getAttribute('data-video-id');
  wrapper.innerHTML = `
    <iframe 
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1" 
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen>
    </iframe>`;
}
document.addEventListener('DOMContentLoaded', () => {
  buildMarquees();
  initReveals();
  initPortfolioTabs();
  initCounters();
  initCursor();
  initVideoHover();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ----------------------------------------------------------
   1. MARQUEE MOSAIC GENERATOR
   Fills every [data-marquee] container with a repeating word,
   duplicating the full set once so translate(-50%) loops with
   no visible seam. Recalculated on resize.
---------------------------------------------------------- */
function buildMarquees() {
  const containers = document.querySelectorAll('[data-marquee]');

  containers.forEach((container) => {
    populateMarquee(container);
  });

  // Rebuild on resize (debounced) so density stays correct at new widths
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      containers.forEach((container) => populateMarquee(container));
    }, 200);
  });
}

function populateMarquee(container) {
  const word = container.dataset.marqueeWord || 'BETOX';
  const isVertical = container.dataset.marqueeDir === 'up' || container.dataset.marqueeDir === 'down';

  container.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'marquee-track';
  if (isVertical) track.style.flexDirection = 'column';
  container.appendChild(track);

  // Build one "set" of words long enough to cover the container twice over,
  // then duplicate that whole set once. This guarantees a seamless loop
  // regardless of viewport size or word length.
  const targetSize = isVertical
    ? Math.max(window.innerHeight, 600) * 2
    : Math.max(window.innerWidth, 600) * 2;

  const buildSet = () => {
    const set = document.createElement('div');
    set.style.display = 'flex';
    set.style.flexDirection = isVertical ? 'column' : 'row';
    set.style.flexShrink = '0';

    let size = 0;
    let guard = 0;
    while (size < targetSize && guard < 400) {
      const span = document.createElement('span');
      span.textContent = word;
      set.appendChild(span);
      // Rough estimate per item; real measurement happens after append
      size += isVertical ? 60 : word.length * 22 + 40;
      guard++;
    }
    return set;
  };

  const setA = buildSet();
  const setB = buildSet();
  track.style.display = 'flex';
  track.style.flexDirection = isVertical ? 'column' : 'row';
  track.appendChild(setA);
  track.appendChild(setB);
}

/* ----------------------------------------------------------
   2. SCROLL-TRIGGERED REVEALS
   Every [data-reveal] element starts hidden (see CSS) and gets
   .is-visible when it enters the viewport. data-reveal-delay
   staggers siblings via the --reveal-delay custom property.
---------------------------------------------------------- */
function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');

  els.forEach((el) => {
    const delay = el.dataset.revealDelay || 0;
    el.style.setProperty('--reveal-delay', delay);
  });

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  els.forEach((el) => observer.observe(el));
}

/* ----------------------------------------------------------
   3. PORTFOLIO TAB FILTER
   Toggles between the "long-form" and "shorts" grids and
   re-triggers reveal animations for the newly shown group.
---------------------------------------------------------- */
function initPortfolioTabs() {
  const tabs = document.querySelectorAll('.portfolio-tab');
  const groups = document.querySelectorAll('[data-portfolio-group]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.filter;

      tabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      groups.forEach((group) => {
        const isMatch = group.dataset.portfolioGroup === target;
        group.hidden = !isMatch;
        if (isMatch) {
          group.querySelectorAll('[data-reveal]').forEach((el, i) => {
            el.classList.remove('is-visible');
            // Re-reveal on next frame so the transition replays
            requestAnimationFrame(() => {
              setTimeout(() => el.classList.add('is-visible'), i * 40);
            });
          });
        }
      });
    });
  });
}

/* ----------------------------------------------------------
   4. ANIMATED STAT COUNTERS
   Counts up to data-count-to once the element enters view.
---------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.countTo, 10) || 0;
    const suffix = el.dataset.countSuffix || '';

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ----------------------------------------------------------
   5. CUSTOM CURSOR DOT (desktop only, decorative)
---------------------------------------------------------- */
function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  if (!dot || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  window.addEventListener('mousemove', (e) => {
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });

  document.querySelectorAll('a, button, .project').forEach((el) => {
    el.addEventListener('mouseenter', () => dot.style.transform += ' scale(2.2)');
    el.addEventListener('mouseleave', () => {
      dot.style.transform = dot.style.transform.replace(' scale(2.2)', '');
    });
  });
}

/* ----------------------------------------------------------
   6. VIDEO HOVER PLAYBACK
   Project preview videos only play while hovered/focused,
   keeping the grid lightweight until the user shows intent.
---------------------------------------------------------- */
function initVideoHover() {
  document.querySelectorAll('.project').forEach((project) => {
    const video = project.querySelector('video');
    if (!video) return;

    project.addEventListener('mouseenter', () => {
      video.play().catch(() => {});
    });
    project.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });
}
