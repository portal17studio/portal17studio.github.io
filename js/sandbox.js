// Practice sandbox — every widget on this page is real and self-contained,
// nothing is sent anywhere. Vanilla JS, no dependencies.

document.getElementById('resetSandbox')?.addEventListener('click', () => location.reload());

/* ---------------- sticky bars: measured, not guessed ----------------
   The exercise index sticks directly below the nav, and the nav changes
   height when it condenses on scroll. Publishing the nav's real height as
   --nav-h keeps the two flush: no gap for content to slide through, no
   overlap clipping the chips. A ResizeObserver catches the condense
   automatically, so there is nothing to keep in sync by hand. */
(() => {
  const nav = document.querySelector('.site-nav');
  const index = document.getElementById('sbxIndex');
  if (!nav) return;

  const root = document.documentElement;

  function publish() {
    root.style.setProperty('--nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
    if (index) {
      root.style.setProperty('--index-h', Math.round(index.getBoundingClientRect().height) + 'px');
    }
  }

  publish();
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(publish);
    ro.observe(nav);
    if (index) ro.observe(index);
  }
  window.addEventListener('resize', publish, { passive: true });

  // "stuck" fires the moment the bar detaches from the flow, which is when
  // it should start casting a shadow.
  if (index && 'IntersectionObserver' in window) {
    // A 1px marker in normal flow just above the bar: the moment it scrolls
    // past the nav, the bar has started sticking. It must stay in flow (not
    // absolutely positioned) for its position to track the bar's.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'height:1px;pointer-events:none;';
    index.parentNode.insertBefore(sentinel, index);
    new IntersectionObserver(([entry]) => {
      index.classList.toggle('stuck', !entry.isIntersecting);
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(sentinel);
  }
})();

/* ---------------- exercise index: progress + current section ----------------
   An exercise counts as "tried" the first time you actually do something
   inside it — clicking, typing, dragging. Scrolling past it doesn't count,
   because the point of the page is to practise, not to read it. */
(() => {
  const links = Array.from(document.querySelectorAll('.sbx-index-link'));
  if (links.length === 0) return;

  const counter = document.getElementById('sbxDone');
  const tried = new Set();

  const entries = links
    .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(e => e.section);

  const progress = document.querySelector('.sbx-progress');

  // Derived from the markup so adding an exercise never leaves a stale total.
  const totalEl = document.getElementById('sbxTotal');
  if (totalEl) totalEl.textContent = String(entries.length);

  function record(id, link) {
    if (!id || !link || tried.has(id)) return;
    tried.add(id);
    link.classList.add('done');
    if (counter) counter.textContent = String(tried.size);
    if (tried.size === entries.length && progress) {
      progress.classList.add('complete');
      progress.textContent = 'All ' + entries.length + ' tried 🎉';
    }
  }

  entries.forEach(({ link, section }) => {
    // `once` on each listener: after the first interaction there is nothing
    // left to record for that exercise.
    ['click', 'input', 'change', 'dragstart'].forEach(type => {
      section.addEventListener(type, () => record(section.id, link), { once: true });
    });
  });

  // The modal lives outside its section, so its buttons are wired separately.
  const modalLink = links.find(l => l.getAttribute('href') === '#modal-demo');
  document.getElementById('sbxModal')?.addEventListener('click', () => record('modal-demo', modalLink));

  /* Events inside an iframe never cross into this document, so the section
     listener above can never see them. Two routes, because which one works
     depends on how the page is being served: listen inside the frame when
     same-origin access is allowed, and otherwise notice that focus moved
     into it (browsers report the iframe element as activeElement when the
     visitor clicks inside it). */
  const frame = document.getElementById('practiceIframe');
  const frameLink = links.find(l => l.getAttribute('href') === '#iframe');
  if (frame && frameLink) {
    const markFrame = () => record('iframe', frameLink);

    const attachInside = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        ['click', 'input', 'change'].forEach(type => {
          doc.addEventListener(type, markFrame, { once: true });
        });
      } catch (e) {
        // Cross-origin (this happens over file://) — the focus route covers it.
      }
    };

    // Once for the document that is there now, and again after each load:
    // the first call may land on about:blank, and record() de-duplicates.
    attachInside();
    frame.addEventListener('load', attachInside);

    window.addEventListener('blur', () => {
      if (document.activeElement === frame) markFrame();
    });
  }

  if (!('IntersectionObserver' in window)) return;
  const strip = document.querySelector('.sbx-index-inner');

  /* Scrolls ONLY the chip strip. element.scrollIntoView() cannot be used
     here: it walks every scrollable ancestor including the document, and
     because the strip sits inside the page's scroll-padding it decided the
     chip was "hidden" and yanked the page down on every observer callback —
     which is what made scrolling this page fight back. */
  function revealChip(link) {
    if (!strip || !link || strip.scrollWidth <= strip.clientWidth) return;
    const target = link.offsetLeft - (strip.clientWidth - link.offsetWidth) / 2;
    const max = strip.scrollWidth - strip.clientWidth;
    strip.scrollTo({
      left: Math.max(0, Math.min(max, target)),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  const io = new IntersectionObserver((observed) => {
    observed.forEach(entry => {
      if (!entry.isIntersecting) return;
      const match = entries.find(e => e.section === entry.target);
      links.forEach(l => l.classList.toggle('current', l === match?.link));
      if (match) revealChip(match.link);
    });
  }, { rootMargin: '-30% 0px -55% 0px' });
  entries.forEach(e => io.observe(e.section));
})();

/* ---------------- generic form "submit" feedback ---------------- */
document.querySelectorAll('[data-sbx-form]').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = form.querySelector('[data-sbx-result]');
    if (result) {
      result.textContent = '✅ Submitted — nothing was actually sent anywhere, this is a practice form.';
    }
  });
});

/* ---------------- support form: urgency slider live label ---------------- */
(() => {
  const slider = document.getElementById('supUrgency');
  const out = document.getElementById('supUrgencyVal');
  if (!slider || !out) return;
  slider.addEventListener('input', () => { out.textContent = slider.value; });
})();

/* ---------------- support form: fake file picker ---------------- */
(() => {
  const btn = document.getElementById('supFileBtn');
  const input = document.getElementById('supFile');
  const label = document.getElementById('supFileName');
  if (!btn || !input) return;
  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    label.textContent = input.files.length ? input.files[0].name : 'No file selected';
  });
})();

/* ---------------- mini shop: cart ---------------- */
(() => {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutResult = checkoutBtn?.parentElement.querySelector('[data-sbx-result]');

  let count = 0;
  let total = 0;

  grid.querySelectorAll('.sbx-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = btn.closest('.sbx-product');
      const price = parseFloat(product.dataset.price);
      count += 1;
      total += price;
      countEl.textContent = String(count);
      totalEl.textContent = total.toFixed(2);

      const badge = countEl.closest('.sbx-cart-badge');
      if (badge) {
        badge.classList.remove('bump');
        void badge.offsetWidth; // restart the animation on repeat clicks
        badge.classList.add('bump');
        setTimeout(() => badge.classList.remove('bump'), 320);
      }

      product.classList.add('added');
      btn.textContent = 'Added ✓';
      setTimeout(() => { btn.textContent = 'Add to cart'; product.classList.remove('added'); }, 900);
    });
  });

  checkoutBtn?.addEventListener('click', () => {
    if (checkoutResult) {
      checkoutResult.textContent = count === 0
        ? 'Your cart is empty — add something first!'
        : `✅ Checked out ${count} item(s) for $${total.toFixed(2)} — this is a practice store, nothing was charged.`;
    }
  });
})();

/* ---------------- sortable / editable data table ---------------- */
(() => {
  const table = document.getElementById('dataTable');
  if (!table) return;
  const tbody = document.getElementById('dataTableBody');
  const originalRows = Array.from(tbody.querySelectorAll('tr'));
  const selectAll = document.getElementById('selectAllRows');

  table.querySelectorAll('th[data-sort]').forEach((th) => {
    let ascending = true;
    const colIndex = Array.from(th.parentElement.children).indexOf(th);
    th.addEventListener('click', () => {
      const type = th.dataset.sort;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const av = a.children[colIndex].textContent.trim();
        const bv = b.children[colIndex].textContent.trim();
        const cmp = type === 'number' ? (Number(av) - Number(bv)) : av.localeCompare(bv);
        return ascending ? cmp : -cmp;
      });
      rows.forEach(r => tbody.appendChild(r));
      ascending = !ascending;
    });
  });

  selectAll?.addEventListener('change', () => {
    tbody.querySelectorAll('.row-check').forEach(cb => { cb.checked = selectAll.checked; });
  });

  document.getElementById('deleteRowsBtn')?.addEventListener('click', () => {
    tbody.querySelectorAll('.row-check:checked').forEach(cb => cb.closest('tr').remove());
    if (selectAll) selectAll.checked = false;
  });

  document.getElementById('restoreRowsBtn')?.addEventListener('click', () => {
    tbody.innerHTML = '';
    originalRows.forEach(r => tbody.appendChild(r.cloneNode(true)));
    if (selectAll) selectAll.checked = false;
  });
})();

/* ---------------- tabs ---------------- */
(() => {
  const tabBtns = document.querySelectorAll('.sbx-tab-btn');
  if (tabBtns.length === 0) return;
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.sbx-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.sbx-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tabPanel === target));
    });
  });
})();

/* ---------------- modal ---------------- */
(() => {
  const modal = document.getElementById('sbxModal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const acceptBtn = document.getElementById('acceptModalBtn');
  if (!modal || !openBtn) return;

  const open = () => modal.classList.add('open');
  const close = () => modal.classList.remove('open');

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  acceptBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* ---------------- wizard ---------------- */
(() => {
  const nextBtn = document.getElementById('wizNext');
  if (!nextBtn) return;
  const backBtn = document.getElementById('wizBack');
  const dots = document.querySelectorAll('.sbx-wizard-dot');
  const panels = document.querySelectorAll('.sbx-wizard-panel');
  const result = nextBtn.parentElement.querySelector('[data-sbx-result]');
  const total = panels.length;
  let step = 1;

  function render() {
    dots.forEach(d => {
      const s = Number(d.dataset.step);
      d.classList.toggle('active', s === step);
      d.classList.toggle('done', s < step);
    });
    panels.forEach(p => p.classList.toggle('active', Number(p.dataset.wizardPanel) === step));
    backBtn.disabled = step === 1;
    nextBtn.textContent = step === total ? 'Finish' : 'Next';
    if (result) result.textContent = '';
  }

  backBtn.addEventListener('click', () => { if (step > 1) { step -= 1; render(); } });
  nextBtn.addEventListener('click', () => {
    if (step === total) {
      if (result) result.textContent = '✅ Wizard complete — this is as far as it goes in the sandbox.';
      return;
    }
    if (step === total - 1) {
      const project = document.getElementById('wizProject').value || '(untitled)';
      const freq = document.getElementById('wizFrequency').value;
      document.getElementById('wizSummary').textContent = `${project} — runs ${freq.toLowerCase()}`;
    }
    step += 1;
    render();
  });

  render();
})();

/* ---------------- 10. waiting for slow content ----------------
   Two different kinds of wait: an element that does not exist yet, and one
   that exists but is disabled. They need different handling in a flow, so
   the page offers both. */
(() => {
  const loadBtn = document.getElementById('loadDataBtn');
  const area = document.getElementById('loadDataArea');
  if (loadBtn && area) {
    loadBtn.addEventListener('click', () => {
      loadBtn.disabled = true;
      area.innerHTML = '<span class="sbx-spinner">Fetching records…</span>';
      setTimeout(() => {
        area.innerHTML =
          '<ul id="delayedList">' +
          '<li>INV-1042 — Ada Lovelace — $128.00</li>' +
          '<li>INV-1043 — Grace Hopper — $342.50</li>' +
          '<li>INV-1044 — Alan Turing — $87.25</li>' +
          '</ul>';
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load data again';
      }, 3000);
    });
  }

  /* The countdown is armed by the visitor, never on page load: started on
     load it had always finished by the time anyone scrolled down here, so
     the button was already enabled and the exercise demonstrated nothing. */
  const armBtn = document.getElementById('armBtn');
  const slowBtn = document.getElementById('slowBtn');
  const slowResult = document.getElementById('slowResult');
  if (armBtn && slowBtn) {
    let tick = null;

    armBtn.addEventListener('click', () => {
      clearInterval(tick);
      if (slowResult) slowResult.textContent = '';
      armBtn.disabled = true;
      slowBtn.disabled = true;

      let left = 4;
      slowBtn.textContent = `Unlocks in ${left}s…`;
      tick = setInterval(() => {
        left -= 1;
        if (left > 0) {
          slowBtn.textContent = `Unlocks in ${left}s…`;
          return;
        }
        clearInterval(tick);
        slowBtn.disabled = false;
        slowBtn.textContent = 'Now you can click me';
        armBtn.disabled = false;
        armBtn.textContent = 'Arm it again';
      }, 1000);
    });

    slowBtn.addEventListener('click', () => {
      if (slowResult) slowResult.textContent = '✅ Clicked once the button finally enabled.';
      slowBtn.disabled = true;
      slowBtn.textContent = 'Locked';
    });
  }
})();

/* ---------------- 11. new tabs and windows ---------------- */
(() => {
  const out = document.getElementById('newTabResult');
  document.getElementById('newTabLink')?.addEventListener('click', () => {
    if (out) out.textContent = '✅ A new tab was opened — switch to it, then come back.';
  });
  document.getElementById('newWindowBtn')?.addEventListener('click', () => {
    const win = window.open('sandbox-iframe.html', 'p17practice', 'width=560,height=420');
    if (out) {
      out.textContent = win
        ? '✅ Popup window opened.'
        : '⚠️ The browser blocked the popup — allow popups for this page to practise it.';
    }
  });
})();

/* ---------------- 12. paginated results ---------------- */
(() => {
  const body = document.getElementById('pagedBody');
  if (!body) return;
  const prev = document.getElementById('pagePrev');
  const next = document.getElementById('pageNext');
  const numEl = document.getElementById('pageNum');
  const totalEl = document.getElementById('pageTotal');

  const ROWS = [
    ['ORD-2001', 'Ada Lovelace', '$128.00'], ['ORD-2002', 'Grace Hopper', '$342.50'],
    ['ORD-2003', 'Alan Turing', '$87.25'], ['ORD-2004', 'Katherine Johnson', '$215.00'],
    ['ORD-2005', 'Margaret Hamilton', '$410.75'], ['ORD-2006', 'Barbara Liskov', '$96.40'],
    ['ORD-2007', 'Donald Knuth', '$154.10'], ['ORD-2008', 'Edsger Dijkstra', '$63.90'],
    ['ORD-2009', 'Frances Allen', '$288.00'], ['ORD-2010', 'Tim Berners-Lee', '$132.60'],
    ['ORD-2011', 'Radia Perlman', '$205.30'], ['ORD-2012', 'Shafi Goldwasser', '$77.85'],
  ];
  const PER_PAGE = 4;
  const pages = Math.ceil(ROWS.length / PER_PAGE);
  let page = 1;

  if (totalEl) totalEl.textContent = String(pages);

  function render() {
    const slice = ROWS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    body.innerHTML = slice
      .map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
      .join('');
    if (numEl) numEl.textContent = String(page);
    if (prev) prev.disabled = page === 1;
    if (next) next.disabled = page === pages;
  }

  prev?.addEventListener('click', () => { if (page > 1) { page -= 1; render(); } });
  next?.addEventListener('click', () => { if (page < pages) { page += 1; render(); } });
  render();
})();

/* ---------------- 13. hover menu ---------------- */
(() => {
  const bar = document.getElementById('sbxMenubar');
  const out = document.getElementById('menuResult');
  if (!bar || !out) return;
  bar.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) out.textContent = `✅ Picked: ${pick.dataset.pick}`;
  });
})();

/* ---------------- 14. unstable selectors ----------------
   The button keeps its class and its text but is given a fresh random id on
   every press, so a flow that targets it by id breaks on the second run and
   one that targets it by text or class keeps working. */
(() => {
  const btn = document.querySelector('.sbx-unstable-btn');
  const out = document.getElementById('unstableResult');
  const toggle = document.getElementById('shiftToggle');
  const banner = document.getElementById('shiftBanner');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const id = Math.random().toString(16).slice(2, 10);
    btn.id = id;
    if (out) out.innerHTML = `✅ Clicked. The id just changed to <code>${id}</code>.`;
  });

  toggle?.addEventListener('change', () => {
    if (banner) banner.hidden = !toggle.checked;
  });
})();

/* ---------------- drag and drop board ---------------- */
(() => {
  const board = document.getElementById('dndBoard');
  if (!board) return;
  const result = document.getElementById('dndNativeResult');
  let draggedId = null;

  board.querySelectorAll('.sbx-dnd-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedId = card.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.id);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  board.querySelectorAll('.sbx-dnd-column').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain') || draggedId;
      const card = document.getElementById(id);
      if (!card) return;
      col.appendChild(card);
      if (result) {
        result.textContent = col.dataset.zone === 'done'
          ? `✅ "${card.textContent.trim()}" moved to Done.`
          : `Moved "${card.textContent.trim()}" back to To do.`;
      }
    });
  });
})();
