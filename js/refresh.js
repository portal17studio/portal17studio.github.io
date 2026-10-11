// Small, local illustrations of actual capabilities; no real flow is executed.
(() => {
  const run = document.getElementById('previewRun');
  if (!run) return;
  const flow = document.getElementById('previewFlow');
  const status = document.getElementById('previewStatus');
  const scenarios = {
    reports: { name: 'Daily reports.portal', nodes: [
      ['Start', 'Your next free hour starts here', 'start', 'green'],
      ['Navigate', 'Open your reporting portal', 'navigate', 'blue'],
      ['Extract Text', 'Read the latest report data', 'extract_part', 'purple'],
      ['Export Excel', 'Save a ready-to-use spreadsheet', 'export_excel', 'orange']
    ] },
    desktop: { name: 'Desktop work.portal', nodes: [
      ['Start', 'One process, across your apps', 'start', 'green'],
      ['Extract Text', 'Read an order from the website', 'extract_part', 'blue'],
      ['Type in App', 'Fill the desktop order field', 'app_type', 'purple'],
      ['Click in App', 'Save the order in your application', 'app_click', 'orange']
    ] },
    api: { name: 'API to Excel.portal', nodes: [
      ['Start', 'Put your data to work', 'start', 'green'],
      ['Call API', 'Request data and read JSON fields', 'api', 'blue'],
      ['Transform', 'Clean and format the values', 'transform', 'purple'],
      ['Export Excel', 'Write the results to an .xlsx file', 'export_excel', 'orange']
    ] }
  };
  let scenario = 'reports';
  let generation = 0;
  function setStatus(text) {
    status.replaceChildren();
    const dot = document.createElement('span');
    dot.className = 'console-dot';
    status.append(dot, document.createTextNode(text));
  }
  document.querySelectorAll('[data-scenario]').forEach(button => {
    button.addEventListener('click', () => {
      generation++;
      scenario = button.dataset.scenario;
      document.querySelectorAll('[data-scenario]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      document.getElementById('previewFile').textContent = scenarios[scenario].name;
      flow.replaceChildren();
      scenarios[scenario].nodes.forEach(([title, text, icon, color], i) => {
        const node = document.createElement('div');
        node.className = 'preview-node';
        node.dataset.step = i;
        const symbol = document.createElement('span');
        symbol.className = 'node-symbol ' + color;
        const img = document.createElement('img');
        img.src = 'assets/icons/' + icon + '.png'; img.alt = '';
        symbol.append(img);
        const label = document.createElement('span');
        const b = document.createElement('b'); b.textContent = title;
        const small = document.createElement('small'); small.textContent = text;
        label.append(b, small);
        const state = document.createElement('i'); state.className = 'node-state';
        node.append(symbol, label, state); flow.append(node);
      });
      run.disabled = false; run.textContent = '▶ Run flow';
      setStatus('Ready when you are. Try running this flow.');
    });
  });
  run.addEventListener('click', async () => {
    const current = ++generation;
    run.disabled = true; run.textContent = 'Running…';
    const nodes = [...flow.querySelectorAll('.preview-node')];
    nodes.forEach(n => n.classList.remove('running', 'done'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (let i = 0; i < nodes.length; i++) {
      if (current !== generation) return;
      nodes[i].classList.add('running');
      setStatus('Demo · Step ' + (i + 1) + '/4: ' + scenarios[scenario].nodes[i][0]);
      await new Promise(resolve => setTimeout(resolve, reduce ? 0 : 650));
      if (current !== generation) return;
      nodes[i].classList.remove('running'); nodes[i].classList.add('done');
    }
    setStatus('Demo complete · 4 steps illustrated. Imagine your own workflow.');
    run.disabled = false; run.textContent = '↻ Run again';
  });
})();

(() => {
  const categories = ['build','build','build','data','data','data','data','data','run','build','build','data','run','build','run','build','run','run','build','run'];
  const cards = [...document.querySelectorAll('.feature-card')];
  cards.forEach((card, i) => { if (!card.dataset.category) card.dataset.category = categories[i]; });
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      cards.forEach(card => card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter);
    });
  });
})();

// Route wires from each real output port to the next input port.
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const graphs = [
    [document.querySelector('.rec-graph'), '.rec-node'],
    [document.querySelector('#previewFlow'), '.preview-node'],
    [document.querySelector('#pgCanvas'), '.pg-node-chip']
  ].filter(([container]) => container);
  graphs.forEach(([container, selector], index) => {
    let svg, paths;
    let queued = false;
    function draw() {
      queued = false;
      if (!svg || !container.contains(svg)) {
        svg = document.createElementNS(ns, 'svg');
        svg.classList.add('node-cables'); svg.setAttribute('aria-hidden', 'true');
        const defs = document.createElementNS(ns, 'defs');
        const marker = document.createElementNS(ns, 'marker');
        marker.id = 'flow-arrow-' + index;
        marker.setAttribute('viewBox', '0 0 6 6'); marker.setAttribute('refX', '5'); marker.setAttribute('refY', '3');
        marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '5'); marker.setAttribute('orient', 'auto');
        const arrow = document.createElementNS(ns, 'polygon');
        arrow.setAttribute('points', '0,0 6,3 0,6'); arrow.setAttribute('fill', '#e6a243');
        marker.append(arrow); defs.append(marker);
        paths = document.createElementNS(ns, 'g'); svg.append(defs, paths); container.prepend(svg);
      }
      const bounds = container.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
      paths.replaceChildren();
      const nodes = [...container.querySelectorAll(selector)];
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i].getBoundingClientRect(), b = nodes[i + 1].getBoundingClientRect();
        const x1 = a.right - bounds.left, y1 = a.top - bounds.top + a.height / 2;
        const x2 = b.left - bounds.left, y2 = b.top - bounds.top + b.height / 2;
        let d;
        if (Math.abs(y1 - y2) < 5) {
          d = `M ${x1} ${y1} H ${x2 - 5}`;
        } else {
          const right = x1 + 13, left = x2 - 13, middle = (y1 + y2) / 2 + 5, r = 6;
          d = `M ${x1} ${y1} H ${right-r} Q ${right} ${y1} ${right} ${y1+r} V ${middle-r} Q ${right} ${middle} ${right-r} ${middle} H ${left+r} Q ${left} ${middle} ${left} ${middle+r} V ${y2-r} Q ${left} ${y2} ${left+r} ${y2} H ${x2-5}`;
        }
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d); path.setAttribute('marker-end', `url(#flow-arrow-${index})`);
        if (nodes[i + 1].matches('.rec-node') && document.querySelector('#recDemo.animating') && !nodes[i + 1].classList.contains('in')) path.classList.add('pending');
        if (nodes[i].classList.contains('done') || nodes[i].closest('.pg-node.done')) path.classList.add('executed');
        paths.append(path);
      }
    }
    function schedule() { if (!queued) { queued = true; requestAnimationFrame(draw); } }
    new ResizeObserver(schedule).observe(container);
    new MutationObserver(records => {
      if (records.some(record =>
        record.type === 'attributes' && (record.target.matches(selector) || record.target.matches('.pg-node')) ||
        record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 && node.matches(selector))
      )) schedule();
    }).observe(container, {subtree: true, childList: true, attributes: true, attributeFilter: ['class']});
    const demo = container.closest('#recDemo');
    if (demo) new MutationObserver(schedule).observe(demo, {attributes: true, attributeFilter: ['class']});
    schedule();
  });
})();

(() => {
  document.querySelectorAll('[data-data-tab]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    document.querySelectorAll('[data-data-panel]').forEach(panel => panel.hidden = panel.dataset.dataPanel !== button.dataset.dataTab);
  }));
})();
