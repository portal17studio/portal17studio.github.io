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
  toggle.setAttribute('aria-controls', 'mobileMenu');
  toggle.setAttribute('aria-expanded', 'false');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 881px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
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

/* ---------------- FAQ accordion ---------------- */
(() => {
  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    const answer = item.querySelector('.faq-a');
    if (answer) {
      answer.id = 'faq-answer-' + index;
      answer.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-controls', answer.id);
    }
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        i.querySelector('.faq-a')?.setAttribute('aria-hidden', 'true');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer?.setAttribute('aria-hidden', 'false');
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

  let previousFocus;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'videoModalTitle');
  function openModal(src, label) {
    previousFocus = document.activeElement;
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
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    body.innerHTML = '';
    document.body.style.overflow = '';
    previousFocus?.focus();
  }

  document.querySelectorAll('.video-thumb').forEach(thumb => {
    if (!thumb.querySelector('.video-thumb-media')) {
      thumb.classList.add('unavailable');
      thumb.querySelector('.play-btn')?.setAttribute('disabled', '');
      return;
    }
    thumb.addEventListener('click', () => openModal(thumb.dataset.video, thumb.dataset.title));
  });
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const targets = [...modal.querySelectorAll('button:not([disabled]), video[controls]')];
      const first = targets[0], last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
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

/* ---------------- recorder demo ----------------
   A cursor works through a web page and a Windows program; each action
   "records" the next node of the list on the right. Loops while the demo
   is on screen. Without this script (or with reduced motion) the finished
   flow is simply shown. */
(() => {
  const demo = document.getElementById('recDemo');
  if (!demo || REDUCED_MOTION) return;
  const stage = document.getElementById('recStage');
  const cursor = document.getElementById('recCursor');
  const keys = document.getElementById('recKeys');
  const count = document.getElementById('recCount');
  const nodes = Array.from(demo.querySelectorAll('.rec-node'));
  const $ = (k) => stage.querySelector('[data-rec="' + k + '"]');
  const web = stage.querySelector('.rec-web'), app = stage.querySelector('.rec-app');
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let running = false, visible = false, runId = 0;

  function moveTo(el, dx = 0.5, dy = 0.5) {
    const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    const x = r.left - s.left + r.width * dx, y = r.top - s.top + r.height * dy;
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }
  async function click() {
    cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click');
    await sleep(260);
  }
  function showKeys(text) {
    keys.textContent = text; keys.classList.add('show');
  }
  function hideKeys() { keys.classList.remove('show'); }
  async function type(el, text, id) {
    const t = el.querySelector('.rec-text');
    for (const ch of text) {
      if (id !== runId) return;
      t.textContent += ch;
      await sleep(70 + Math.random() * 60);
    }
  }
  let n = 0;
  function record() {
    const node = nodes[n++];
    if (!node) return;
    nodes.forEach(x => x.classList.remove('fresh'));
    node.classList.add('in', 'fresh');
    count.textContent = n;
  }
  function focusWin(w) {
    web.classList.toggle('focus', w === web);
    app.classList.toggle('focus', w === app);
  }
  function reset() {
    n = 0; count.textContent = '0';
    nodes.forEach(x => x.classList.remove('in', 'fresh'));
    stage.querySelectorAll('.rec-input .rec-text').forEach(t => t.textContent = '');
    stage.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
    $('result').classList.remove('show');
    $('orderid').classList.remove('selected');
    $('combo').querySelector('.rec-text').textContent = 'Normal';
    $('check').classList.remove('on');
    hideKeys(); focusWin(null);
  }

  async function play(id) {
    const alive = () => id === runId && visible;
    reset();
    await sleep(500); if (!alive()) return;
    // --- web page ---
    focusWin(web);
    moveTo($('search'), 0.2); await sleep(800); await click(); if (!alive()) return;
    $('search').classList.add('active'); record(); await sleep(250);
    await type($('search'), 'ORD-1042', id); if (!alive()) return;
    record(); await sleep(300);
    showKeys('Enter'); await sleep(450); hideKeys();
    $('search').classList.remove('active'); $('result').classList.add('show'); record();
    await sleep(700); if (!alive()) return;
    moveTo($('orderid'), 0.9); await sleep(800);
    $('orderid').classList.add('selected'); await sleep(300);
    showKeys('Ctrl+C'); await sleep(500); hideKeys(); record();
    await sleep(500); if (!alive()) return;
    // --- Windows program ---
    focusWin(app);
    moveTo($('appfield'), 0.2); await sleep(850); await click(); if (!alive()) return;
    $('appfield').classList.add('active'); record(); await sleep(300);
    showKeys('Ctrl+V'); await sleep(350);
    $('appfield').querySelector('.rec-text').textContent = 'ORD-1042'; hideKeys(); await sleep(300);
    $('appfield').classList.remove('active'); record(); await sleep(450); if (!alive()) return;
    moveTo($('combo'), 0.8); await sleep(800); await click();
    $('combo').classList.add('active'); await sleep(350);
    $('combo').querySelector('.rec-text').textContent = 'High'; await sleep(250);
    $('combo').classList.remove('active'); record(); await sleep(450); if (!alive()) return;
    moveTo($('check'), 0.1); await sleep(750); await click();
    $('check').classList.add('on'); record(); await sleep(450); if (!alive()) return;
    moveTo($('save'), 0.5); await sleep(800); await click();
    $('save').classList.add('pressed'); await sleep(160); $('save').classList.remove('pressed');
    record(); focusWin(null);
    await sleep(3200);
  }

  async function loop() {
    if (running) return;
    running = true;
    demo.classList.add('animating');
    while (visible) {
      const id = ++runId;
      await play(id);
      if (id !== runId) break;
    }
    running = false;
    if (visible) loop();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) loop(); else {
        runId++;
        nodes.forEach(node => node.classList.add('in'));
        count.textContent = nodes.length;
      }
    }, { threshold: 0.15 }).observe(demo);
  } else {
    visible = true; loop();
  }
})();
