// Portal17 Studio marketing site â€” vanilla JS, no build step, no dependencies.
//
// Everything here is progressive enhancement: the pages are complete and
// readable without a single line of it. Anything decorative also checks
// prefers-reduced-motion before it starts moving.

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- footer year ----------------
   Optional chaining matters here: sandbox.html has no #year, and this used
   to throw on that page and take every listener below down with it. */
(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* ---------------- decorative layers ----------------
   Injected rather than repeated in every page's markup. */
(() => {
  if (!document.querySelector('.grain')) {
    const grain = document.createElement('div');
    grain.className = 'grain';
    grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);
  }

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span></span>';
  document.body.appendChild(bar);
  const fill = bar.firstElementChild;

  const toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.textContent = '↑';
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  });
  document.body.appendChild(toTop);

  const nav = document.querySelector('.site-nav');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      fill.style.setProperty('--progress', pct.toFixed(2) + '%');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
      toTop.classList.toggle('show', window.scrollY > window.innerHeight);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------------- mobile nav ---------------- */
(() => {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
})();

/* ---------------- scroll reveal ----------------
   Siblings inside the same grid get an incrementing --i so a row of cards
   arrives as a wave instead of all at once. */
(() => {
  const items = document.querySelectorAll('.reveal');
  if (items.length === 0) return;

  const groups = new Map();
  items.forEach(el => {
    const parent = el.parentElement;
    const n = groups.get(parent) || 0;
    el.style.setProperty('--i', String(Math.min(n, 8)));
    groups.set(parent, n + 1);
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));

  // Safety net: content must never stay invisible just because a browser
  // quirk (throttled rAF in a background/inactive tab, an extension, etc.)
  // delayed or dropped intersection callbacks.
  window.addEventListener('load', () => {
    setTimeout(() => {
      items.forEach(el => el.classList.add('in-view'));
    }, 2500);
  });
})();

/* ---------------- pointer spotlight on panels ----------------
   Writes the cursor position into --mx/--my; the glow itself is pure CSS. */
(() => {
  const cards = document.querySelectorAll('.feature-card, .video-card, .pg-panel, .download-panel, .sbx-card');
  if (cards.length === 0 || !window.matchMedia('(hover: hover)').matches) return;

  cards.forEach(card => {
    let queued = false;
    card.addEventListener('pointermove', (e) => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        queued = false;
      });
    });
  });
})();

/* ---------------- stat counters ---------------- */
(() => {
  const nums = document.querySelectorAll('[data-count]');
  if (nums.length === 0) return;

  function run(el) {
    const target = Number(el.dataset.count);
    if (!isFinite(target)) return;
    if (REDUCED_MOTION) { el.textContent = String(target); return; }

    const duration = 1100;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (!('IntersectionObserver' in window)) {
    nums.forEach(run);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  nums.forEach(el => io.observe(el));
})();

/* ---------------- node marquee ----------------
   The CSS loop translates the track by exactly -50%, which only lines up
   seamlessly if the track holds the chip list twice. */
(() => {
  const track = document.querySelector('.node-marquee-track');
  if (!track || track.children.length === 0) return;
  track.innerHTML += track.innerHTML;
  track.querySelectorAll(':scope > *').forEach((el, i, all) => {
    if (i >= all.length / 2) el.setAttribute('aria-hidden', 'true');
  });
})();

/* ---------------- nav scrollspy ---------------- */
(() => {
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (links.length === 0 || !('IntersectionObserver' in window)) return;

  const sections = links
    .map(a => ({ link: a, el: document.querySelector(a.getAttribute('href')) }))
    .filter(s => s.el);
  if (sections.length === 0) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const match = sections.find(s => s.el === entry.target);
      links.forEach(l => l.classList.toggle('active', l === match?.link));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(s => io.observe(s.el));
})();

/* ---------------- hero flow canvas ----------------
   Not a generic particle field: this is an actual automation flow — the
   same shape you would build in the app — laid out around the headline and
   executed on a loop. Nodes light up in order, energy travels the wires
   between them, and the whole graph drifts with the pointer.

   Decorative, so: hidden from assistive tech, skipped entirely when motion
   is reduced, and paused when it scrolls out of view or the tab is hidden. */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || REDUCED_MOTION) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* Positions are fractions of the hero box and deliberately hug its edges:
     the headline sits in the middle and must stay the thing you read. */
  const NODES = [
    { x: 0.085, y: 0.20, label: 'Start',       color: '#4e9e4e' },
    { x: 0.180, y: 0.45, label: 'Navigate',    color: '#4a86d8' },
    { x: 0.095, y: 0.70, label: 'Type',        color: '#d06a55' },
    { x: 0.255, y: 0.95, label: 'Click',       color: '#e08640' }, 
    { x: 0.730, y: 0.95, label: 'Select',      color: '#c9a227' },
    { x: 0.905, y: 0.68, label: 'Extract Text',color: '#9a5fb0' },
    { x: 0.815, y: 0.42, label: 'Split',   color: '#3f9d9d' },
    { x: 0.915, y: 0.17, label: 'Export CSV',  color: '#5f7fd0' },
  ];
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]];
  const CHAIN = EDGES.length;

  const STEP_MS = 900;      // time the runner spends on one wire
  const REST_MS = 1400;     // pause before the flow starts over
  const GLOW_MS = 1100;     // how long a node stays lit after it fires

  let width = 0, height = 0, dpr = 1;
  let points = [];
  let raf = null;
  let visible = true;
  let showLabels = true;
  let startedAt = 0;
  const litAt = new Array(NODES.length).fill(-Infinity);

  // pointer parallax, eased towards the real position every frame
  let targetPx = 0, targetPy = 0, px = 0, py = 0;
  // raw pointer position in hero coordinates, for the proximity glow
  const pointer = { x: -1e4, y: -1e4 };
  const REACH = 190;

  /* 0 → 1 as the pointer closes in on a node. The graph is drawn through a
     translate() for the parallax, so the node's on-screen position is its
     laid-out position plus that offset. */
  function nearness(p) {
    const dx = pointer.x - (p.x + px);
    const dy = pointer.y - (p.y + py);
    const d = Math.hypot(dx, dy);
    return d > REACH ? 0 : Math.pow(1 - d / REACH, 1.6);
  }

  function layout() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.font = '600 11.5px ui-sans-serif, system-ui, "Segoe UI", sans-serif';
    const box = keepOut();

    /* Labels are only worth showing if the margins beside the reserved
       block are wide enough to hold the widest chip. Otherwise every chip
       gets pushed above or below the copy and the flow collapses into two
       cramped rows — dots read far better at that size. */
    const widest = Math.max(...NODES.map(n => ctx.measureText(n.label).width)) + 34;
    const band = box ? Math.min(box.left, width - box.right) : width;
    showLabels = width > 760 && band > widest + 6;

    points = NODES.map(n => {
      const w = showLabels ? Math.round(ctx.measureText(n.label).width) + 34 : 18;
      return { x: n.x * width, y: n.y * height, w, h: showLabels ? 26 : 18 };
    });

    if (box) points.forEach(p => avoid(p, box));
  }

  /* The headline, buttons and stat pills own the middle of the hero. Their
     real bounding box is measured rather than assumed, because it changes
     with the viewport, the font and the length of the copy — fixed node
     coordinates ended up with chips sitting underneath the pills. */
  function keepOut() {
    const content = hero.querySelector('.container');
    if (!content) return null;
    const hr = hero.getBoundingClientRect();

    /* The union of the actual blocks, not the container's box: the column is
       1160px wide but the widest thing in it (the stat pills) is far
       narrower, and reserving the full column left no usable margin to put
       chips in — they all got shoved into two cramped rows. */
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    content.querySelectorAll(':scope > *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      left = Math.min(left, r.left);
      right = Math.max(right, r.right);
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    });
    if (!isFinite(left)) return null;

    const padX = 26, padY = 18;
    return {
      left: left - hr.left - padX,
      right: right - hr.left + padX,
      top: top - hr.top - padY,
      bottom: bottom - hr.top + padY,
    };
  }

  /* Slide a chip out of the reserved box by the shortest move that still
     leaves it fully on the canvas. */
  function avoid(p, box) {
    const hw = p.w / 2, hh = p.h / 2;
    const overlaps = p.x + hw > box.left && p.x - hw < box.right &&
                     p.y + hh > box.top && p.y - hh < box.bottom;
    if (!overlaps) return;

    const moves = [
      { d: (p.x + hw) - box.left, x: p.x - ((p.x + hw) - box.left), y: p.y },
      { d: box.right - (p.x - hw), x: p.x + (box.right - (p.x - hw)), y: p.y },
      { d: (p.y + hh) - box.top, x: p.x, y: p.y - ((p.y + hh) - box.top) },
      { d: box.bottom - (p.y - hh), x: p.x, y: p.y + (box.bottom - (p.y - hh)) },
    ].filter(m =>
      m.x - hw > 4 && m.x + hw < width - 4 &&
      m.y - hh > 4 && m.y + hh < height - 4
    ).sort((a, b) => a.d - b.d);

    if (moves.length) { p.x = moves[0].x; p.y = moves[0].y; }
  }

  /* A wire leaves a node sideways and arrives sideways, like the real
     canvas does, so the curve never cuts through a chip. */
  function wire(a, b) {
    const dx = Math.abs(b.x - a.x);
    const bend = Math.max(40, Math.min(dx * 0.55, 130));
    const dir = b.x >= a.x ? 1 : -1;
    return {
      x1: a.x, y1: a.y,
      cx1: a.x + bend * dir, cy1: a.y,
      cx2: b.x - bend * dir, cy2: b.y,
      x2: b.x, y2: b.y,
    };
  }

  function pointOn(w, t) {
    const u = 1 - t;
    return {
      x: u * u * u * w.x1 + 3 * u * u * t * w.cx1 + 3 * u * t * t * w.cx2 + t * t * t * w.x2,
      y: u * u * u * w.y1 + 3 * u * u * t * w.cy1 + 3 * u * t * t * w.cy2 + t * t * t * w.y2,
    };
  }

  function strokeWire(w, style, lineWidth) {
    ctx.strokeStyle = style;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(w.x1, w.y1);
    ctx.bezierCurveTo(w.cx1, w.cy1, w.cx2, w.cy2, w.x2, w.y2);
    ctx.stroke();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawNode(i, now) {
    const p = points[i];
    const n = NODES[i];
    // whichever is stronger: the running flow, or the visitor's pointer
    const heat = Math.max(
      Math.max(0, 1 - (now - litAt[i]) / GLOW_MS),
      nearness(p) * 0.85
    );
    const x = p.x - p.w / 2;
    const y = p.y - p.h / 2;

    if (heat > 0) {
      ctx.save();
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 26 * heat;
      roundRect(x, y, p.w, p.h, 8);
      ctx.fillStyle = 'rgba(18, 22, 38, 0.96)';
      ctx.fill();
      ctx.restore();
    } else {
      roundRect(x, y, p.w, p.h, 8);
      ctx.fillStyle = 'rgba(16, 19, 32, 0.9)';
      ctx.fill();
    }

    roundRect(x, y, p.w, p.h, 8);
    ctx.strokeStyle = heat > 0
      ? `rgba(255, 255, 255, ${(0.14 + 0.5 * heat).toFixed(3)})`
      : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // the coloured port dot every node carries in the real canvas
    ctx.fillStyle = n.color;
    ctx.globalAlpha = 0.55 + 0.45 * heat;
    ctx.beginPath();
    ctx.arc(showLabels ? x + 13 : p.x, p.y, showLabels ? 4 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (showLabels) {
      ctx.fillStyle = heat > 0 ? 'rgba(240, 243, 250, 0.95)' : 'rgba(174, 178, 198, 0.65)';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.label, x + 24, p.y + 0.5);
    }
  }

  function draw(now) {
    if (!startedAt) startedAt = now;

    px += (targetPx - px) * 0.06;
    py += (targetPy - py) * 0.06;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(px, py);

    // where the runner is along the chain right now
    const cycle = CHAIN * STEP_MS + REST_MS;
    const elapsed = (now - startedAt) % cycle;
    const walking = elapsed < CHAIN * STEP_MS;
    const edgeIndex = walking ? Math.floor(elapsed / STEP_MS) : -1;
    const edgeT = walking ? (elapsed % STEP_MS) / STEP_MS : 0;

    if (walking) {
      // light the node the runner just left, and the one it arrives at
      litAt[EDGES[edgeIndex][0]] = Math.max(litAt[EDGES[edgeIndex][0]], now - GLOW_MS * 0.35);
      if (edgeT > 0.94) litAt[EDGES[edgeIndex][1]] = now;
    }

    const wires = EDGES.map(([a, b]) => wire(points[a], points[b]));

    wires.forEach((w, i) => {
      const active = i === edgeIndex;
      if (active) {
        strokeWire(w, 'rgba(79, 214, 232, 0.6)', 1.7);
        return;
      }
      // a wire brightens when either of the nodes it joins is under the cursor
      const near = Math.max(nearness(points[EDGES[i][0]]), nearness(points[EDGES[i][1]]));
      strokeWire(w, `rgba(130, 150, 215, ${(0.24 + 0.5 * near).toFixed(3)})`, 1 + near * 0.6);
    });

    if (walking) {
      const w = wires[edgeIndex];
      // a short comet rather than a dot: reads as flow, not as a bug crawling
      for (let k = 0; k < 7; k++) {
        const t = Math.max(0, edgeT - k * 0.035);
        const p = pointOn(w, t);
        const fade = (1 - k / 7) * (0.85 - 0.55 * Math.abs(0.5 - edgeT));
        ctx.fillStyle = `rgba(255, 168, 74, ${(0.5 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6 - k * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      const head = pointOn(w, edgeT);
      ctx.save();
      ctx.shadowColor = 'rgba(255, 168, 74, 0.9)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(255, 220, 170, 0.95)';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < points.length; i++) drawNode(i, now);

    ctx.restore();
    raf = requestAnimationFrame(draw);
  }

  function start() {
    if (raf === null && visible && !document.hidden) raf = requestAnimationFrame(draw);
  }
  function stop() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }

  layout();
  start();

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    targetPx = (pointer.x / r.width - 0.5) * 26;
    targetPy = (pointer.y / r.height - 0.5) * 18;
  });
  hero.addEventListener('pointerleave', () => {
    targetPx = 0;
    targetPy = 0;
    pointer.x = pointer.y = -1e4;
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 180);
  });

  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0 }).observe(hero);
  }
})();

/* ---------------- FAQ accordion ---------------- */
(() => {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* ---------------- video modal ---------------- */
(() => {
  const modal = document.getElementById('videoModal');
  const body = document.getElementById('videoModalBody');
  const title = document.getElementById('videoModalTitle');
  const closeBtn = document.getElementById('videoModalClose');
  if (!modal) return;

  function openModal(src, label) {
    title.textContent = label || 'Demo';
    body.innerHTML = '';

    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.src = src;

    const fallback = document.createElement('div');
    fallback.className = 'video-fallback';
    fallback.innerHTML = '<strong>🎬 This demo video is coming soon</strong><span>We\'re still recording it — check back shortly, or follow along in the Playground above.</span>';
    fallback.style.display = 'none';

    video.addEventListener('error', () => {
      video.style.display = 'none';
      fallback.style.display = 'flex';
    });

    body.appendChild(video);
    body.appendChild(fallback);
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    body.innerHTML = '';
  }

  document.querySelectorAll('.video-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => openModal(thumb.dataset.video, thumb.dataset.title));
  });
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();

/* ---------------- video thumbnails ----------------
   Not every browser honours the #t= media fragment with preload="metadata",
   so park each preview on a representative frame by hand. If the file is
   missing the element is dropped and the .vthumb-* gradient shows through. */
(() => {
  document.querySelectorAll('.video-thumb-media').forEach(v => {
    const at = parseFloat(v.dataset.frame || '9');

    v.addEventListener('loadedmetadata', () => {
      if (v.currentTime < 0.05 && isFinite(v.duration)) {
        v.currentTime = Math.min(at, Math.max(0, v.duration - 0.1));
      }
    }, { once: true });

    v.addEventListener('error', () => v.remove(), { once: true });
  });
})();

/* ---------------- playground ---------------- */
(() => {
  const runBtn = document.getElementById('pgRun');
  const resetBtn = document.getElementById('pgReset');
  if (!runBtn) return;

  const canvas = document.getElementById('pgCanvas');
  const nodes = Array.from(canvas.querySelectorAll('.pg-node'));
  const wires = Array.from(canvas.querySelectorAll('.pg-wire'));
  const consoleBody = document.getElementById('pgConsoleBody');
  const varsBox = document.getElementById('pgVars');

  const nameEl = document.getElementById('pgName');
  const emailEl = document.getElementById('pgEmail');
  const topicEl = document.getElementById('pgTopic');
  const messageEl = document.getElementById('pgMessage');
  const submitEl = document.getElementById('pgSubmit');
  const confirmationEl = document.getElementById('pgConfirmation');

  const DATA = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    topic: 'Support',
    message: "Just checking if Portal17 Studio can fill this out on its own. Loving the demo!",
  };

  let running = false;
  let cancelled = false;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function log(text) {
    const stale = consoleBody.querySelector('.muted');
    if (stale) stale.remove();
    const p = document.createElement('p');
    p.className = 'pg-console-line-enter';
    p.textContent = text;
    consoleBody.appendChild(p);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function setActiveNode(step) {
    nodes.forEach(n => {
      const s = Number(n.dataset.step);
      n.classList.toggle('active', s === step);
      if (s < step) n.classList.add('done');
    });
    wires.forEach((w, i) => w.classList.toggle('flowing', i < step - 1));

    // Keep the running node in view on phones, where the chain is a
    // sideways scroller rather than a full-width row.
    const current = nodes.find(n => Number(n.dataset.step) === step);
    if (current && canvas.scrollWidth > canvas.clientWidth) {
      canvas.scrollTo({
        left: current.offsetLeft - canvas.clientWidth / 2 + current.offsetWidth / 2,
        behavior: REDUCED_MOTION ? 'auto' : 'smooth',
      });
    }
  }

  async function typeInto(el, text) {
    el.classList.add('pg-focus');
    el.value = '';
    for (const ch of text) {
      if (cancelled) return;
      el.value += ch;
      await sleep(16);
    }
    await sleep(150);
    el.classList.remove('pg-focus');
  }

  async function selectOption(el, text) {
    el.classList.add('pg-focus');
    await sleep(220);
    el.value = text;
    await sleep(200);
    el.classList.remove('pg-focus');
  }

  function addVar(name, value) {
    const chip = document.createElement('span');
    chip.className = 'pg-var-chip';
    chip.innerHTML = `<b>${name}</b> = "${value}"`;
    varsBox.appendChild(chip);
  }

  function resetAll() {
    cancelled = true;
    running = false;
    nodes.forEach(n => n.classList.remove('active', 'done'));
    wires.forEach(w => w.classList.remove('flowing'));
    [nameEl, emailEl, messageEl].forEach(el => { el.value = ''; el.classList.remove('pg-focus'); });
    topicEl.selectedIndex = 0;
    topicEl.classList.remove('pg-focus');
    submitEl.classList.remove('pg-pressed');
    confirmationEl.classList.remove('show', 'flash');
    confirmationEl.textContent = '';
    varsBox.innerHTML = '';
    consoleBody.innerHTML = '<p class="muted">Click "Run Flow" to start…</p>';
    runBtn.disabled = false;
    runBtn.textContent = '▶ Run Flow';
  }

  async function runFlow() {
    if (running) return;
    resetAll();
    cancelled = false;
    running = true;
    runBtn.disabled = true;
    runBtn.textContent = 'Running…';
    consoleBody.innerHTML = '';

    const start = performance.now();

    setActiveNode(1);
    log('🚀 Flow started.');
    await sleep(500);
    if (cancelled) return;

    setActiveNode(2);
    log('🌐 Opening https://example-shop.test/contact …');
    await sleep(500);
    log('✅ Page loaded.');
    await sleep(350);
    if (cancelled) return;

    setActiveNode(3);
    log(`⌨️ Typing "${DATA.name}" into Name …`);
    await typeInto(nameEl, DATA.name);
    if (cancelled) return;

    setActiveNode(4);
    log(`⌨️ Typing "${DATA.email}" into Email …`);
    await typeInto(emailEl, DATA.email);
    if (cancelled) return;

    setActiveNode(5);
    log(`🧾 Selecting "${DATA.topic}" in Topic …`);
    await selectOption(topicEl, DATA.topic);
    if (cancelled) return;

    setActiveNode(6);
    log('⌨️ Typing the message …');
    await typeInto(messageEl, DATA.message);
    if (cancelled) return;

    setActiveNode(7);
    log('🖱️ Clicking "Send message" …');
    await sleep(300);
    submitEl.classList.add('pg-pressed');
    await sleep(160);
    submitEl.classList.remove('pg-pressed');
    confirmationEl.textContent = "✅ Thanks, Ada! We'll reply within 24 hours. Ticket #A17-4821.";
    confirmationEl.classList.add('show');
    await sleep(450);
    log('✅ Form submitted.');
    if (cancelled) return;

    // A single Extract Text node reads ONE value into ONE variable — same as the
    // real app (chain one Extract Text per piece of data you want to capture).
    setActiveNode(8);
    await sleep(300);
    confirmationEl.classList.add('flash');
    log('🧠 Extract Text — reading the ticket number …');
    await sleep(500);
    confirmationEl.classList.remove('flash');
    addVar('ticket_id', 'A17-4821');
    log('💾 Saved to variable: ticket_id.');

    nodes.forEach(n => n.classList.remove('active'));
    nodes.forEach(n => n.classList.add('done'));
    wires.forEach(w => w.classList.add('flowing'));

    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    log(`🎉 Flow finished in ${elapsed}s.`);

    running = false;
    runBtn.disabled = false;
    runBtn.textContent = '▶ Run Flow Again';
  }

  runBtn.addEventListener('click', runFlow);
  resetBtn.addEventListener('click', resetAll);
})();
