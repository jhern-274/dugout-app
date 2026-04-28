// ==== CONFIG ====
const STATE_KEY = 'dugout_state_v6';
const HISTORY_KEY = 'dugout_history_v6';
const MAX_PLAYERS = 15;

// Player attribute tags
const TAGS = [
  { id: 'leadoff',  label: 'Lead-off' },
  { id: 'contact',  label: 'Contact / Line-to-line' },
  { id: 'power',    label: 'Power / Pull' },
  { id: 'speedy',   label: 'Speedy' },
  { id: 'patient',  label: 'Patient / High OBP' },
  { id: 'linedrive',label: 'Line drive' },
  { id: 'glove',    label: 'Good glove' },
  { id: 'utility',  label: 'Utility' },
  { id: 'rookie',   label: 'Rookie / New' },
];

function tagLabel(id) {
  const t = TAGS.find(x => x.id === id);
  return t ? t.label : id;
}

const FIELD_POSITIONS = {
  common: {
    P:  { x: 50, y: 68, label: 'P' },
    C:  { x: 50, y: 92, label: 'C' },
    '1B': { x: 66, y: 72, label: '1B' },
    '2B': { x: 60, y: 58, label: '2B' },
    '3B': { x: 34, y: 72, label: '3B' },
    SS: { x: 40, y: 58, label: 'SS' },
    LF: { x: 18, y: 38, label: 'LF' },
    RF: { x: 82, y: 38, label: 'RF' },
  },
  '4of': {
    LC: { x: 37, y: 30, label: 'LC' },
    RC: { x: 63, y: 30, label: 'RC' },
  },
  mm: {
    CF: { x: 50, y: 28, label: 'CF' },
    MM: { x: 50, y: 48, label: 'MM' },
  }
};

const ALL_POSITIONS = [
  { val: 'P',  label: 'P — Pitcher' },
  { val: 'C',  label: 'C — Catcher' },
  { val: '1B', label: '1B — First Base' },
  { val: '2B', label: '2B — Second Base' },
  { val: '3B', label: '3B — Third Base' },
  { val: 'SS', label: 'SS — Shortstop' },
  { val: 'LF', label: 'LF — Left Field' },
  { val: 'LC', label: 'LC — Left Center' },
  { val: 'RC', label: 'RC — Right Center' },
  { val: 'RF', label: 'RF — Right Field' },
  { val: 'CF', label: 'CF — Center Field' },
  { val: 'MM', label: 'MM — Middleman (IF)' },
  { val: 'EH', label: 'EH — Extra Hitter' },
  { val: '—', label: '— (None)' },
];

const TEST_LINEUP = {
  mode: 'mm',
  team: 'Test Team',
  league: 'Test League',
  roster: [
    { name: 'Adrien',  pos1: 'RF', pos2: '—', pos3: '—', tags: [] },
    { name: 'Dykes',   pos1: '3B', pos2: '—', pos3: '—', tags: [] },
    { name: 'Aramis',  pos1: '1B', pos2: '—', pos3: '—', tags: [] },
    { name: 'Gaby',    pos1: 'SS', pos2: '—', pos3: '—', tags: [] },
    { name: 'Rob',     pos1: 'CF', pos2: '—', pos3: '—', tags: [] },
    { name: 'Alex',    pos1: '2B', pos2: '—', pos3: '—', tags: [] },
    { name: 'Joe',     pos1: 'C',  pos2: 'EH', pos3: '—', tags: [] },
    { name: 'Hector',  pos1: 'MM', pos2: '—', pos3: '—', tags: [] },
    { name: 'Matt',    pos1: 'LF', pos2: '—', pos3: '—', tags: [] },
    { name: 'Jimmy',   pos1: 'EH', pos2: 'C',  pos3: '—', tags: [] },
    { name: 'Capi',    pos1: 'P',  pos2: '—', pos3: '—', tags: [] },
  ]
};

let state = {
  mode: 'mm',
  team: '',
  opponent: '',
  gameType: 'League',
  league: '',
  park: '',
  date: todayISO(),
  roster: [],
  lineupOrder: [],
  positions: {},
};

let history = [];
let currentTab = 'roster';
let pendingResetAfterSave = false;

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getActivePositions() {
  return { ...FIELD_POSITIONS.common, ...FIELD_POSITIONS[state.mode] };
}

function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e) {}
}
function loadState() {
  try {
    let raw = localStorage.getItem(STATE_KEY);
    if (!raw) raw = localStorage.getItem('dugout_state_v5');
    if (!raw) raw = localStorage.getItem('dugout_state_v4');
    if (!raw) raw = localStorage.getItem('dugout_softball_v3');
    if (!raw) raw = localStorage.getItem('dugout_softball_v2');
    if (!raw) raw = localStorage.getItem('dugout_softball_v1');
    if (raw) {
      const loaded = JSON.parse(raw);
      if (loaded.roster) {
        loaded.roster = loaded.roster.map(p => ({
          id: p.id || uid(),
          name: p.name,
          pos1: p.pos1 || p.preferredPos || 'EH',
          pos2: p.pos2 || '—',
          pos3: p.pos3 || '—',
          tags: Array.isArray(p.tags) ? p.tags : [],
        }));
      }
      state = {
        mode: 'mm', team: '', opponent: '', gameType: 'League', league: '', park: '', date: todayISO(),
        roster: [], lineupOrder: [], positions: {},
        ...loaded
      };
      if (!state.date) state.date = todayISO();
      if (!state.park) state.park = '';
      if (!state.opponent) state.opponent = '';
      if (!state.gameType) state.gameType = 'League';
    }
  } catch(e) {}
}

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(e) {}
}
function loadHistory() {
  try {
    let raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) raw = localStorage.getItem('dugout_history_v5');
    if (!raw) raw = localStorage.getItem('dugout_history_v4');
    if (raw) history = JSON.parse(raw) || [];
  } catch(e) {}
}

function uid() { return Math.random().toString(36).slice(2, 10); }
function playerById(id) { return state.roster.find(p => p.id === id); }
function getPositionOfPlayer(id) {
  for (const pos in state.positions) if (state.positions[pos] === id) return pos;
  return null;
}
function getUnassignedPlayers() {
  return state.roster.filter(p => !getPositionOfPlayer(p.id));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function populateDropdowns() {
  const addOptsPrimary = ALL_POSITIONS.filter(p => p.val !== '—').map(p =>
    `<option value="${p.val}">${p.label}</option>`).join('');
  const addOptsSecondary = ALL_POSITIONS.map(p =>
    `<option value="${p.val}"${p.val === '—' ? ' selected' : ''}>${p.label}</option>`).join('');

  document.getElementById('playerPos1').innerHTML = addOptsPrimary;
  document.getElementById('playerPos2').innerHTML = addOptsSecondary;
  document.getElementById('playerPos3').innerHTML = addOptsSecondary;

  // Edit dialog selects
  document.getElementById('editPos1').innerHTML = addOptsPrimary;
  document.getElementById('editPos2').innerHTML = addOptsSecondary;
  document.getElementById('editPos3').innerHTML = addOptsSecondary;
}

function render() {
  renderRoster();
  renderLineup();
  renderField();
  renderFieldLabel();
  renderBench();
  renderRosterCount();
  renderHistory();
  renderMetaInputs();
  saveState();
}

function renderFieldLabel() {
  const el = document.getElementById('fieldLabel');
  const oppEl = document.getElementById('fieldOpponent');
  if (el) {
    const park = (state.park || '').trim();
    const date = formatShortDate(state.date);
    if (!park && !date) {
      el.innerHTML = '';
    } else {
      el.innerHTML = `
        ${park ? `<span class="park">${escapeHtml(park)}</span>` : ''}
        ${date ? `<span class="date">${date}</span>` : ''}
      `;
    }
  }
  if (oppEl) {
    const opp = (state.opponent || '').trim();
    if (!opp) {
      oppEl.innerHTML = '';
    } else {
      oppEl.innerHTML = `
        <span class="vs-label">vs.</span>
        <span class="opp-name">${escapeHtml(opp)}</span>
      `;
    }
  }
}

function formatShortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

function renderMetaInputs() {
  const t = document.getElementById('teamName');
  const opp = document.getElementById('opponentName');
  const gt = document.getElementById('gameType');
  const l = document.getElementById('leagueName');
  const p = document.getElementById('parkName');
  const d = document.getElementById('gameDate');
  if (t && document.activeElement !== t) t.value = state.team || '';
  if (opp && document.activeElement !== opp) opp.value = state.opponent || '';
  if (gt && document.activeElement !== gt) gt.value = state.gameType || 'League';
  if (l && document.activeElement !== l) l.value = state.league || '';
  if (p && document.activeElement !== p) p.value = state.park || '';
  if (d && document.activeElement !== d) d.value = state.date || todayISO();
}

function renderRosterCount() {
  document.getElementById('rosterCount').textContent = `${state.roster.length}/${MAX_PLAYERS}`;
  const badge = document.getElementById('historyBadge');
  if (history.length > 0) {
    badge.style.display = 'block';
    badge.textContent = history.length;
  } else {
    badge.style.display = 'none';
  }
}

function renderRoster() {
  const list = document.getElementById('rosterList');
  const empty = document.getElementById('rosterEmpty');
  list.innerHTML = '';

  if (state.roster.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  state.roster.forEach(p => {
    const row = document.createElement('div');
    row.className = 'roster-row tappable';
    // Let tags wrap onto their own row when present
    if (p.tags && p.tags.length > 0) {
      row.style.gridTemplateColumns = '1fr auto auto';
    }
    const pos2Html = (p.pos2 && p.pos2 !== '—')
      ? `<span class="pos-pill secondary">${p.pos2}</span>` : '';
    const pos3Html = (p.pos3 && p.pos3 !== '—')
      ? `<span class="pos-pill tertiary">${p.pos3}</span>` : '';
    const tagsHtml = (p.tags && p.tags.length > 0)
      ? `<div class="tags-line">${p.tags.map(t => `<span class="tag-mini">${escapeHtml(tagLabel(t))}</span>`).join('')}</div>`
      : '';
    row.innerHTML = `
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="positions">
        <span class="pos-pill primary">${p.pos1}</span>
        ${pos2Html}
        ${pos3Html}
      </div>
      <span class="edit-hint">›</span>
      ${tagsHtml}
    `;
    row.addEventListener('click', () => openEditDialog(p.id));
    list.appendChild(row);
  });
}

function renderLineup() {
  const list = document.getElementById('lineupList');
  const empty = document.getElementById('lineupEmpty');
  list.innerHTML = '';

  if (state.lineupOrder.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  state.lineupOrder.forEach((pid, idx) => {
    const p = playerById(pid);
    if (!p) return;
    const assignedPos = getPositionOfPlayer(pid);
    const displayPos = assignedPos || 'EH';
    const isEH = !assignedPos;

    const li = document.createElement('li');
    li.className = 'lineup-item';
    li.draggable = true;
    li.dataset.pid = pid;
    li.innerHTML = `
      <span class="order-num">${idx + 1}</span>
      <span class="player-name">${escapeHtml(p.name)}</span>
      <span class="pos-badge ${isEH ? 'eh' : ''}">${displayPos}</span>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.lineup-item').forEach(item => {
    item.addEventListener('dragstart', onLineupDragStart);
    item.addEventListener('dragend', onLineupDragEnd);
    item.addEventListener('dragover', onLineupDragOver);
    item.addEventListener('dragleave', onLineupDragLeave);
    item.addEventListener('drop', onLineupDrop);
    attachTouchReorder(item);
  });
}

function renderField() {
  const wrapper = document.getElementById('fieldWrapper');
  wrapper.querySelectorAll('.position-spot').forEach(el => el.remove());

  const positions = getActivePositions();
  for (const posKey in positions) {
    const { x, y, label } = positions[posKey];
    const pid = state.positions[posKey];
    const player = pid ? playerById(pid) : null;

    const spot = document.createElement('div');
    spot.className = 'position-spot';
    spot.style.left = `${x}%`;
    spot.style.top = `${y}%`;
    spot.dataset.pos = posKey;

    spot.innerHTML = `
      <div class="spot-circle ${player ? 'filled' : ''}">
        <div class="spot-pos">${label}</div>
        ${player
          ? `<div class="spot-name" draggable="true" data-pid="${player.id}">${escapeHtml(player.name)}</div>`
          : `<div class="spot-empty">open</div>`}
      </div>
    `;

    spot.addEventListener('dragover', onSpotDragOver);
    spot.addEventListener('dragleave', onSpotDragLeave);
    spot.addEventListener('drop', onSpotDrop);

    const nameEl = spot.querySelector('.spot-name');
    if (nameEl) {
      nameEl.addEventListener('dragstart', onPlayerDragStart);
      nameEl.addEventListener('dragend', onPlayerDragEnd);
      attachTouchDrag(nameEl);
    }

    wrapper.appendChild(spot);
  }
}

function renderBench() {
  const list = document.getElementById('benchList');
  const unassigned = getUnassignedPlayers();
  list.innerHTML = '';

  if (unassigned.length === 0) {
    list.innerHTML = '<div class="bench-empty">All players positioned</div>';
    return;
  }

  unassigned.forEach(p => {
    const isEH = p.pos1 === 'EH';
    const chip = document.createElement('div');
    chip.className = 'bench-chip' + (isEH ? ' eh-chip' : '');
    chip.draggable = true;
    chip.dataset.pid = p.id;
    chip.textContent = p.name + (isEH ? ' (EH)' : '');
    chip.addEventListener('dragstart', onPlayerDragStart);
    chip.addEventListener('dragend', onPlayerDragEnd);
    attachTouchDrag(chip);
    list.appendChild(chip);
  });
}

function renderHistory() {
  const list = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  list.innerHTML = '';

  if (history.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const sorted = [...history].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

  sorted.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'history-card';
    const prettyDate = formatPrettyDate(entry.snapshot.date);
    const parkText = entry.snapshot.park ? ` @ ${escapeHtml(entry.snapshot.park)}` : '';
    const oppText = entry.snapshot.opponent ? ` vs. ${escapeHtml(entry.snapshot.opponent)}` : '';
    const typeText = entry.snapshot.gameType || '';
    const leagueText = entry.snapshot.league
      ? (typeText ? `${escapeHtml(entry.snapshot.league)} (${typeText})` : escapeHtml(entry.snapshot.league))
      : (typeText || '—');
    card.innerHTML = `
      <div class="history-info">
        <div class="team">${escapeHtml(entry.snapshot.team || 'Untitled Team')}${oppText}</div>
        <div class="meta">
          ${leagueText}${parkText}
          <span class="meta-sep">•</span>
          ${prettyDate}
        </div>
        <div class="player-count">${entry.snapshot.roster.length} players</div>
      </div>
      <div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end">
        <button class="btn" data-load="${entry.id}">Load</button>
        <button class="btn" data-dup="${entry.id}">Duplicate</button>
      </div>
      <button class="icon-btn" data-del="${entry.id}" title="Delete">×</button>
    `;
    card.querySelector('[data-load]').addEventListener('click', () => loadFromHistory(entry.id));
    card.querySelector('[data-dup]').addEventListener('click', () => openDuplicateDialog(entry.id));
    card.querySelector('[data-del]').addEventListener('click', () => deleteFromHistory(entry.id));
    list.appendChild(card);
  });
}

function formatPrettyDate(iso) {
  if (!iso) return 'No date';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

// ==== LINEUP DRAG ====
let draggedLineupId = null;

function onLineupDragStart(e) {
  draggedLineupId = e.currentTarget.dataset.pid;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', 'lineup:' + draggedLineupId);
}
function onLineupDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.lineup-item').forEach(i => i.classList.remove('drag-over'));
  draggedLineupId = null;
}
function onLineupDragOver(e) {
  if (!draggedLineupId) return;
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function onLineupDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
function onLineupDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!draggedLineupId) return;
  const targetId = e.currentTarget.dataset.pid;
  if (targetId === draggedLineupId) return;
  const fromIdx = state.lineupOrder.indexOf(draggedLineupId);
  const toIdx = state.lineupOrder.indexOf(targetId);
  if (fromIdx < 0 || toIdx < 0) return;
  state.lineupOrder.splice(fromIdx, 1);
  state.lineupOrder.splice(toIdx, 0, draggedLineupId);
  render();
}

// ==== POSITION DRAG ====
let draggedPlayerId = null;

function onPlayerDragStart(e) {
  draggedPlayerId = e.currentTarget.dataset.pid;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', 'player:' + draggedPlayerId);
  setTimeout(() => e.target.style.opacity = '0.4', 0);
}
function onPlayerDragEnd(e) {
  if (e.target) e.target.style.opacity = '';
  draggedPlayerId = null;
  document.querySelectorAll('.position-spot').forEach(s => s.classList.remove('drag-over'));
  document.getElementById('bench').classList.remove('drag-over');
}
function onSpotDragOver(e) {
  if (!draggedPlayerId) return;
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function onSpotDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
function onSpotDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!draggedPlayerId) return;
  movePlayerToPosition(draggedPlayerId, e.currentTarget.dataset.pos);
}

function movePlayerToPosition(pid, targetPos) {
  const currentPos = getPositionOfPlayer(pid);
  if (currentPos) delete state.positions[currentPos];

  const occupant = state.positions[targetPos];
  if (occupant && currentPos) {
    state.positions[currentPos] = occupant;
  } else if (occupant && !currentPos) {
    delete state.positions[targetPos];
  }

  state.positions[targetPos] = pid;
  render();
}

function movePlayerToBench(pid) {
  const currentPos = getPositionOfPlayer(pid);
  if (currentPos) delete state.positions[currentPos];
  render();
}

// ==== TOUCH DRAG ====
function attachTouchDrag(el) {
  let clone = null;
  let touchPid = null;

  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchPid = el.dataset.pid;
    const touch = e.touches[0];
    clone = el.cloneNode(true);
    clone.classList.add('drag-clone');
    clone.style.left = touch.clientX + 'px';
    clone.style.top = touch.clientY + 'px';
    clone.style.width = el.offsetWidth + 'px';
    document.body.appendChild(clone);
    el.style.opacity = '0.3';
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    if (!clone || !touchPid) return;
    e.preventDefault();
    const touch = e.touches[0];
    clone.style.left = touch.clientX + 'px';
    clone.style.top = touch.clientY + 'px';

    clone.style.display = 'none';
    const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    clone.style.display = '';

    document.querySelectorAll('.position-spot').forEach(s => s.classList.remove('drag-over'));
    document.getElementById('bench').classList.remove('drag-over');

    const spot = elBelow?.closest('.position-spot');
    if (spot) spot.classList.add('drag-over');
    const benchHit = elBelow?.closest('#bench');
    if (benchHit) benchHit.classList.add('drag-over');
  }, { passive: false });

  el.addEventListener('touchend', (e) => {
    if (!clone || !touchPid) return;
    const touch = e.changedTouches[0];
    clone.style.display = 'none';
    const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    clone.remove();
    clone = null;
    el.style.opacity = '';

    document.querySelectorAll('.position-spot').forEach(s => s.classList.remove('drag-over'));
    document.getElementById('bench').classList.remove('drag-over');

    const spot = elBelow?.closest('.position-spot');
    const benchHit = elBelow?.closest('#bench');
    if (spot) {
      movePlayerToPosition(touchPid, spot.dataset.pos);
    } else if (benchHit) {
      movePlayerToBench(touchPid);
    }
    touchPid = null;
  });

  el.addEventListener('touchcancel', () => {
    if (clone) clone.remove();
    clone = null;
    touchPid = null;
    el.style.opacity = '';
  });
}

function attachTouchReorder(item) {
  let clone = null;
  let touchPid = null;

  item.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchPid = item.dataset.pid;
    const touch = e.touches[0];
    clone = item.cloneNode(true);
    clone.classList.add('drag-clone');
    clone.style.left = touch.clientX + 'px';
    clone.style.top = touch.clientY + 'px';
    clone.style.width = item.offsetWidth + 'px';
    document.body.appendChild(clone);
    item.style.opacity = '0.3';
  }, { passive: true });

  item.addEventListener('touchmove', (e) => {
    if (!clone || !touchPid) return;
    e.preventDefault();
    const touch = e.touches[0];
    clone.style.left = touch.clientX + 'px';
    clone.style.top = touch.clientY + 'px';

    clone.style.display = 'none';
    const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    clone.style.display = '';

    document.querySelectorAll('.lineup-item').forEach(i => i.classList.remove('drag-over'));
    const target = elBelow?.closest('.lineup-item');
    if (target && target.dataset.pid !== touchPid) target.classList.add('drag-over');
  }, { passive: false });

  item.addEventListener('touchend', (e) => {
    if (!clone || !touchPid) return;
    const touch = e.changedTouches[0];
    clone.style.display = 'none';
    const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    clone.remove();
    clone = null;
    item.style.opacity = '';
    document.querySelectorAll('.lineup-item').forEach(i => i.classList.remove('drag-over'));

    const target = elBelow?.closest('.lineup-item');
    if (target && target.dataset.pid !== touchPid) {
      const fromIdx = state.lineupOrder.indexOf(touchPid);
      const toIdx = state.lineupOrder.indexOf(target.dataset.pid);
      if (fromIdx >= 0 && toIdx >= 0) {
        state.lineupOrder.splice(fromIdx, 1);
        state.lineupOrder.splice(toIdx, 0, touchPid);
        render();
      }
    }
    touchPid = null;
  });

  item.addEventListener('touchcancel', () => {
    if (clone) clone.remove();
    clone = null;
    touchPid = null;
    item.style.opacity = '';
  });
}

// ==== ACTIONS ====
function addPlayer() {
  const nameInput = document.getElementById('playerName');
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }
  if (state.roster.length >= MAX_PLAYERS) {
    alert(`Roster full — ${MAX_PLAYERS} max.`);
    return;
  }

  const pos1 = document.getElementById('playerPos1').value;
  const pos2 = document.getElementById('playerPos2').value;
  const pos3 = document.getElementById('playerPos3').value;

  const id = uid();
  state.roster.push({ id, name, pos1, pos2, pos3, tags: [] });
  state.lineupOrder.push(id);

  const active = getActivePositions();
  // Try primary, secondary, then tertiary
  const tryPositions = [pos1, pos2, pos3].filter(p => p && p !== '—' && p !== 'EH');
  for (const p of tryPositions) {
    if (active[p] && !state.positions[p]) {
      state.positions[p] = id;
      break;
    }
  }

  nameInput.value = '';
  nameInput.focus();
  render();
}

function removePlayer(id) {
  state.roster = state.roster.filter(p => p.id !== id);
  state.lineupOrder = state.lineupOrder.filter(pid => pid !== id);
  const pos = getPositionOfPlayer(id);
  if (pos) delete state.positions[pos];
  render();
}

function autoFillField() {
  const active = getActivePositions();

  // Pass 1: primary positions
  getUnassignedPlayers().forEach(p => {
    if (p.pos1 !== 'EH' && active[p.pos1] && !state.positions[p.pos1]) {
      state.positions[p.pos1] = p.id;
    }
  });

  // Pass 2: secondary positions
  getUnassignedPlayers().forEach(p => {
    if (p.pos2 && p.pos2 !== '—' && p.pos2 !== 'EH' && active[p.pos2] && !state.positions[p.pos2]) {
      state.positions[p.pos2] = p.id;
    }
  });

  // Pass 3: tertiary positions
  getUnassignedPlayers().forEach(p => {
    if (p.pos3 && p.pos3 !== '—' && p.pos3 !== 'EH' && active[p.pos3] && !state.positions[p.pos3]) {
      state.positions[p.pos3] = p.id;
    }
  });

  // Pass 4: fill remaining with any leftover players (non-EH first)
  const remaining = getUnassignedPlayers()
    .filter(p => p.pos1 !== 'EH')
    .concat(getUnassignedPlayers().filter(p => p.pos1 === 'EH'));

  const openSpots = Object.keys(active).filter(pos => !state.positions[pos]);
  openSpots.forEach((pos, i) => {
    if (remaining[i]) state.positions[pos] = remaining[i].id;
  });

  render();
}

// ==== SMART FILL (lineup from attributes) ====
function smartFill() {
  if (state.roster.length === 0) {
    alert('Add players first.');
    return;
  }

  // Bucket players by their primary "slot"
  // Priority: spot 1-2 leadoff/speedy/patient, 3-5 power, 6-7 contact/linedrive, 8+ rest
  const top = [];       // spots 1-2
  const power = [];     // spots 3-5
  const contact = [];   // spots 6-7
  const bottom = [];    // spots 8+

  // Score-based buckets. Strongest tag wins.
  state.roster.forEach(p => {
    const tags = new Set(p.tags || []);
    if (tags.has('leadoff') || tags.has('speedy')) {
      top.push(p);
    } else if (tags.has('power')) {
      power.push(p);
    } else if (tags.has('patient') && top.length < 2) {
      top.push(p);
    } else if (tags.has('linedrive') || tags.has('contact')) {
      contact.push(p);
    } else {
      bottom.push(p);
    }
  });

  // Balance: if a bucket is empty but another is overflowing, rebalance
  // (e.g. no power hitters means contact moves up)
  const ordered = [];
  const takeFrom = (buckets) => {
    for (const b of buckets) {
      if (b.length > 0) return b.shift();
    }
    return null;
  };

  // Target slots with fallback buckets
  const slots = [
    ['top', [top, contact, power, bottom]],       // 1
    ['top', [top, contact, power, bottom]],       // 2
    ['power', [power, contact, top, bottom]],     // 3
    ['power', [power, contact, top, bottom]],     // 4
    ['power', [power, contact, top, bottom]],     // 5
    ['contact', [contact, top, bottom, power]],   // 6
    ['contact', [contact, bottom, top, power]],   // 7
    ['bottom', [bottom, contact, top, power]],    // 8
    ['bottom', [bottom, contact, top, power]],    // 9
    ['bottom', [bottom, contact, top, power]],    // 10
    ['bottom', [bottom, contact, top, power]],    // 11
    ['bottom', [bottom, contact, top, power]],    // 12+
    ['bottom', [bottom, contact, top, power]],
    ['bottom', [bottom, contact, top, power]],
    ['bottom', [bottom, contact, top, power]],
  ];

  for (const [, fallbacks] of slots) {
    if (top.length + power.length + contact.length + bottom.length === 0) break;
    const next = takeFrom(fallbacks);
    if (next) ordered.push(next);
  }

  state.lineupOrder = ordered.map(p => p.id);

  // Build explanation
  const counts = {
    top: state.roster.filter(p => (p.tags||[]).some(t => ['leadoff','speedy','patient'].includes(t))).length,
    power: state.roster.filter(p => (p.tags||[]).includes('power')).length,
    contact: state.roster.filter(p => (p.tags||[]).some(t => ['contact','linedrive'].includes(t))).length,
    untagged: state.roster.filter(p => !p.tags || p.tags.length === 0).length,
  };

  const parts = [];
  if (counts.top > 0) parts.push(`${counts.top} speed/lead-off → top of order`);
  if (counts.power > 0) parts.push(`${counts.power} power → 3-5 slots`);
  if (counts.contact > 0) parts.push(`${counts.contact} contact/line-drive → middle`);
  if (counts.untagged > 0) parts.push(`${counts.untagged} untagged → bottom of order`);

  const explanation = parts.length > 0
    ? parts.join(' · ')
    : 'No attributes set yet — players placed in current order. Add attributes via player edit for smarter fills.';

  showSmartExplanation(explanation);
  render();
}

function showSmartExplanation(text) {
  const el = document.getElementById('smartExplain');
  if (!el) return;
  el.innerHTML = `
    <span class="icon">✨</span>
    <div class="text">
      <strong>Smart Fill applied</strong>
      ${escapeHtml(text)}
    </div>
    <button class="close" id="smartExplainClose">×</button>
  `;
  el.style.display = 'flex';
  document.getElementById('smartExplainClose').addEventListener('click', () => {
    el.style.display = 'none';
  });
}

function setMode(mode) {
  if (mode === state.mode) return;
  const newActive = { ...FIELD_POSITIONS.common, ...FIELD_POSITIONS[mode] };
  for (const posKey in state.positions) {
    if (!newActive[posKey]) delete state.positions[posKey];
  }
  state.mode = mode;
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  render();
}

function clearAll() {
  if (!confirm('Clear current roster, lineup, and field? (Saved games in History are not affected.)')) return;
  resetState();
  render();
}

function resetState() {
  state.roster = [];
  state.lineupOrder = [];
  state.positions = {};
  state.team = '';
  state.opponent = '';
  state.gameType = 'League';
  state.league = '';
  state.park = '';
  state.date = todayISO();
}

function saveAndStartNew() {
  if (state.roster.length === 0) {
    alert('Add at least one player before saving.');
    return;
  }
  // Require team name via dialog (reuse the existing save dialog logic, but flag that we want to reset after)
  pendingResetAfterSave = true;
  openSaveDialog();
}

// ==== SAVE / LOAD ====
function openSaveDialog() {
  if (state.roster.length === 0) {
    alert('Add at least one player before saving.');
    return;
  }
  document.getElementById('dlgTeam').value = state.team || '';
  document.getElementById('dlgOpponent').value = state.opponent || '';
  document.getElementById('dlgType').value = state.gameType || 'League';
  document.getElementById('dlgLeague').value = state.league || '';
  document.getElementById('dlgPark').value = state.park || '';
  document.getElementById('dlgDate').value = state.date || todayISO();
  document.getElementById('saveDialog').style.display = 'flex';
  setTimeout(() => document.getElementById('dlgTeam').focus(), 50);
}

function closeSaveDialog() {
  document.getElementById('saveDialog').style.display = 'none';
  pendingResetAfterSave = false; // cancel resets the flag too
}

function confirmSave() {
  const team = document.getElementById('dlgTeam').value.trim();
  const opponent = document.getElementById('dlgOpponent').value.trim();
  const gameType = document.getElementById('dlgType').value || 'League';
  const league = document.getElementById('dlgLeague').value.trim();
  const park = document.getElementById('dlgPark').value.trim();
  const date = document.getElementById('dlgDate').value || todayISO();

  if (!team) {
    alert('Please enter a team name.');
    document.getElementById('dlgTeam').focus();
    return;
  }

  state.team = team;
  state.opponent = opponent;
  state.gameType = gameType;
  state.league = league;
  state.park = park;
  state.date = date;

  const snapshot = JSON.parse(JSON.stringify({
    mode: state.mode,
    team, opponent, gameType, league, park, date,
    roster: state.roster,
    lineupOrder: state.lineupOrder,
    positions: state.positions,
  }));

  history.push({
    id: uid(),
    savedAt: Date.now(),
    snapshot
  });

  saveHistory();
  document.getElementById('saveDialog').style.display = 'none';

  const shouldReset = pendingResetAfterSave;
  pendingResetAfterSave = false;

  if (shouldReset) {
    resetState();
    switchTab('roster');
    render();
    // Flash confirmation on whichever button is visible
    flashButton('saveAndNewBtn', '✓ Saved! Fresh roster ready.');
  } else {
    render();
    flashButton('saveGameBtn', '✓ Saved to History!');
  }
}

function flashButton(id, msg) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const original = btn.innerHTML;
  btn.innerHTML = msg;
  btn.disabled = true;
  setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 1400);
}

function loadFromHistory(id) {
  const entry = history.find(h => h.id === id);
  if (!entry) return;
  const snap = entry.snapshot;
  const migratedRoster = (snap.roster || []).map(p => ({
    id: p.id || uid(),
    name: p.name,
    pos1: p.pos1 || 'EH',
    pos2: p.pos2 || '—',
    pos3: p.pos3 || '—',
    tags: Array.isArray(p.tags) ? p.tags : [],
  }));
  state = {
    mode: snap.mode || 'mm',
    team: snap.team || '',
    opponent: snap.opponent || '',
    gameType: snap.gameType || 'League',
    league: snap.league || '',
    park: snap.park || '',
    date: snap.date || todayISO(),
    roster: migratedRoster,
    lineupOrder: [...(snap.lineupOrder || [])],
    positions: { ...(snap.positions || {}) },
  };
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === state.mode);
  });
  switchTab('game');
  render();
}

function deleteFromHistory(id) {
  const entry = history.find(h => h.id === id);
  if (!entry) return;
  if (!confirm(`Delete saved game for "${entry.snapshot.team}" on ${formatPrettyDate(entry.snapshot.date)}?`)) return;
  history = history.filter(h => h.id !== id);
  saveHistory();
  render();
}

function loadTestLineup() {
  if (state.roster.length > 0) {
    if (!confirm('This will replace your current roster and lineup with the test lineup. Continue?')) return;
  }
  state.mode = TEST_LINEUP.mode;
  state.team = TEST_LINEUP.team;
  state.league = TEST_LINEUP.league;
  state.date = todayISO();
  state.roster = TEST_LINEUP.roster.map(p => ({ id: uid(), ...p }));
  state.lineupOrder = state.roster.map(p => p.id);
  state.positions = {};

  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === state.mode);
  });

  const active = getActivePositions();
  state.roster.forEach(p => {
    if (p.pos1 !== 'EH' && active[p.pos1] && !state.positions[p.pos1]) {
      state.positions[p.pos1] = p.id;
    }
  });

  switchTab('game');
  render();
}

// ==== EDIT PLAYER DIALOG ====
let editingPlayerId = null;
let editingTags = new Set();

function openEditDialog(pid) {
  const p = playerById(pid);
  if (!p) return;
  editingPlayerId = pid;
  editingTags = new Set(p.tags || []);
  document.getElementById('editDialogTitle').textContent = `Edit ${p.name}`;
  document.getElementById('editName').value = p.name;
  document.getElementById('editPos1').value = p.pos1 || 'EH';
  document.getElementById('editPos2').value = p.pos2 || '—';
  document.getElementById('editPos3').value = p.pos3 || '—';
  renderEditTags();
  document.getElementById('editDialog').style.display = 'flex';
  setTimeout(() => document.getElementById('editName').focus(), 50);
}

function renderEditTags() {
  const wrap = document.getElementById('editTags');
  wrap.innerHTML = '';
  TAGS.forEach(t => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip' + (editingTags.has(t.id) ? ' on' : '');
    chip.textContent = t.label;
    chip.addEventListener('click', () => {
      if (editingTags.has(t.id)) editingTags.delete(t.id);
      else editingTags.add(t.id);
      renderEditTags();
    });
    wrap.appendChild(chip);
  });
}

function closeEditDialog() {
  document.getElementById('editDialog').style.display = 'none';
  editingPlayerId = null;
  editingTags = new Set();
}

function confirmEdit() {
  if (!editingPlayerId) return;
  const p = playerById(editingPlayerId);
  if (!p) { closeEditDialog(); return; }

  const name = document.getElementById('editName').value.trim();
  if (!name) {
    alert('Name cannot be empty.');
    document.getElementById('editName').focus();
    return;
  }
  const pos1 = document.getElementById('editPos1').value;
  const pos2 = document.getElementById('editPos2').value;
  const pos3 = document.getElementById('editPos3').value;

  p.name = name;
  p.pos1 = pos1;
  p.pos2 = pos2;
  p.pos3 = pos3;
  p.tags = Array.from(editingTags);

  closeEditDialog();
  render();
}

function confirmDeleteFromEdit() {
  if (!editingPlayerId) return;
  const p = playerById(editingPlayerId);
  if (!p) return;
  const pid = editingPlayerId;
  // Close the dialog FIRST so the native confirm() doesn't get dismissed
  // by the dialog's backdrop-click handler.
  closeEditDialog();
  if (!confirm(`Remove ${p.name} from the roster?`)) return;
  removePlayer(pid);
  render();
}

// ==== DUPLICATE ROSTER DIALOG ====
let duplicatingFromId = null;
let duplicatePicks = new Set(); // player IDs selected to carry over

function openDuplicateDialog(historyId) {
  const entry = history.find(h => h.id === historyId);
  if (!entry) return;

  // If current roster isn't empty, confirm overwrite
  if (state.roster.length > 0) {
    if (!confirm('This will replace your current roster. Save first if you need to keep it. Continue?')) {
      return;
    }
  }

  duplicatingFromId = historyId;
  // Default: all players selected
  duplicatePicks = new Set(entry.snapshot.roster.map(p => p.id || p.name));

  document.getElementById('duplicateDialogTitle').textContent =
    `Duplicate from: ${entry.snapshot.team || 'Untitled'}`;

  renderDuplicateList();
  document.getElementById('duplicateDialog').style.display = 'flex';
}

function renderDuplicateList() {
  const entry = history.find(h => h.id === duplicatingFromId);
  if (!entry) return;
  const list = document.getElementById('duplicateList');
  list.innerHTML = '';

  entry.snapshot.roster.forEach(p => {
    const key = p.id || p.name;
    const checked = duplicatePicks.has(key);
    const row = document.createElement('div');
    row.className = 'dup-row' + (checked ? ' checked' : '');

    const pos2Html = (p.pos2 && p.pos2 !== '—')
      ? `<span class="pos-pill secondary">${p.pos2}</span>` : '';
    const pos3Html = (p.pos3 && p.pos3 !== '—')
      ? `<span class="pos-pill tertiary">${p.pos3}</span>` : '';

    row.innerHTML = `
      <input type="checkbox" ${checked ? 'checked' : ''}>
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="positions">
        <span class="pos-pill primary">${p.pos1}</span>
        ${pos2Html}
        ${pos3Html}
      </div>
    `;

    row.addEventListener('click', (e) => {
      if (duplicatePicks.has(key)) {
        duplicatePicks.delete(key);
      } else {
        duplicatePicks.add(key);
      }
      renderDuplicateList();
    });

    list.appendChild(row);
  });
}

function closeDuplicateDialog() {
  document.getElementById('duplicateDialog').style.display = 'none';
  duplicatingFromId = null;
  duplicatePicks.clear();
}

function duplicateSelectAll() {
  const entry = history.find(h => h.id === duplicatingFromId);
  if (!entry) return;
  duplicatePicks = new Set(entry.snapshot.roster.map(p => p.id || p.name));
  renderDuplicateList();
}

function duplicateSelectNone() {
  duplicatePicks.clear();
  renderDuplicateList();
}

function confirmDuplicate() {
  const entry = history.find(h => h.id === duplicatingFromId);
  if (!entry) return;

  const pickedPlayers = entry.snapshot.roster.filter(p => duplicatePicks.has(p.id || p.name));

  if (pickedPlayers.length === 0) {
    alert('Pick at least one player to carry over.');
    return;
  }

  // Build fresh state with picked players (give new IDs to avoid collision with saved state)
  resetState();
  state.mode = entry.snapshot.mode || 'mm';
  state.roster = pickedPlayers.map(p => ({
    id: uid(),
    name: p.name,
    pos1: p.pos1 || 'EH',
    pos2: p.pos2 || '—',
    pos3: p.pos3 || '—',
    tags: Array.isArray(p.tags) ? [...p.tags] : [],
  }));
  state.lineupOrder = state.roster.map(p => p.id);

  // Auto-assign positions based on primary
  const active = getActivePositions();
  state.roster.forEach(p => {
    if (p.pos1 !== 'EH' && active[p.pos1] && !state.positions[p.pos1]) {
      state.positions[p.pos1] = p.id;
    }
  });

  // Reflect mode on UI
  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === state.mode);
  });

  closeDuplicateDialog();
  switchTab('roster');
  render();
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  window.scrollTo(0, 0);
}

// ==== INIT ====
function init() {
  populateDropdowns();

  // Bench drop zone
  const benchEl = document.getElementById('bench');
  benchEl.addEventListener('dragover', e => {
    if (!draggedPlayerId) return;
    e.preventDefault();
    benchEl.classList.add('drag-over');
  });
  benchEl.addEventListener('dragleave', () => benchEl.classList.remove('drag-over'));
  benchEl.addEventListener('drop', e => {
    e.preventDefault();
    benchEl.classList.remove('drag-over');
    if (!draggedPlayerId) return;
    movePlayerToBench(draggedPlayerId);
  });

  document.getElementById('addBtn').addEventListener('click', addPlayer);
  document.getElementById('playerName').addEventListener('keydown', e => {
    if (e.key === 'Enter') addPlayer();
  });
  document.getElementById('autoFillBtn').addEventListener('click', autoFillField);
  document.getElementById('smartFillBtn').addEventListener('click', smartFill);
  document.getElementById('clearBtn').addEventListener('click', clearAll);
  document.getElementById('saveAndNewBtn').addEventListener('click', saveAndStartNew);
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Meta fields live update
  document.getElementById('teamName').addEventListener('input', e => { state.team = e.target.value; saveState(); });
  document.getElementById('opponentName').addEventListener('input', e => { state.opponent = e.target.value; renderFieldLabel(); saveState(); });
  document.getElementById('gameType').addEventListener('change', e => { state.gameType = e.target.value; saveState(); });
  document.getElementById('leagueName').addEventListener('input', e => { state.league = e.target.value; saveState(); });
  document.getElementById('parkName').addEventListener('input', e => { state.park = e.target.value; renderFieldLabel(); saveState(); });
  document.getElementById('gameDate').addEventListener('change', e => { state.date = e.target.value; renderFieldLabel(); saveState(); });

  // Save dialog
  document.getElementById('saveGameBtn').addEventListener('click', openSaveDialog);
  document.getElementById('dlgCancel').addEventListener('click', closeSaveDialog);
  document.getElementById('dlgConfirm').addEventListener('click', confirmSave);
  document.getElementById('saveDialog').addEventListener('click', e => {
    if (e.target.id === 'saveDialog') closeSaveDialog();
  });

  // Edit dialog
  document.getElementById('editCancel').addEventListener('click', closeEditDialog);
  document.getElementById('editConfirm').addEventListener('click', confirmEdit);
  document.getElementById('editDelete').addEventListener('click', confirmDeleteFromEdit);
  document.getElementById('editDialog').addEventListener('click', e => {
    if (e.target.id === 'editDialog') closeEditDialog();
  });

  // Duplicate dialog
  document.getElementById('dupCancel').addEventListener('click', closeDuplicateDialog);
  document.getElementById('dupConfirm').addEventListener('click', confirmDuplicate);
  document.getElementById('dupSelectAll').addEventListener('click', duplicateSelectAll);
  document.getElementById('dupSelectNone').addEventListener('click', duplicateSelectNone);
  document.getElementById('duplicateDialog').addEventListener('click', e => {
    if (e.target.id === 'duplicateDialog') closeDuplicateDialog();
  });

  document.getElementById('loadTestBtn').addEventListener('click', loadTestLineup);

  loadState();
  loadHistory();

  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === state.mode);
  });

  if (state.roster.length === 0 && history.length === 0) {
    loadTestLineup();
  } else {
    render();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
