// Portal17 Studio marketing site — vanilla JS, no build step, no dependencies.

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------------- mobile nav ---------------- */
(() => {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
})();

/* ---------------- scroll reveal ---------------- */
(() => {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || items.length === 0) {
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

/* ---------------- FAQ accordion ---------------- */
(() => {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
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

    setActiveNode(8);
    await sleep(300);
    confirmationEl.classList.add('flash');
    log('🧠 Extracting the confirmation text …');
    await sleep(500);
    confirmationEl.classList.remove('flash');
    addVar('confirmation_text', "Thanks, Ada! We'll reply within 24 hours.");
    addVar('ticket_id', 'A17-4821');
    log('💾 Saved to variables: confirmation_text, ticket_id.');

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
