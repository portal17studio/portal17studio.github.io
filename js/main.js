// Portal17 Studio marketing site — vanilla JS, no build step, no dependencies.
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

/* ---------------- hero node network ----------------
   A canvas of drifting nodes wired together, with pulses running along the
   links — the same idea the product is built on. Decorative: hidden from
   assistive tech, skipped entirely when motion is reduced, and paused when
   it scrolls out of view or the tab goes to the background. */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || REDUCED_MOTION) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0, height = 0, dpr = 1;
  let nodes = [];
  let links = [];
  let pulses = [];
  let raf = null;
  let visible = true;

  const NODE_COUNT_BASE = 26;
  const LINK_DISTANCE = 168;

  function build() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // fewer nodes on small screens: same look, far less work per frame
    const count = Math.round(NODE_COUNT_BASE * Math.min(1, width / 1100) + 8);
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      r: 1.1 + Math.random() * 1.9,
    }));
    pulses = [];
  }

  function computeLinks() {
    links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DISTANCE) links.push({ a: i, b: j, d });
      }
    }
  }

  function spawnPulse() {
    if (links.length === 0 || pulses.length > 5) return;
    const link = links[Math.floor(Math.random() * links.length)];
    pulses.push({ a: link.a, b: link.b, t: 0, speed: 0.004 + Math.random() * 0.006 });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });

    computeLinks();

    ctx.lineWidth = 1;
    links.forEach(l => {
      const alpha = (1 - l.d / LINK_DISTANCE) * 0.3;
      ctx.strokeStyle = `rgba(140, 160, 220, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(nodes[l.a].x, nodes[l.a].y);
      ctx.lineTo(nodes[l.b].x, nodes[l.b].y);
      ctx.stroke();
    });

    nodes.forEach(n => {
      ctx.fillStyle = 'rgba(180, 195, 245, 0.45)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });

    pulses = pulses.filter(p => p.t <= 1);
    pulses.forEach(p => {
      p.t += p.speed;
      const a = nodes[p.a], b = nodes[p.b];
      if (!a || !b) { p.t = 2; return; }
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;
      const fade = Math.sin(Math.min(1, p.t) * Math.PI);
      ctx.fillStyle = `rgba(255, 150, 70, ${(0.85 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 150, 70, ${(0.16 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    if (Math.random() < 0.03) spawnPulse();

    raf = requestAnimationFrame(draw);
  }

  function start() {
    if (raf === null && visible && !document.hidden) raf = requestAnimationFrame(draw);
  }
  function stop() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }

  build();
  start();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); }, 180);
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
