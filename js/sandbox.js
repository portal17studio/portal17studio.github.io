// Practice sandbox — every widget on this page is real and self-contained,
// nothing is sent anywhere. Vanilla JS, no dependencies.

document.getElementById('resetSandbox')?.addEventListener('click', () => location.reload());

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
