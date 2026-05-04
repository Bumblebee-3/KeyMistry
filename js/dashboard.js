const cardsEl = document.getElementById('cards');
const emptyEl = document.getElementById('emptyState');
const sortByEl = document.getElementById('sortBy');
const resetAllBtn = document.getElementById('resetAll');
const replayBtn = document.getElementById('replayWalkthrough');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

function getAllProgress() {
  const items = [];
  // Cache localStorage length to avoid repeated DOM access
  const storageLength = localStorage.length;
  for (let i = 0; i < storageLength; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('km_progress_')) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!data || typeof data !== 'object') continue;
      const separate = !!data.separateHands;
      let totalPhases = 0;
      let completedPhases = 0;
      let sectionAcc = [];
      if (Array.isArray(data.stages) && data.stages.length) {
        totalPhases = data.stages.length * (separate ? 3 : 1);
        for (const st of data.stages) {
          if (separate) {
            completedPhases += (st.left?1:0) + (st.right?1:0) + (st.both?1:0);
          } else {
            completedPhases += (st.both?1:0);
          }
          const acc = st.accByStage || {};
          const left = separate ? (Number.isFinite(+acc.left) ? Math.round(+acc.left) : 0) : null;
          const right = separate ? (Number.isFinite(+acc.right) ? Math.round(+acc.right) : 0) : null;
          const both = Number.isFinite(+acc.both) ? Math.round(+acc.both) : 0;
          const best = separate ? Math.max(left || 0, right || 0, both || 0) : both;
          sectionAcc.push({ left, right, both, best });
        }
      } else {
        const sections = data.sections || {};
        Object.keys(sections).sort((a,b)=> (parseInt(a,10)||0)-(parseInt(b,10)||0)).forEach(idx => {
          const s = sections[idx];
          if (!s) return;
          if (separate) {
            totalPhases += 3;
            completedPhases += (s.left?1:0) + (s.right?1:0) + (s.both?1:0);
          } else {
            totalPhases += 1;
            completedPhases += (s.both?1:0);
          }
          const acc = s.accByStage || {};
          const left = separate ? (Number.isFinite(+acc.left) ? Math.round(+acc.left) : 0) : null;
          const right = separate ? (Number.isFinite(+acc.right) ? Math.round(+acc.right) : 0) : null;
          const both = Number.isFinite(+acc.both) ? Math.round(+acc.both) : 0;
          const best = separate ? Math.max(left || 0, right || 0, both || 0) : both;
          sectionAcc.push({ left, right, both, best });
        });
      }
      const computed = Math.round((completedPhases / Math.max(1, totalPhases)) * 100);
      const overallAcc = (sectionAcc && sectionAcc.length)
        ? Math.round(sectionAcc.reduce((a, s) => a + (Number.isFinite(+s?.best) ? +s.best : 0), 0) / sectionAcc.length)
        : 0;
      items.push({
        key,
        title: data.title || key.replace('km_progress_', ''),
        completion: computed,
        lastPlayed: data.lastPlayed ? new Date(data.lastPlayed) : new Date(0),
        phasesDone: completedPhases,
        phasesTotal: totalPhases,
        sectionAcc,
        separate,
        sectionsTotal: sectionAcc.length,
        overallAcc
      });
    } catch {}
  }
  return items;
}

function medalFor(pct) {
  const p = Number.isFinite(+pct) ? +pct : 0;
  if (p >= 90) return { cls: 'bg-amber-400', name: 'Gold' };
  if (p >= 80) return { cls: 'bg-slate-300', name: 'Silver' };
  if (p >= 70) return { cls: 'bg-orange-500', name: 'Bronze' };
  return { cls: 'bg-blue-600', name: '—' };
}

function formatBreakdown(s, separate) {
  if (!s) return '';
  if (separate) {
    return `Left: ${s.left ?? 0}% | Right: ${s.right ?? 0}% | Both: ${s.both ?? 0}%`;
  }
  return `Both: ${s.both ?? 0}%`;
}

function render() {
  let items = getAllProgress();
  const byTitle = new Map();
  const norm = (t) => (t || '').toString().replace(/\.[^/.]+$/, '').trim().toLowerCase();
  for (const it of items) {
    const k = norm(it.title);
    const prev = byTitle.get(k);
    if (!prev) byTitle.set(k, it);
    else {
      if ((it.lastPlayed > prev.lastPlayed) || (it.completion > prev.completion)) {
        byTitle.set(k, it);
      }
    }
  }
  items = Array.from(byTitle.values());
  const sortBy = sortByEl.value;
  if (sortBy === 'recent') items.sort((a,b) => b.lastPlayed - a.lastPlayed);
  else if (sortBy === 'title') items.sort((a,b) => a.title.localeCompare(b.title));
  else if (sortBy === 'completion') items.sort((a,b) => b.completion - a.completion);

  if (!items.length) {
    cardsEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  
  // Use DocumentFragment for better performance - single DOM update instead of many
  const fragment = document.createDocumentFragment();
  
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'rounded-2xl border border-white/10 hover:border-white/20 transition bg-gray-900/60 p-6 backdrop-blur shadow-lg';
    const sections = (item.sectionAcc && item.sectionAcc.length)
      ? `<div class="mt-4">
           <div class="flex items-center justify-between">
             <div class="text-sm text-white/80">Sections</div>
            <div class="text-[10px] text-white/50">Gold ≥90% • Silver ≥80% • Bronze ≥70%</div>
           </div>
           <div class="mt-2 space-y-2">
             ${item.sectionAcc.map((s, i) => {
               const pct = Math.max(0, Math.min(100, Number.isFinite(+s?.best) ? +s.best : 0));
               const medal = medalFor(pct);
               const tip = formatBreakdown(s, item.separate);
               return `
                 <div class=\"flex items-center gap-3\" title=\"${tip}\"> 
                   <div class=\"w-10 text-xs text-white/60\">S${i+1}</div>
                   <div class=\"flex-1\">
                     <div class=\"h-2 w-full rounded-full bg-white/10 overflow-hidden\">
                       <div class=\"h-full ${medal.cls}\" style=\"width:${pct}%\"></div>
                     </div>
                   </div>
                   <div class=\"w-10 text-right text-xs text-white/70\">${pct}%</div>
                 </div>`;
             }).join('')}
           </div>
         </div>`
      : '';
    const overall = (() => {
      const pct = Math.max(0, Math.min(100, Number.isFinite(+item.overallAcc) ? +item.overallAcc : 0));
      return `
        <div class=\"mt-2 flex items-center gap-2\">\
          <div class=\"text-xs text-white/70\">Overall accuracy</div>\
          <div class=\"flex items-center px-2 py-0.5 rounded-md border border-white/10 bg-gray-800/80\">\
            <span class=\"text-xs text-white/80\">${pct}%</span>\
          </div>\
        </div>`;
    })();
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-lg">${item.title}</h3>
          <div class="text-xs text-white/60">Last played: ${item.lastPlayed.toLocaleString()}</div>
        </div>
        <button data-key="${item.key}" class="reset-one px-2 py-1 text-xs rounded-md bg-gray-800 hover:bg-gray-700">Reset</button>
      </div>
      <div class="mt-3">
        <div class="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div class="h-full bg-blue-600" style="width:${item.completion}%"></div>
        </div>
  <div class="mt-1 text-xs text-white/80">${item.completion}% complete • ${item.sectionsTotal} sections • ${item.phasesDone}/${item.phasesTotal} phases</div>
        ${overall}
      </div>
      ${sections}
    `;
    fragment.appendChild(card);
  });
  
  // Single DOM update for all cards
  cardsEl.innerHTML = '';
  cardsEl.appendChild(fragment);
}

// Use event delegation for better performance - single listener instead of many
cardsEl.addEventListener('click', (e) => {
  if (e.target.classList.contains('reset-one')) {
    const key = e.target.getAttribute('data-key');
    if (!key) return;
    if (!confirm('Reset progress for this song?')) return;
    try { localStorage.removeItem(key); } catch {}
    render();
  }
});

sortByEl.addEventListener('change', render);
resetAllBtn.addEventListener('click', () => {
  if (!confirm('Reset ALL guided learning progress?')) return;
  const keys = [];
  // Cache localStorage length to avoid repeated access during iteration
  const storageLength = localStorage.length;
  for (let i = 0; i < storageLength; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('km_progress_')) keys.push(key);
  }
  // Batch remove operations
  keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
  render();
});

replayBtn.addEventListener('click', () => {
  try {
    localStorage.removeItem('km_walkthrough_done');
    localStorage.removeItem('km_walkthrough_last_step');
  } catch {}
  window.location.href = './app';
});

render();
