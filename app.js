// ==== CONFIG ====
const STATE_KEY = 'dugout_state_v7';
const HISTORY_KEY = 'dugout_history_v7';
const MAX_PLAYERS = 15;

// Player attribute tags (5 batting traits — checkbox style)
const TAGS = [
  { id: 'speed',     label: 'Speed' },
  { id: 'power',     label: 'Power' },
  { id: 'contact',   label: 'Contact' },
  { id: 'patient',   label: 'Patient' },
  { id: 'freeswing', label: 'Free swinger' },
];

// Primary strength options (the dropdown — drives Smart Fill placement)
const PRIMARY_OPTIONS = [
  { val: '—',       label: '— (none)' },
  { val: 'speed',   label: 'Speed' },
  { val: 'power',   label: 'Power' },
  { val: 'contact', label: 'Contact' },
  { val: 'patient', label: 'Patient' },
];

// Skill level (USSSA-style ladder, lowest → highest)
// Used as a tiebreaker in Smart Fill: higher skill bats earlier when tags are equal
const SKILL_LEVELS = ['—', 'Rec', 'E', 'E+', 'D', 'D+', 'C', 'B', 'A'];
const SKILL_RANK = { '—': 0, 'Rec': 1, 'E': 2, 'E+': 3, 'D': 4, 'D+': 5, 'C': 6, 'B': 7, 'A': 8 };

// Gender values
const GENDERS = ['—', 'M', 'F'];

// League formats
const LEAGUE_FORMATS = [
  { val: 'mens',   label: "Men's" },
  { val: 'womens', label: "Women's" },
  { val: 'coed',   label: 'Coed' },
];

// Migration map: old tag ids → new tag ids (for users upgrading from v6)
const TAG_MIGRATION = {
  'leadoff':   'speed',     // lead-off → speed
  'speedy':    'speed',
  'contact':   'contact',
  'linedrive': 'contact',   // line drive → contact
  'power':     'power',
  'patient':   'patient',
  'glove':     null,        // dropped — fielding tag, no equivalent
  'utility':   null,        // dropped
  'rookie':    null,        // dropped
};

function tagLabel(id) {
  const t = TAGS.find(x => x.id === id);
  return t ? t.label : id;
}

function migrateTags(oldTags) {
  if (!Array.isArray(oldTags)) return [];
  const newTags = new Set();
  oldTags.forEach(t => {
    if (TAG_MIGRATION.hasOwnProperty(t)) {
      const mapped = TAG_MIGRATION[t];
      if (mapped) newTags.add(mapped);
    } else if (TAGS.find(x => x.id === t)) {
      // already a new-style tag
      newTags.add(t);
    }
  });
  return Array.from(newTags);
}

const FIELD_POSITIONS = {
  common: {
    P:  { x: 50, y: 70, label: 'P' },
    C:  { x: 50, y: 95, label: 'C' },
    '1B': { x: 72, y: 75, label: '1B' },
    '2B': { x: 64, y: 55, label: '2B' },
    '3B': { x: 28, y: 75, label: '3B' },
    SS: { x: 36, y: 55, label: 'SS' },
    LF: { x: 12, y: 32, label: 'LF' },
    RF: { x: 88, y: 32, label: 'RF' },
  },
  '4of': {
    LC: { x: 35, y: 22, label: 'LC' },
    RC: { x: 65, y: 22, label: 'RC' },
  },
  mm: {
    CF: { x: 50, y: 20, label: 'CF' },
    MM: { x: 50, y: 42, label: 'MM' },
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
  team: 'Demo Team',
  league: 'Demo League',
  leagueFormat: 'coed',
  roster: [
    // 3 D males (top tier)
    { name: 'Alex',    gender: 'M', skill: 'D',   pos1: 'SS', pos2: '2B', pos3: '—',  tags: ['speed', 'patient'],   primary: 'speed' },
    { name: 'Sam',     gender: 'M', skill: 'D',   pos1: '1B', pos2: '3B', pos3: '—',  tags: ['power', 'contact'],   primary: 'power' },
    { name: 'Jordan',  gender: 'M', skill: 'D',   pos1: '3B', pos2: 'P',  pos3: '—',  tags: ['power'],              primary: 'power' },
    // E+ / E males
    { name: 'Casey',   gender: 'M', skill: 'E+',  pos1: 'CF', pos2: 'LF', pos3: '—',  tags: ['contact', 'patient'], primary: 'contact' },
    { name: 'Riley',   gender: 'M', skill: 'E',   pos1: 'RF', pos2: 'CF', pos3: '—',  tags: ['speed'],              primary: 'speed' },
    { name: 'Avery',   gender: 'M', skill: 'E',   pos1: 'C',  pos2: '—',  pos3: '—',  tags: ['freeswing'],          primary: '—' },
    // Rec male
    { name: 'Drew',    gender: 'M', skill: 'Rec', pos1: 'EH', pos2: '—',  pos3: '—',  tags: ['contact'],            primary: 'contact' },
    // 5 women (E+, E, E, Rec, Rec)
    { name: 'Quinn',   gender: 'F', skill: 'E+',  pos1: '2B', pos2: 'SS', pos3: '—',  tags: ['power', 'contact'],   primary: 'power' },
    { name: 'Morgan',  gender: 'F', skill: 'E',   pos1: 'MM', pos2: '2B', pos3: '—',  tags: ['speed', 'patient'],   primary: 'speed' },
    { name: 'Taylor',  gender: 'F', skill: 'E',   pos1: 'LF', pos2: 'RF', pos3: '—',  tags: ['contact'],            primary: 'contact' },
    { name: 'Reese',   gender: 'F', skill: 'Rec', pos1: 'P',  pos2: '—',  pos3: '—',  tags: ['patient'],            primary: 'patient' },
    { name: 'Skyler',  gender: 'F', skill: 'Rec', pos1: 'EH', pos2: '—',  pos3: '—',  tags: [],                     primary: '—' },
  ]
};

let state = {
  mode: 'mm',
  team: '',
  opponent: '',
  gameType: 'League',
  leagueFormat: 'mens',
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
    if (!raw) raw = localStorage.getItem('dugout_state_v6');
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
          tags: migrateTags(p.tags),
          gender: GENDERS.includes(p.gender) ? p.gender : '—',
          skill: SKILL_LEVELS.includes(p.skill) ? p.skill : '—',
          primary: PRIMARY_OPTIONS.find(o => o.val === p.primary) ? p.primary : '—',
        }));
      }
      state = {
        mode: 'mm', team: '', opponent: '', gameType: 'League', leagueFormat: 'mens',
        league: '', park: '', date: todayISO(),
        roster: [], lineupOrder: [], positions: {},
        ...loaded
      };
      if (!state.date) state.date = todayISO();
      if (!state.park) state.park = '';
      if (!state.opponent) state.opponent = '';
      if (!state.gameType) state.gameType = 'League';
      if (!LEAGUE_FORMATS.find(f => f.val === state.leagueFormat)) state.leagueFormat = 'mens';
    }
  } catch(e) {}
}

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(e) {}
}
function loadHistory() {
  try {
    let raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) raw = localStorage.getItem('dugout_history_v6');
    if (!raw) raw = localStorage.getItem('dugout_history_v5');
    if (!raw) raw = localStorage.getItem('dugout_history_v4');
    if (raw) history = JSON.parse(raw) || [];
  } catch(e) {}
}

function uid() { return Math.random().toString(36).slice(2, 10); }
function playerById(id) { return state.roster.find(p => p.id === id); }

// ==== CUSTOM CONFIRM DIALOG ====
// Used instead of native confirm() because Claude's preview iframe (and some other
// embedded contexts) block modal dialogs silently. Returns a Promise<boolean>.
function askConfirm(message, opts = {}) {
  return new Promise(resolve => {
    const dlg = document.getElementById('confirmDialog');
    const titleEl = document.getElementById('confirmDialogTitle');
    const msgEl = document.getElementById('confirmDialogMsg');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    titleEl.textContent = opts.title || 'Confirm';
    msgEl.textContent = message;
    okBtn.textContent = opts.okLabel || 'OK';
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';
    if (opts.danger) {
      okBtn.classList.remove('primary');
      okBtn.classList.add('danger');
    } else {
      okBtn.classList.remove('danger');
      okBtn.classList.add('primary');
    }

    const cleanup = () => {
      dlg.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      dlg.removeEventListener('click', onBackdrop);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const onBackdrop = (e) => { if (e.target.id === 'confirmDialog') { cleanup(); resolve(false); } };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    dlg.addEventListener('click', onBackdrop);

    dlg.style.display = 'flex';
  });
}
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

  // Skill level dropdowns (Add + Edit)
  const skillOpts = SKILL_LEVELS.map(s =>
    `<option value="${s}">${s === '—' ? '— (none)' : s}</option>`).join('');
  document.getElementById('playerSkill').innerHTML = skillOpts;
  document.getElementById('editSkill').innerHTML = skillOpts;

  // Primary strength dropdowns (Edit only — keeps Add form simple)
  const primOpts = PRIMARY_OPTIONS.map(o =>
    `<option value="${o.val}">${o.label}</option>`).join('');
  document.getElementById('editPrimary').innerHTML = primOpts;

  // League Format dropdown
  const fmtOpts = LEAGUE_FORMATS.map(f =>
    `<option value="${f.val}">${f.label}</option>`).join('');
  document.getElementById('leagueFormat').innerHTML = fmtOpts;
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
  renderValidityIndicator();
  saveState();
}

// ==== COED VALIDATION ====
// Returns { valid: bool, issues: [strings] } describing any rule violations.
// Only meaningful when state.leagueFormat === 'coed'.
function validateCoedLineup() {
  const issues = [];
  if (state.leagueFormat !== 'coed') return { valid: true, issues };

  const lineupGenders = state.lineupOrder
    .map(pid => playerById(pid))
    .filter(p => p)
    .map(p => p.gender);

  // Rule 1: at least 3 women in top 10
  const top10 = lineupGenders.slice(0, 10);
  const womenInTop10 = top10.filter(g => g === 'F').length;
  if (womenInTop10 < 3) {
    const need = 3 - womenInTop10;
    issues.push(`Need ${need} more woman${need > 1 ? 'en' : ''} in top 10`);
  }

  // Rule 2: no back-to-back women anywhere in the order
  const backToBack = [];
  for (let i = 0; i < lineupGenders.length - 1; i++) {
    if (lineupGenders[i] === 'F' && lineupGenders[i + 1] === 'F') {
      backToBack.push(`spots ${i + 1} and ${i + 2}`);
    }
  }
  if (backToBack.length > 0) {
    issues.push(`Women back-to-back at ${backToBack.join(', ')}`);
  }

  return { valid: issues.length === 0, issues };
}

function renderValidityIndicator() {
  const el = document.getElementById('validityIndicator');
  if (!el) return;
  if (state.leagueFormat !== 'coed') {
    el.style.display = 'none';
    el.classList.remove('expanded');
    return;
  }
  el.style.display = 'block';
  const { valid, issues } = validateCoedLineup();
  if (valid) {
    el.classList.remove('invalid', 'expanded');
    el.classList.add('valid');
    el.innerHTML = `<span class="validity-pill">✓ Valid Lineup</span>`;
  } else {
    el.classList.remove('valid');
    el.classList.add('invalid');
    const issueHtml = issues.map(i => `<li>${escapeHtml(i)}</li>`).join('');
    el.innerHTML = `
      <span class="validity-pill">✗ Invalid Lineup</span>
      <ul class="validity-reasons">${issueHtml}</ul>
    `;
  }
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
  const lf = document.getElementById('leagueFormat');
  const l = document.getElementById('leagueName');
  const p = document.getElementById('parkName');
  const d = document.getElementById('gameDate');
  if (t && document.activeElement !== t) t.value = state.team || '';
  if (opp && document.activeElement !== opp) opp.value = state.opponent || '';
  if (gt && document.activeElement !== gt) gt.value = state.gameType || 'League';
  if (lf && document.activeElement !== lf) lf.value = state.leagueFormat || 'mens';
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
    const genderHtml = (p.gender && p.gender !== '—')
      ? `<span class="gender-badge ${p.gender === 'F' ? 'g-f' : 'g-m'}">${p.gender}</span>` : '';
    const skillHtml = (p.skill && p.skill !== '—')
      ? `<span class="skill-badge">${escapeHtml(p.skill)}</span>` : '';
    row.innerHTML = `
      <div class="name">${escapeHtml(p.name)}${genderHtml}${skillHtml}</div>
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
    const genderHtml = (p.gender && p.gender !== '—')
      ? `<span class="gender-badge gb-inline ${p.gender === 'F' ? 'g-f' : 'g-m'}">${p.gender}</span>` : '';

    const li = document.createElement('li');
    li.className = 'lineup-item';
    li.draggable = true;
    li.dataset.pid = pid;
    li.innerHTML = `
      <span class="order-num">${idx + 1}</span>
      <span class="player-name">${escapeHtml(p.name)}${genderHtml}</span>
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
  const skill = document.getElementById('playerSkill').value || '—';
  // Read gender from the chip group (active chip)
  const genderChip = document.querySelector('#playerGenderChips .gender-chip.on');
  const gender = genderChip ? genderChip.dataset.gender : '—';

  const id = uid();
  state.roster.push({
    id, name, pos1, pos2, pos3,
    tags: [], primary: '—',
    gender, skill,
  });
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
  // Reset gender chip selection to '—' for next entry
  resetAddFormGender();
  render();
}

function resetAddFormGender() {
  document.querySelectorAll('#playerGenderChips .gender-chip').forEach(c => {
    c.classList.toggle('on', c.dataset.gender === '—');
  });
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

  // Clear all current position assignments first — so this button always does
  // something visible. (Previously it only filled empty spots; if the field
  // was already full, nothing changed.)
  state.positions = {};

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
//
// New algorithm:
// 1. Compute each player's "preferred slot range" from their primary strength
//    (or first matching tag) — like a SQL CASE statement assigning a bucket.
// 2. Within each bucket, sort by skill rank (higher = bats earlier).
// 3. Pour buckets into the order: top → power → contact → bottom.
// 4. If Coed format: shuffle to satisfy the 3-women-in-top-10 + no-back-to-back rules.
function smartFill() {
  if (state.roster.length === 0) {
    alert('Add players first.');
    return;
  }

  // Helper: pick the "preferred bucket" for a player
  // "primary" dropdown beats tags; tags are checked in priority order.
  function bucketOf(p) {
    const prim = p.primary && p.primary !== '—' ? p.primary : null;
    const tags = new Set(p.tags || []);

    if (prim === 'speed' || prim === 'patient')   return 'top';
    if (prim === 'power')                          return 'power';
    if (prim === 'contact')                        return 'contact';

    // Fall through to tags
    if (tags.has('speed'))    return 'top';
    if (tags.has('power'))    return 'power';
    if (tags.has('contact'))  return 'contact';
    if (tags.has('patient'))  return 'top';
    return 'bottom';
  }

  // Bucket players
  const buckets = { top: [], power: [], contact: [], bottom: [] };
  state.roster.forEach(p => {
    buckets[bucketOf(p)].push(p);
  });

  // Sort each bucket by skill rank (descending) — better players bat earlier within their bucket
  Object.values(buckets).forEach(b => {
    b.sort((a, c) => (SKILL_RANK[c.skill] || 0) - (SKILL_RANK[a.skill] || 0));
  });

  // Pour buckets into a single order:
  // Slots 1-2 from top, 3-5 from power, 6-7 from contact, 8+ from bottom
  // Each bucket falls back to neighbors if exhausted
  const ordered = [];
  const slotPlan = [
    ['top', 'contact', 'power', 'bottom'],     // 1
    ['top', 'contact', 'power', 'bottom'],     // 2
    ['power', 'contact', 'top', 'bottom'],     // 3
    ['power', 'contact', 'top', 'bottom'],     // 4
    ['power', 'contact', 'top', 'bottom'],     // 5
    ['contact', 'top', 'bottom', 'power'],     // 6
    ['contact', 'bottom', 'top', 'power'],     // 7
    ['bottom', 'contact', 'top', 'power'],     // 8
    ['bottom', 'contact', 'top', 'power'],     // 9
    ['bottom', 'contact', 'top', 'power'],     // 10
    ['bottom', 'contact', 'top', 'power'],     // 11+
    ['bottom', 'contact', 'top', 'power'],
    ['bottom', 'contact', 'top', 'power'],
    ['bottom', 'contact', 'top', 'power'],
    ['bottom', 'contact', 'top', 'power'],
  ];

  const totalLeft = () => buckets.top.length + buckets.power.length + buckets.contact.length + buckets.bottom.length;
  for (const fallbacks of slotPlan) {
    if (totalLeft() === 0) break;
    for (const b of fallbacks) {
      if (buckets[b].length > 0) {
        ordered.push(buckets[b].shift());
        break;
      }
    }
  }

  // Coed reshuffle: if format is Coed, try to satisfy the rules
  let coedNote = '';
  if (state.leagueFormat === 'coed') {
    const result = applyCoedRules(ordered);
    coedNote = result.note;
  }

  state.lineupOrder = ordered.map(p => p.id);

  // Build explanation
  const counts = {
    top: state.roster.filter(p => bucketOf(p) === 'top').length,
    power: state.roster.filter(p => bucketOf(p) === 'power').length,
    contact: state.roster.filter(p => bucketOf(p) === 'contact').length,
    bottom: state.roster.filter(p => bucketOf(p) === 'bottom').length,
  };

  const parts = [];
  if (counts.top > 0) parts.push(`${counts.top} speed/patient → top`);
  if (counts.power > 0) parts.push(`${counts.power} power → 3-5`);
  if (counts.contact > 0) parts.push(`${counts.contact} contact → middle`);
  if (counts.bottom > 0) parts.push(`${counts.bottom} other → bottom`);
  if (coedNote) parts.push(coedNote);

  const explanation = parts.length > 0
    ? parts.join(' · ')
    : 'No attributes set yet — players placed in current order. Tap a player to set tags and primary strength.';

  showSmartExplanation(explanation);
  render();
}

// Mutates `ordered` (array of player objects) in-place to satisfy coed rules:
//  - At least 3 women in top 10
//  - No two women in adjacent spots
// Returns { note: string } describing what it did.
function applyCoedRules(ordered) {
  const n = ordered.length;
  if (n === 0) return { note: '' };

  const womenIdx = ordered.map((p, i) => p.gender === 'F' ? i : -1).filter(i => i >= 0);
  const womenCount = womenIdx.length;

  if (womenCount === 0) {
    return { note: 'Coed: no women on roster' };
  }

  // Pick target slots for women (1-indexed positions): try 2, 5, 8, 11 — well-spaced
  // If we have more women than that, add 4, 7, 10 etc.
  // Goal: at least 3 in top 10, no two adjacent.
  const targetSlots = pickWomenTargetSlots(n, Math.min(womenCount, n));

  // Build new order: for each slot, decide if it should be a woman or a man,
  // then pick the highest-priority remaining player of that gender
  const placed = new Array(n).fill(null);
  const womenPool = ordered.filter(p => p.gender === 'F');
  const otherPool = ordered.filter(p => p.gender !== 'F');

  // targetSlots is a Set of slot indices (0-based) where women should go
  const targets = new Set(targetSlots);

  for (let i = 0; i < n; i++) {
    if (targets.has(i) && womenPool.length > 0) {
      placed[i] = womenPool.shift();
    }
  }
  // Fill remaining slots: if a target slot was never filled (out of women), or non-target slot,
  // pour from otherPool first, then leftover womenPool
  for (let i = 0; i < n; i++) {
    if (placed[i]) continue;
    if (otherPool.length > 0) {
      placed[i] = otherPool.shift();
    } else if (womenPool.length > 0) {
      placed[i] = womenPool.shift();
    }
  }

  // Replace ordered's contents with placed
  for (let i = 0; i < n; i++) ordered[i] = placed[i];

  // Build note
  const finalWomenSlots = ordered.map((p, i) => p.gender === 'F' ? (i + 1) : null).filter(s => s);
  const womenInTop10 = finalWomenSlots.filter(s => s <= 10).length;
  return {
    note: `Coed: ${womenCount} W placed at ${finalWomenSlots.join(', ')} (${womenInTop10} in top 10)`
  };
}

// Pick slot indices (0-based) for women. n = lineup size, w = women count.
// Strategy: space them out evenly (no two adjacent), prioritize top 10 (need at least 3).
function pickWomenTargetSlots(n, w) {
  if (w === 0) return [];
  const top10 = Math.min(10, n);
  const targets = new Set();

  // Phase 1: lock in 3 women in top 10 at well-spaced positions
  const inTop10 = Math.min(3, w);
  // Aim for slots 1, 4, 7 (or scaled if top10 < 9) — each separated by at least 2
  if (inTop10 === 1) {
    targets.add(Math.floor(top10 / 2));
  } else if (inTop10 === 2) {
    targets.add(1);
    targets.add(Math.min(top10 - 1, 6));
  } else if (inTop10 >= 3) {
    targets.add(1);
    targets.add(4);
    targets.add(7);
  }

  // Phase 2: place remaining women, respecting "no two adjacent"
  let remaining = w - inTop10;

  // Try slot 11+ first (12th batter onward), spaced
  for (let i = 11; i < n && remaining > 0; i += 2) {
    if (!targets.has(i) && !targets.has(i - 1) && !targets.has(i + 1)) {
      targets.add(i);
      remaining--;
    }
  }

  // Phase 3: dense fallback. If still placing women, try odd-only first (since most existing targets are at 1,4,7,11 — even slots are safer)
  // Walk through every slot looking for one where neither neighbor is already a target.
  for (let i = 0; i < n && remaining > 0; i++) {
    if (!targets.has(i) && !targets.has(i - 1) && !targets.has(i + 1)) {
      targets.add(i);
      remaining--;
    }
  }

  // Last-resort: if STILL not done (truly impossible — too many women, can't avoid adjacency)
  // place anywhere we can, accepting violations
  for (let i = 0; i < n && remaining > 0; i++) {
    if (!targets.has(i)) {
      targets.add(i);
      remaining--;
    }
  }

  return Array.from(targets).sort((a, b) => a - b);
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

async function clearAll() {
  const ok = await askConfirm('Clear current roster, lineup, and field? (Saved games in History are not affected.)', { danger: true, okLabel: 'Clear' });
  if (!ok) return;
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
  state.leagueFormat = 'mens';
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
    team, opponent, gameType,
    leagueFormat: state.leagueFormat,
    league, park, date,
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
    tags: migrateTags(p.tags),
    gender: GENDERS.includes(p.gender) ? p.gender : '—',
    skill: SKILL_LEVELS.includes(p.skill) ? p.skill : '—',
    primary: PRIMARY_OPTIONS.find(o => o.val === p.primary) ? p.primary : '—',
  }));
  state = {
    mode: snap.mode || 'mm',
    team: snap.team || '',
    opponent: snap.opponent || '',
    gameType: snap.gameType || 'League',
    leagueFormat: LEAGUE_FORMATS.find(f => f.val === snap.leagueFormat) ? snap.leagueFormat : 'mens',
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

async function deleteFromHistory(id) {
  const entry = history.find(h => h.id === id);
  if (!entry) return;
  const ok = await askConfirm(`Delete saved game for "${entry.snapshot.team}" on ${formatPrettyDate(entry.snapshot.date)}?`, { danger: true, okLabel: 'Delete' });
  if (!ok) return;
  history = history.filter(h => h.id !== id);
  saveHistory();
  render();
}

async function loadTestLineup() {
  if (state.roster.length > 0) {
    const ok = await askConfirm('This will replace your current roster and lineup with the demo lineup. Continue?');
    if (!ok) return;
  }
  applyTestLineup();
}

function applyTestLineup() {
  state.mode = TEST_LINEUP.mode;
  state.team = TEST_LINEUP.team;
  state.league = TEST_LINEUP.league;
  state.leagueFormat = TEST_LINEUP.leagueFormat || 'mens';
  state.date = todayISO();
  state.roster = TEST_LINEUP.roster.map(p => ({
    id: uid(),
    name: p.name,
    pos1: p.pos1, pos2: p.pos2, pos3: p.pos3,
    tags: p.tags || [],
    primary: p.primary || '—',
    gender: p.gender || '—',
    skill: p.skill || '—',
  }));
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
  document.getElementById('editSkill').value = p.skill || '—';
  document.getElementById('editPrimary').value = p.primary || '—';
  // Set gender chips
  document.querySelectorAll('#editGenderChips .gender-chip').forEach(c => {
    c.classList.toggle('on', c.dataset.gender === (p.gender || '—'));
  });
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
  const skill = document.getElementById('editSkill').value || '—';
  const primary = document.getElementById('editPrimary').value || '—';
  const genderChip = document.querySelector('#editGenderChips .gender-chip.on');
  const gender = genderChip ? genderChip.dataset.gender : '—';

  p.name = name;
  p.pos1 = pos1;
  p.pos2 = pos2;
  p.pos3 = pos3;
  p.skill = skill;
  p.primary = primary;
  p.gender = gender;
  p.tags = Array.from(editingTags);

  closeEditDialog();
  render();
}

async function confirmDeleteFromEdit() {
  if (!editingPlayerId) return;
  const p = playerById(editingPlayerId);
  if (!p) return;
  const pid = editingPlayerId;
  // Close the Edit dialog FIRST, then show the confirm dialog on top
  closeEditDialog();
  const ok = await askConfirm(`Remove ${p.name} from the roster?`, { danger: true, okLabel: 'Remove' });
  if (!ok) return;
  removePlayer(pid);
  render();
}

// ==== DUPLICATE ROSTER DIALOG ====
let duplicatingFromId = null;
let duplicatePicks = new Set(); // player IDs selected to carry over

async function openDuplicateDialog(historyId) {
  const entry = history.find(h => h.id === historyId);
  if (!entry) return;

  // If current roster isn't empty, confirm overwrite
  if (state.roster.length > 0) {
    const ok = await askConfirm('This will replace your current roster. Save first if you need to keep it. Continue?');
    if (!ok) return;
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
  state.leagueFormat = LEAGUE_FORMATS.find(f => f.val === entry.snapshot.leagueFormat) ? entry.snapshot.leagueFormat : 'mens';
  state.roster = pickedPlayers.map(p => ({
    id: uid(),
    name: p.name,
    pos1: p.pos1 || 'EH',
    pos2: p.pos2 || '—',
    pos3: p.pos3 || '—',
    tags: migrateTags(p.tags),
    gender: GENDERS.includes(p.gender) ? p.gender : '—',
    skill: SKILL_LEVELS.includes(p.skill) ? p.skill : '—',
    primary: PRIMARY_OPTIONS.find(o => o.val === p.primary) ? p.primary : '—',
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
  document.getElementById('leagueFormat').addEventListener('change', e => {
    state.leagueFormat = e.target.value;
    saveState();
    renderValidityIndicator();
  });
  document.getElementById('leagueName').addEventListener('input', e => { state.league = e.target.value; saveState(); });
  document.getElementById('parkName').addEventListener('input', e => { state.park = e.target.value; renderFieldLabel(); saveState(); });
  document.getElementById('gameDate').addEventListener('change', e => { state.date = e.target.value; renderFieldLabel(); saveState(); });

  // Gender chip handlers (Add form + Edit dialog) — only one chip "on" at a time
  document.querySelectorAll('#playerGenderChips .gender-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#playerGenderChips .gender-chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
    });
  });
  document.querySelectorAll('#editGenderChips .gender-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#editGenderChips .gender-chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
    });
  });

  // Validity indicator: tap to expand/collapse the explanation
  const vi = document.getElementById('validityIndicator');
  if (vi) {
    vi.addEventListener('click', () => {
      if (vi.classList.contains('invalid')) {
        vi.classList.toggle('expanded');
      }
    });
  }

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

  // Detect old demo lineup (Adrien, Dykes, Aramis, Gaby, Rob, Alex, Joe, Hector, Matt, Jimmy, Capi)
  // — if the user is still on those names, they never customized; swap to the new generic demo
  const OLD_DEMO_NAMES = new Set(['Adrien','Dykes','Aramis','Gaby','Rob','Joe','Hector','Matt','Jimmy','Capi']);
  const rosterNames = state.roster.map(p => p.name);
  const looksLikeOldDemo = rosterNames.length > 0
    && rosterNames.filter(n => OLD_DEMO_NAMES.has(n)).length >= 5; // 5+ matches = clearly old demo
  if (looksLikeOldDemo) {
    applyTestLineup(); // silent swap, no confirm needed
  }

  document.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === state.mode);
  });

  if (state.roster.length === 0 && history.length === 0) {
    applyTestLineup();
  } else {
    render();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
