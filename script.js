// ===================== CONSTANTS =====================
const STORAGE_KEY = 'gt_v4';
const EMOJIS = ['🌅','💪','💻','📚','🎌','🏃','🧘','🎯','📖','🎨','🎵','🍎','💡','🚀','🌙','⚡','🏋️','🧠','✍️','🎮','🌿','🎸','🤸','🏊'];
const SUB_EMOJIS = ['🏋️','🏃','🤸','🏊','🚴','🧘','⚽','🏀','🎯','💪','🔥','⚡','📚','💻','🎸','🎨','🍎','🌿','🧠','✍️','📖','🎵','🚀','💡','🎮','🌙','🌅','🤼','🥊','🏇'];
const COLORS = ['#7c5af5','#38bdf8','#34d399','#fbbf24','#fb7185','#f472b6','#fb923c','#a78bfa','#4ade80','#60a5fa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const QUOTES = [
  'Jo aaj kiya — kal ka future self thank karega.',
  'Ek din miss — theek hai. Ek aur miss — danger zone.',
  'Consistency is the real superpower, bhai.',
  'Early wakeup > 1000 motivational videos.',
  'Anime deserved hai — pehle grind, phir chill.',
  'Code likhte raho, log sochte rahenge.',
  'Padhai aur patience — dono ka koi shortcut nahi.'
];

const LEVELS = [
  {min:0,    max:99,   name:'Rookie Grinder',    emoji:'🌱'},
  {min:100,  max:249,  name:'Committed Beast',   emoji:'💪'},
  {min:250,  max:499,  name:'Grind Master',      emoji:'⚡'},
  {min:500,  max:999,  name:'Elite Performer',   emoji:'🚀'},
  {min:1000, max:1999, name:'Legendary Grinder', emoji:'🏆'},
  {min:2000, max:Infinity, name:'God Mode 🔱',   emoji:'🌟'},
];

const BADGE_DEFS = [
  {id:'first',  emoji:'🎯', name:'First Step',       desc:'Pehli habit complete ki'},
  {id:'week7',  emoji:'🔥', name:'Week Warrior',     desc:'7-day streak'},
  {id:'perfect',emoji:'⭐', name:'Perfect Day',      desc:'Ek din saari habits done'},
  {id:'month',  emoji:'🏅', name:'Month Grinder',    desc:'30 days kuch na kuch kiya'},
  {id:'century',emoji:'💯', name:'Century',          desc:'100 total check-ins'},
  {id:'beast',  emoji:'🦁', name:'Beast Mode',       desc:'Saari habits 7 din lagaataar'},
];

const DEFAULT_HABITS = [
  {id:'h_wake',  name:'Early Wakeup', sub:'6 AM se pehle', icon:'🌅', color:'#fbbf24'},
  {id:'h_gym',   name:'Exercise',     sub:'Workout / yoga', icon:'💪', color:'#fb7185'},
  {id:'h_code',  name:'Coding',       sub:'Practice / projects', icon:'💻', color:'#38bdf8'},
  {id:'h_study', name:'Tuitions',     sub:'Padhai complete', icon:'📚', color:'#34d399'},
  {id:'h_anime', name:'Anime / Movie',sub:'Deserved break', icon:'🎌', color:'#f472b6'},
];

// Default sub-items for Exercise habit
const DEFAULT_EXERCISE_ITEMS = [
  {id:'si_bench', name:'Bench Press', emoji:'🏋️', sets:3, reps:10, duration:''},
  {id:'si_squat', name:'Squats',      emoji:'🤸', sets:3, reps:12, duration:''},
  {id:'si_run',   name:'Running',     emoji:'🏃', sets:null, reps:null, duration:'30 min'},
  {id:'si_pull',  name:'Pull-ups',    emoji:'💪', sets:3, reps:8,  duration:''},
];

// ===================== STATE =====================
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.habits) && typeof d.history === 'object') {
        if (!d.badges) d.badges = [];
        if (!d.subItems) d.subItems = {};
        if (!d.subHistory) d.subHistory = {};
        return d;
      }
    }
  } catch(e) {}
  return {
    habits: JSON.parse(JSON.stringify(DEFAULT_HABITS)),
    history: {},
    badges: [],
    subItems: { h_gym: JSON.parse(JSON.stringify(DEFAULT_EXERCISE_ITEMS)) },
    subHistory: {}
  };
}

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch(e) {}
}

let S = loadData();

// ===================== UTILS =====================
function dkey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+d;
}
function today() { return new Date(); }
function todayKey() { return dkey(today()); }
function getDone(key) { const arr = S.history[key]; return Array.isArray(arr) ? arr : []; }
function setDone(key, arr) { S.history[key] = arr; saveData(); }
function getPct(key) { if (!S.habits.length) return 0; return getDone(key).length / S.habits.length; }

// Sub-item helpers
function getSubItems(habitId) {
  return Array.isArray(S.subItems[habitId]) ? S.subItems[habitId] : [];
}
function getSubDone(habitId, dateKey) {
  if (!S.subHistory[habitId]) return [];
  return Array.isArray(S.subHistory[habitId][dateKey]) ? S.subHistory[habitId][dateKey] : [];
}
function setSubDone(habitId, dateKey, arr) {
  if (!S.subHistory[habitId]) S.subHistory[habitId] = {};
  S.subHistory[habitId][dateKey] = arr;
  saveData();
}

function calcStreak() {
  let streak = 0;
  const d = new Date(today());
  const tk = dkey(d);
  if (getDone(tk).length > 0) { streak = 1; d.setDate(d.getDate()-1); }
  else { d.setDate(d.getDate()-1); }
  while (streak < 9999) {
    const k = dkey(d);
    const done = getDone(k);
    if (S.habits.length > 0 && done.length === S.habits.length) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

function calcTotalXP() {
  let xp = 0;
  Object.keys(S.history).forEach(k => {
    const dt = new Date(k);
    if (dt > today()) return;
    const done = getDone(k);
    xp += done.length * 10;
    if (S.habits.length > 0 && done.length === S.habits.length) xp += 20;
  });
  return xp;
}

function calcTotalCheckins() {
  let n = 0;
  Object.keys(S.history).forEach(k => { n += getDone(k).length; });
  return n;
}

function getLevelInfo(xp) {
  for (let i = LEVELS.length-1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) {
      const lvl = LEVELS[i];
      const next = LEVELS[i+1];
      const pct = next ? (xp - lvl.min) / (next.min - lvl.min) * 100 : 100;
      const xpInLevel = next ? (xp - lvl.min) : xp;
      const xpNeeded = next ? (next.min - lvl.min) : xp;
      return { level: i+1, name: lvl.name, emoji: lvl.emoji, pct: Math.min(pct,100), xpInLevel, xpNeeded };
    }
  }
  return { level: 1, name: LEVELS[0].name, emoji: LEVELS[0].emoji, pct: 0, xpInLevel: 0, xpNeeded: 100 };
}

function checkBadges() {
  const earned = new Set(S.badges);
  const newBadges = [];
  const totalCheckins = calcTotalCheckins();
  const streak = calcStreak();
  if (!earned.has('first') && totalCheckins >= 1) { earned.add('first'); newBadges.push('first'); }
  if (!earned.has('week7') && streak >= 7) { earned.add('week7'); newBadges.push('week7'); }
  if (!earned.has('century') && totalCheckins >= 100) { earned.add('century'); newBadges.push('century'); }
  if (!earned.has('perfect')) {
    for (let k of Object.keys(S.history)) {
      const done = getDone(k);
      if (S.habits.length > 0 && done.length === S.habits.length) { earned.add('perfect'); newBadges.push('perfect'); break; }
    }
  }
  if (!earned.has('month')) {
    let activeDays = 0;
    Object.keys(S.history).forEach(k => { if (getDone(k).length > 0) activeDays++; });
    if (activeDays >= 30) { earned.add('month'); newBadges.push('month'); }
  }
  if (!earned.has('beast') && S.habits.length > 0) {
    let beastCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today()); d.setDate(d.getDate()-i);
      const done = getDone(dkey(d));
      if (done.length === S.habits.length) beastCount++;
      else break;
    }
    if (beastCount >= 7) { earned.add('beast'); newBadges.push('beast'); }
  }
  S.badges = [...earned];
  saveData();
  return newBadges;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function confetti() {
  const wrap = document.getElementById('cfWrap');
  const cols = ['#7c5af5','#38bdf8','#34d399','#fbbf24','#fb7185','#f472b6','#fb923c'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.className = 'cf';
    el.style.cssText = `left:${Math.random()*100}%;top:-8px;width:${6+Math.random()*7}px;height:${6+Math.random()*7}px;background:${cols[Math.floor(Math.random()*cols.length)]};animation-delay:${Math.random()*0.9}s;animation-duration:${1.2+Math.random()*0.9}s;border-radius:${Math.random()>0.5?'50%':'3px'}`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

// ===================== LEVEL + BADGES =====================
function renderLevel() {
  const xp = calcTotalXP();
  const info = getLevelInfo(xp);
  document.getElementById('lvlNum').textContent = info.level;
  document.getElementById('lvlTitle').textContent = info.emoji + ' ' + info.name;
  document.getElementById('lvlSub').textContent = info.xpInLevel + ' / ' + info.xpNeeded + ' XP';
  document.getElementById('xpFill').style.width = info.pct + '%';
  document.getElementById('statXP').textContent = xp;
  const earned = new Set(S.badges);
  const row = document.getElementById('badgesRow');
  row.innerHTML = '';
  BADGE_DEFS.forEach(b => {
    const div = document.createElement('div');
    div.className = 'badge badge-tooltip' + (earned.has(b.id) ? '' : ' locked');
    div.innerHTML = b.emoji + `<span class="tooltip-txt">${b.name}: ${b.desc}</span>`;
    row.appendChild(div);
  });
}

// ===================== TODAY PAGE =====================
function renderToday() {
  const tk = todayKey();
  const done = getDone(tk);
  const total = S.habits.length;
  const pct = total ? done.length / total : 0;
  const pctInt = Math.round(pct * 100);
  const circ = 226.2;
  document.getElementById('ringCircle').style.strokeDashoffset = circ - circ * pct;
  document.getElementById('ringPct').textContent = pctInt + '%';
  document.getElementById('statStreak').textContent = calcStreak();
  document.getElementById('statDone').textContent = done.length + (total ? '/'+total : '');
  renderLevel();

  const list = document.getElementById('habitsList');
  list.innerHTML = '';
  if (!S.habits.length) {
    list.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:2rem">Koi habit nahi! Niche se add karo.</div>';
    return;
  }

  S.habits.forEach(h => {
    const isDone = done.includes(h.id);
    const subItems = getSubItems(h.id);
    const subDone = getSubDone(h.id, tk);
    const hasSubItems = subItems.length > 0;

    const card = document.createElement('div');
    card.className = 'hcard' + (isDone ? ' done' : '');
    if (isDone) { card.style.background = h.color + '14'; card.style.borderColor = h.color + '55'; }

    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const d2 = new Date(today()); d2.setDate(d2.getDate()-i);
      const hit = getDone(dkey(d2)).includes(h.id);
      dots += `<div class="hdot${hit?' hit':''}${i===0?' today':''}"></div>`;
    }

    // Sub-items progress pill
    let subPill = '';
    if (hasSubItems) {
      const subPct = Math.round(subDone.length / subItems.length * 100);
      subPill = `<span style="font-size:10px;color:${h.color};background:${h.color}18;padding:2px 7px;border-radius:20px;margin-left:6px">${subDone.length}/${subItems.length}</span>`;
    }

    card.innerHTML = `
      <div class="hcard-ico" style="background:${h.color}20">${h.icon}</div>
      <div class="hcard-body">
        <div class="hcard-name">${h.name}${subPill}</div>
        <div class="hcard-sub">${h.sub || ''}</div>
        <div class="hcard-dots">${dots}</div>
      </div>
      ${hasSubItems ? `<button class="hcard-expand" title="Open details">📋</button>` : ''}
      <div class="hcard-chk" style="${isDone ? 'background:'+h.color+';border-color:'+h.color+';color:#fff' : ''}">${isDone ? '✓' : ''}</div>
    `;

    // Expand button opens sub-tracker
    if (hasSubItems) {
      card.querySelector('.hcard-expand').addEventListener('click', (e) => {
        e.stopPropagation();
        openSubTracker(h.id);
      });
    }

    card.addEventListener('click', () => toggleHabit(h.id));
    list.appendChild(card);
  });
}

function toggleHabit(id) {
  const tk = todayKey();
  const arr = [...getDone(tk)];
  const idx = arr.indexOf(id);
  const prevXP = calcTotalXP();
  if (idx === -1) {
    arr.push(id);
    setDone(tk, arr);
    const newBadges = checkBadges();
    newBadges.forEach(bid => {
      const b = BADGE_DEFS.find(x=>x.id===bid);
      if (b) setTimeout(() => toast('Badge unlocked: ' + b.name + ' ' + b.emoji), 500);
    });
    if (arr.length === S.habits.length && S.habits.length > 0) {
      confetti();
      toast('BEAST MODE! Saari habits done! 🔥🔥');
    } else {
      const gained = calcTotalXP() - prevXP;
      toast('Done! +' + gained + ' XP 💪');
    }
  } else {
    arr.splice(idx, 1);
    setDone(tk, arr);
  }
  renderToday();
}

// ===================== SUB-TRACKER =====================
let subHabitId = null;
let subActiveTab = 'items';

function openSubTracker(habitId) {
  subHabitId = habitId;
  subActiveTab = 'items';
  const h = S.habits.find(x => x.id === habitId);
  if (!h) return;

  document.getElementById('subNavTitle').textContent = h.icon + ' ' + h.name;
  renderSubHero(h);
  setSubTab('items');
  document.getElementById('subOverlay').classList.add('open');

  // Switch sub tabs
  document.querySelectorAll('.sub-tab').forEach(btn => {
    btn.onclick = () => setSubTab(btn.dataset.stab);
  });
}

function closeSubTracker() {
  document.getElementById('subOverlay').classList.remove('open');
  subHabitId = null;
  renderToday();
}

function setSubTab(tab) {
  subActiveTab = tab;
  document.querySelectorAll('.sub-tab').forEach(b => b.classList.toggle('on', b.dataset.stab === tab));
  const h = S.habits.find(x => x.id === subHabitId);
  if (!h) return;
  if (tab === 'items') renderSubItems(h);
  if (tab === 'progress') renderSubProgress(h);
  if (tab === 'manage') renderSubManage(h);
}

function renderSubHero(h) {
  const tk = todayKey();
  const subItems = getSubItems(h.id);
  const subDone = getSubDone(h.id, tk);

  // Calculate total completions across all history
  let totalCompletions = 0;
  if (S.subHistory[h.id]) {
    Object.values(S.subHistory[h.id]).forEach(arr => { totalCompletions += arr.length; });
  }

  // Best streak
  let streak = 0, maxStreak = 0, cur = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today()); d.setDate(d.getDate() - (29-i));
    const k = dkey(d);
    const sd = getSubDone(h.id, k);
    if (sd.length > 0) { cur++; maxStreak = Math.max(maxStreak, cur); }
    else cur = 0;
  }

  document.getElementById('subHero').innerHTML = `
    <div class="sub-hero-ico" style="background:${h.color}25">${h.icon}</div>
    <div class="sub-hero-info">
      <div class="sub-hero-name">${h.name}</div>
      <div class="sub-hero-sub">${h.sub || 'No description'}</div>
      <div class="sub-hero-stats">
        <div class="sub-hero-stat">
          <div class="sub-hero-stat-n" style="color:${h.color}">${subItems.length}</div>
          <div class="sub-hero-stat-l">items</div>
        </div>
        <div class="sub-hero-stat">
          <div class="sub-hero-stat-n" style="color:var(--grn)">${subDone.length}/${subItems.length}</div>
          <div class="sub-hero-stat-l">today</div>
        </div>
        <div class="sub-hero-stat">
          <div class="sub-hero-stat-n" style="color:var(--ylw)">${totalCompletions}</div>
          <div class="sub-hero-stat-l">total done</div>
        </div>
        <div class="sub-hero-stat">
          <div class="sub-hero-stat-n" style="color:var(--org)">${maxStreak}</div>
          <div class="sub-hero-stat-l">best streak</div>
        </div>
      </div>
    </div>
  `;
}

function renderSubItems(h) {
  const tk = todayKey();
  const subItems = getSubItems(h.id);
  const subDone = getSubDone(h.id, tk);
  const content = document.getElementById('subContent');

  if (!subItems.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-ico">📋</div>
        <div>Koi items nahi hain abhi</div>
        <div style="margin-top:6px;font-size:12px">Manage tab se add karo</div>
      </div>
      <button class="add-habit-btn" onclick="openSubItemModal(null)">+ Item add karo</button>
    `;
    return;
  }

  let html = '<div class="sub-items-list">';
  subItems.forEach(item => {
    const isDone = subDone.includes(item.id);
    let metaParts = [];
    if (item.sets && item.reps) metaParts.push(`${item.sets} sets × ${item.reps} reps`);
    else if (item.sets) metaParts.push(`${item.sets} sets`);
    else if (item.reps) metaParts.push(`${item.reps} reps`);
    if (item.duration) metaParts.push(item.duration);
    const meta = metaParts.join(' · ') || 'Tap to mark done';

    // Last 7 days dots
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today()); d.setDate(d.getDate()-i);
      const hit = getSubDone(h.id, dkey(d)).includes(item.id);
      dots += `<div class="si-dot${hit?' hit':''}"></div>`;
    }

    html += `
      <div class="si-card${isDone?' done':''}" style="${isDone?'background:'+h.color+'14;border-color:'+h.color+'55':''}" data-id="${item.id}">
        <div class="si-ico" style="background:${h.color}20">${item.emoji || '💪'}</div>
        <div class="si-body">
          <div class="si-name">${item.name}</div>
          <div class="si-meta">${meta}</div>
          <div class="si-streak">${dots}</div>
        </div>
        <div class="si-chk" style="${isDone?'background:'+h.color+';border-color:'+h.color+';color:#fff':''}">
          ${isDone ? '✓' : ''}
        </div>
      </div>
    `;
  });
  html += '</div>';
  html += `<button class="add-habit-btn" onclick="openSubItemModal(null)">+ Item add karo</button>`;
  content.innerHTML = html;

  // Attach click handlers
  content.querySelectorAll('.si-card').forEach(card => {
    card.addEventListener('click', () => toggleSubItem(h.id, card.dataset.id));
  });
}

function toggleSubItem(habitId, itemId) {
  const tk = todayKey();
  const arr = [...getSubDone(habitId, tk)];
  const idx = arr.indexOf(itemId);
  const h = S.habits.find(x => x.id === habitId);
  if (idx === -1) {
    arr.push(itemId);
    setSubDone(habitId, tk, arr);
    const items = getSubItems(habitId);
    if (arr.length === items.length && items.length > 0) {
      confetti();
      toast(`${h ? h.icon : '🔥'} Saari items done! Beast! 💪`);
      // Also mark the main habit as done
      const mainDone = [...getDone(tk)];
      if (!mainDone.includes(habitId)) {
        mainDone.push(habitId);
        setDone(tk, mainDone);
        checkBadges();
      }
    } else {
      toast('Item done! 💪');
    }
  } else {
    arr.splice(idx, 1);
    setSubDone(habitId, tk, arr);
  }
  const hObj = S.habits.find(x => x.id === habitId);
  if (hObj) { renderSubItems(hObj); renderSubHero(hObj); }
}

function renderSubProgress(h) {
  const subItems = getSubItems(h.id);
  const content = document.getElementById('subContent');

  if (!subItems.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-ico">📈</div><div>Koi items nahi — pehle add karo</div></div>`;
    return;
  }

  // Last 30 days progress per item
  let html = `<div class="lbl" style="margin-bottom:12px">last 30 days — per item</div>`;

  subItems.forEach(item => {
    let cnt = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today()); d.setDate(d.getDate()-i);
      if (getSubDone(h.id, dkey(d)).includes(item.id)) cnt++;
    }
    const pct = Math.round(cnt/30*100);
    let metaParts = [];
    if (item.sets && item.reps) metaParts.push(`${item.sets}×${item.reps}`);
    if (item.duration) metaParts.push(item.duration);

    html += `
      <div class="sp-row">
        <div class="sp-name">
          <span>${item.emoji || '💪'}</span>
          <span>${item.name}</span>
          ${metaParts.length ? `<span style="font-size:10px;color:var(--muted);font-weight:400">${metaParts.join(' · ')}</span>` : ''}
        </div>
        <div class="sp-bar-wrap">
          <div class="sp-track"><div class="sp-fill" style="width:${pct}%;background:${h.color}"></div></div>
          <div class="sp-pct">${pct}%</div>
        </div>
        <div class="sp-counts">${cnt}/30 days completed</div>
      </div>
    `;
  });

  // Mini heatmap for this habit
  html += `<div class="lbl" style="margin:1.25rem 0 10px">activity — last 10 weeks</div>`;
  html += `<div style="background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:14px;overflow-x:auto">`;
  html += `<div style="display:flex;gap:3px">`;

  const endDate = new Date(today());
  const startDate = new Date(today());
  startDate.setDate(startDate.getDate() - 69);
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate()-1);

  const cur = new Date(startDate);
  let weekEl = '';
  let weeks = [];
  let currentWeek = [];
  while (cur <= endDate) {
    if (cur.getDay() === 0 && currentWeek.length > 0) { weeks.push(currentWeek); currentWeek = []; }
    const k = dkey(cur);
    const isFuture = cur > today();
    const done = getSubDone(h.id, k);
    const items = getSubItems(h.id);
    const pct = items.length && !isFuture ? done.length / items.length : 0;
    let lvl = isFuture ? 'future' : pct === 0 ? 'l0' : pct < 0.5 ? 'l2' : pct < 1 ? 'l3' : 'l4';
    const dateStr = cur.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    currentWeek.push(`<div class="hm-cell ${lvl}" title="${isFuture ? 'Future' : dateStr+': '+done.length+'/'+items.length}"></div>`);
    cur.setDate(cur.getDate()+1);
  }
  if (currentWeek.length) weeks.push(currentWeek);
  weeks.forEach(w => { html += `<div class="hm-week">${w.join('')}</div>`; });
  html += `</div></div>`;

  content.innerHTML = html;
}

function renderSubManage(h) {
  const subItems = getSubItems(h.id);
  const content = document.getElementById('subContent');
  let html = '';

  if (!subItems.length) {
    html += `<div class="empty-state"><div class="empty-state-ico">⚙️</div><div>Koi items nahi abhi</div></div>`;
  } else {
    subItems.forEach(item => {
      let metaParts = [];
      if (item.sets && item.reps) metaParts.push(`${item.sets} sets × ${item.reps} reps`);
      else if (item.sets) metaParts.push(`${item.sets} sets`);
      else if (item.reps) metaParts.push(`${item.reps} reps`);
      if (item.duration) metaParts.push(item.duration);

      html += `
        <div class="sm-row">
          <div class="sm-ico" style="background:${h.color}20">${item.emoji || '💪'}</div>
          <div class="sm-info">
            <div class="sm-name">${item.name}</div>
            <div class="sm-meta">${metaParts.join(' · ') || 'No details'}</div>
          </div>
          <div class="sm-actions">
            <button class="sm-edit" data-id="${item.id}">✏️ Edit</button>
            <button class="sm-del" data-id="${item.id}">🗑</button>
          </div>
        </div>
      `;
    });
  }

  html += `<button class="add-habit-btn" onclick="openSubItemModal(null)">+ Item add karo</button>`;
  content.innerHTML = html;

  content.querySelectorAll('.sm-edit').forEach(btn => {
    btn.addEventListener('click', () => openSubItemModal(btn.dataset.id));
  });
  content.querySelectorAll('.sm-del').forEach(btn => {
    btn.addEventListener('click', () => deleteSubItem(h.id, btn.dataset.id));
  });
}

function deleteSubItem(habitId, itemId) {
  if (!confirm('Yeh item delete karna chahte ho?')) return;
  if (!S.subItems[habitId]) return;
  S.subItems[habitId] = S.subItems[habitId].filter(x => x.id !== itemId);
  saveData();
  const h = S.habits.find(x => x.id === habitId);
  if (h) { renderSubManage(h); renderSubHero(h); }
  toast('Item delete ho gaya 🗑');
}

// ===================== SUB-ITEM MODAL =====================
let editingSubItemId = null;
let siSelEmoji = SUB_EMOJIS[0];

function openSubItemModal(itemId) {
  editingSubItemId = itemId;
  const h = S.habits.find(x => x.id === subHabitId);

  if (itemId) {
    const item = getSubItems(subHabitId).find(x => x.id === itemId);
    if (!item) return;
    siSelEmoji = item.emoji || SUB_EMOJIS[0];
    document.getElementById('siName').value = item.name;
    document.getElementById('siSets').value = item.sets || '';
    document.getElementById('siReps').value = item.reps || '';
    document.getElementById('siDuration').value = item.duration || '';
    document.getElementById('subItemModalTitle').textContent = 'Edit Item ✏️';
    document.getElementById('saveSubItemBtn').textContent = 'Update ✓';
  } else {
    siSelEmoji = SUB_EMOJIS[0];
    document.getElementById('siName').value = '';
    document.getElementById('siSets').value = '';
    document.getElementById('siReps').value = '';
    document.getElementById('siDuration').value = '';
    document.getElementById('subItemModalTitle').textContent = 'Nai Item ✨';
    document.getElementById('saveSubItemBtn').textContent = 'Save ✓';
  }

  buildSubEmojiPicker();
  document.getElementById('subItemOverlay').classList.add('open');
  setTimeout(() => document.getElementById('siName').focus(), 100);
}

function buildSubEmojiPicker() {
  const ep = document.getElementById('siEmojiPick');
  ep.innerHTML = '';
  SUB_EMOJIS.forEach(e => {
    const d = document.createElement('div');
    d.className = 'e-opt' + (e === siSelEmoji ? ' sel' : '');
    d.textContent = e;
    d.addEventListener('click', () => {
      siSelEmoji = e;
      ep.querySelectorAll('.e-opt').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
    });
    ep.appendChild(d);
  });
}

function closeSubItemModal() {
  document.getElementById('subItemOverlay').classList.remove('open');
}

function saveSubItem() {
  const name = document.getElementById('siName').value.trim();
  if (!name) { toast('Naam toh dalo! 🙏'); return; }
  const sets = parseInt(document.getElementById('siSets').value) || null;
  const reps = parseInt(document.getElementById('siReps').value) || null;
  const duration = document.getElementById('siDuration').value.trim() || '';

  if (!S.subItems[subHabitId]) S.subItems[subHabitId] = [];

  if (editingSubItemId) {
    const item = S.subItems[subHabitId].find(x => x.id === editingSubItemId);
    if (item) { item.name = name; item.sets = sets; item.reps = reps; item.duration = duration; item.emoji = siSelEmoji; }
    toast('Item update ho gaya! ✏️');
  } else {
    S.subItems[subHabitId].push({ id: 'si_' + Date.now(), name, sets, reps, duration, emoji: siSelEmoji });
    toast('Nai item add ho gayi! 🎯');
  }
  saveData();
  closeSubItemModal();
  const h = S.habits.find(x => x.id === subHabitId);
  if (h) { setSubTab(subActiveTab); renderSubHero(h); }
}

// ===================== WEEKLY PAGE =====================
let wkOffset = 0;
function getWeekDays(offset) {
  const d = new Date(today());
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  d.setHours(0,0,0,0);
  const days = [];
  for (let i = 0; i < 7; i++) { const day = new Date(d); day.setDate(d.getDate()+i); days.push(day); }
  return days;
}

function renderWeekly() {
  const days = getWeekDays(wkOffset);
  const tk = todayKey();
  const fmt = d => d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  document.getElementById('wkTitle').textContent = fmt(days[0]) + ' – ' + fmt(days[6]) + ' ' + days[6].getFullYear();

  let totalDone=0, perfectDays=0, activeDays=0;
  days.forEach(d => {
    const k = dkey(d); const done = getDone(k); const isFuture = d > today() && k !== tk;
    if (!isFuture) { totalDone += done.length; if (done.length>0) activeDays++; if (S.habits.length && done.length===S.habits.length) perfectDays++; }
  });
  const possible = S.habits.length * days.filter(d => !(d > today() && dkey(d) !== tk)).length;
  const avg = possible ? Math.round(totalDone/possible*100) : 0;

  document.getElementById('wkSummary').innerHTML = `
    <div class="sum-card"><div class="sum-n">${totalDone}</div><div class="sum-l">total done</div></div>
    <div class="sum-card"><div class="sum-n">${perfectDays}</div><div class="sum-l">perfect days</div></div>
    <div class="sum-card"><div class="sum-n">${activeDays}</div><div class="sum-l">active days</div></div>
    <div class="sum-card"><div class="sum-n">${avg}%</div><div class="sum-l">avg complete</div></div>
  `;

  const barsEl = document.getElementById('wkBars');
  barsEl.innerHTML = '';
  days.forEach(d => {
    const k = dkey(d); const done = getDone(k); const isFuture = d > today() && k !== tk; const isToday = k === tk;
    const pct = S.habits.length && !isFuture ? Math.round(done.length/S.habits.length*100) : 0;
    const col = document.createElement('div');
    col.className = 'wbar-col' + (isToday ? ' hl' : '');
    col.innerHTML = `<div class="wbar-name">${DAYS_S[d.getDay()]}</div><div class="wbar-num">${d.getDate()}</div><div class="wbar-track"><div class="wbar-fill" style="height:${pct}%"></div></div><div class="wbar-pct">${isFuture ? '—' : pct+'%'}</div>`;
    barsEl.appendChild(col);
  });

  const tbl = document.getElementById('wkTable');
  const headCells = days.map(d => `<th>${DAYS_S[d.getDay()]}<br><span style="font-size:9px;font-weight:400">${d.getDate()}</span></th>`).join('');
  let rows = `<thead><tr><th>Habit</th>${headCells}</tr></thead><tbody>`;
  if (!S.habits.length) {
    rows += `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:1.5rem">Koi habit nahi hai</td></tr>`;
  } else {
    S.habits.forEach(h => {
      const cells = days.map(d => {
        const k = dkey(d); const isFuture = d > today() && k !== tk;
        const done = getDone(k).includes(h.id); const cls = isFuture ? 'f' : done ? 'y' : 'n';
        return `<td><div class="tc ${cls}"></div></td>`;
      }).join('');
      rows += `<tr><td><span style="margin-right:6px">${h.icon}</span>${h.name}</td>${cells}</tr>`;
    });
  }
  rows += '</tbody>';
  tbl.innerHTML = rows;
}

// ===================== MONTHLY PAGE =====================
let moOffset = 0;
function renderMonthly() {
  const now = today();
  const ref = new Date(now.getFullYear(), now.getMonth() + moOffset, 1);
  const yr = ref.getFullYear(); const mo = ref.getMonth();
  const daysInMonth = new Date(yr, mo+1, 0).getDate();
  const firstDay = new Date(yr, mo, 1).getDay();
  const tk = todayKey();
  document.getElementById('moTitle').textContent = MONTHS[mo] + ' ' + yr;

  let totalDone=0, perfectDays=0, activeDays=0, countedDays=0;
  for (let d=1; d<=daysInMonth; d++) {
    const dt = new Date(yr,mo,d); const k = dkey(dt);
    if (dt > now && k !== tk) continue;
    countedDays++;
    const done = getDone(k); totalDone += done.length;
    if (done.length > 0) activeDays++;
    if (S.habits.length && done.length === S.habits.length) perfectDays++;
  }
  const possible = S.habits.length * countedDays;
  const avg = possible ? Math.round(totalDone/possible*100) : 0;

  document.getElementById('moSummary').innerHTML = `
    <div class="sum-card"><div class="sum-n">${totalDone}</div><div class="sum-l">total done</div></div>
    <div class="sum-card"><div class="sum-n">${perfectDays}</div><div class="sum-l">perfect days</div></div>
    <div class="sum-card"><div class="sum-n">${activeDays}</div><div class="sum-l">active days</div></div>
    <div class="sum-card"><div class="sum-n">${avg}%</div><div class="sum-l">completion</div></div>
  `;

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  for (let e=0; e<firstDay; e++) { const empty = document.createElement('div'); empty.className='cal-cell empty'; grid.appendChild(empty); }
  for (let d=1; d<=daysInMonth; d++) {
    const dt = new Date(yr,mo,d); const k = dkey(dt);
    const isFuture = dt > now && k !== tk; const isToday = k === tk;
    const done = getDone(k); const pct = S.habits.length && !isFuture ? done.length/S.habits.length : 0;
    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (isFuture?' future':'') + (isToday?' is-today':'');
    const numEl = isToday
      ? `<div class="cal-num" style="display:flex"><div style="background:var(--pur);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">${d}</div></div>`
      : `<div class="cal-num">${d}</div>`;
    let dots = '';
    if (!isFuture && done.length > 0) {
      dots = S.habits.filter(h => done.includes(h.id)).map(h => `<div class="cal-cdot" style="background:${h.color}"></div>`).join('');
    }
    cell.innerHTML = `${numEl}<div class="cal-dots-row">${dots}</div>${!isFuture && pct > 0 ? `<div class="cal-bar"><div class="cal-bar-fill" style="width:${Math.round(pct*100)}%"></div></div>` : ''}`;
    grid.appendChild(cell);
  }

  const moHabits = document.getElementById('moHabits');
  moHabits.innerHTML = '';
  if (!S.habits.length) { moHabits.innerHTML = '<div style="padding:1rem;color:var(--muted);font-size:13px;text-align:center">Koi habit nahi hai</div>'; return; }
  S.habits.forEach(h => {
    let cnt=0, total2=0;
    for (let d=1; d<=daysInMonth; d++) {
      const dt = new Date(yr,mo,d); const k = dkey(dt);
      if (dt > now && k !== tk) continue;
      total2++;
      if (getDone(k).includes(h.id)) cnt++;
    }
    const pct = total2 ? Math.round(cnt/total2*100) : 0;
    const row = document.createElement('div');
    row.className = 'mhb-row';
    row.innerHTML = `<div class="mhb-ico">${h.icon}</div><div class="mhb-name">${h.name}</div><div class="mhb-track"><div class="mhb-fill" style="width:${pct}%;background:${h.color}"></div></div><div class="mhb-pct">${cnt}/${total2} (${pct}%)</div>`;
    moHabits.appendChild(row);
  });
}

// ===================== STATS PAGE =====================
function renderStats() {
  renderHeatmap();
  renderPieChart();
  renderTopHabits();
  renderLineChart();
}

function renderHeatmap() {
  const grid = document.getElementById('hmGrid');
  grid.innerHTML = '';
  const now = today();
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 83);
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate()-1);
  const cur = new Date(startDate);
  let weekEl = null;
  while (cur <= endDate) {
    if (cur.getDay() === 0) { weekEl = document.createElement('div'); weekEl.className='hm-week'; grid.appendChild(weekEl); }
    const k = dkey(cur);
    const isFuture = cur > now;
    const done = getDone(k);
    const pct = S.habits.length && !isFuture ? done.length/S.habits.length : 0;
    let lvl = isFuture ? 'future' : pct === 0 ? 'l0' : pct < 0.25 ? 'l1' : pct < 0.5 ? 'l2' : pct < 0.75 ? 'l3' : 'l4';
    const cell = document.createElement('div');
    cell.className = 'hm-cell ' + lvl;
    const dateStr = cur.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
    cell.title = isFuture ? 'Future' : `${dateStr}: ${done.length}/${S.habits.length} done`;
    weekEl.appendChild(cell);
    cur.setDate(cur.getDate()+1);
  }
}

function renderPieChart() {
  const canvas = document.getElementById('pieCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 100; canvas.height = 100;
  ctx.clearRect(0,0,100,100);
  if (!S.habits.length) {
    ctx.fillStyle = '#3a3a52'; ctx.beginPath(); ctx.arc(50,50,40,0,Math.PI*2); ctx.fill();
    document.getElementById('pieLegend').innerHTML = '<div style="color:var(--muted);font-size:11px">Koi data nahi</div>';
    return;
  }
  const habitTotals = S.habits.map(h => {
    let cnt = 0;
    Object.keys(S.history).forEach(k => { if (getDone(k).includes(h.id)) cnt++; });
    return { h, cnt };
  }).filter(x => x.cnt > 0);
  const total = habitTotals.reduce((a,b) => a+b.cnt, 0);
  if (total === 0) {
    ctx.fillStyle = '#3a3a52'; ctx.beginPath(); ctx.arc(50,50,40,0,Math.PI*2); ctx.fill();
    document.getElementById('pieLegend').innerHTML = '<div style="color:var(--muted);font-size:11px">Start karo!</div>';
    return;
  }
  let startAngle = -Math.PI/2;
  habitTotals.forEach(({h, cnt}) => {
    const slice = (cnt/total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(50,50); ctx.arc(50,50,42,startAngle,startAngle+slice);
    ctx.fillStyle = h.color; ctx.fill(); startAngle += slice;
  });
  ctx.beginPath(); ctx.arc(50,50,24,0,Math.PI*2); ctx.fillStyle='#0f0f14'; ctx.fill();
  const legend = document.getElementById('pieLegend');
  legend.innerHTML = '';
  habitTotals.slice(0,5).forEach(({h, cnt}) => {
    const pct = Math.round(cnt/total*100);
    const row = document.createElement('div');
    row.className = 'pie-leg-row';
    row.innerHTML = `<div class="pie-leg-dot" style="background:${h.color}"></div><div class="pie-leg-name">${h.icon} ${h.name}</div><div class="pie-leg-pct">${pct}%</div>`;
    legend.appendChild(row);
  });
}

function renderTopHabits() {
  const wrap = document.getElementById('topHabitsChart');
  wrap.innerHTML = '';
  if (!S.habits.length) { wrap.innerHTML = '<div style="color:var(--muted);font-size:11px">Koi habit nahi</div>'; return; }
  const habitTotals = S.habits.map(h => {
    let cnt = 0;
    Object.keys(S.history).forEach(k => { if (getDone(k).includes(h.id)) cnt++; });
    return { h, cnt };
  }).sort((a,b) => b.cnt-a.cnt);
  const maxCnt = habitTotals[0]?.cnt || 1;
  habitTotals.forEach(({h, cnt}) => {
    const pct = maxCnt ? Math.round(cnt/maxCnt*100) : 0;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px';
    row.innerHTML = `<span style="font-size:14px;flex-shrink:0">${h.icon}</span><div style="flex:1"><div style="font-size:11px;font-weight:600;margin-bottom:3px">${h.name}</div><div style="height:5px;background:var(--s3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${h.color};border-radius:3px;transition:width .5s"></div></div></div><span style="font-size:11px;color:var(--muted);min-width:28px;text-align:right">${cnt}x</span>`;
    wrap.appendChild(row);
  });
}

function renderLineChart() {
  const canvas = document.getElementById('lineCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400; const H = 120;
  canvas.width = W; canvas.height = H;
  ctx.clearRect(0,0,W,H);
  const points = [];
  for (let i=29; i>=0; i--) {
    const d = new Date(today()); d.setDate(d.getDate()-i);
    const k = dkey(d);
    const done = getDone(k);
    const pct = S.habits.length ? done.length/S.habits.length : 0;
    points.push(pct);
  }
  const pad = 10;
  const chartH = H - pad*2;
  const stepX = (W - pad*2) / (points.length-1);
  ctx.strokeStyle = '#252535'; ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(v => {
    const y = pad + chartH - v*chartH;
    ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke();
  });
  const grad = ctx.createLinearGradient(0,pad,0,H);
  grad.addColorStop(0,'#7c5af540'); grad.addColorStop(1,'#7c5af500');
  ctx.beginPath(); ctx.moveTo(pad, pad+chartH);
  points.forEach((v,i) => { const x=pad+i*stepX; const y=pad+chartH-v*chartH; if(i===0) ctx.lineTo(x,y); else ctx.lineTo(x,y); });
  ctx.lineTo(pad+(points.length-1)*stepX, pad+chartH);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); ctx.strokeStyle='#7c5af5'; ctx.lineWidth=2; ctx.lineJoin='round';
  points.forEach((v,i) => { const x=pad+i*stepX; const y=pad+chartH-v*chartH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
  ctx.stroke();
  points.forEach((v,i) => {
    if (i % 5 === 0 || i === points.length-1) {
      const x=pad+i*stepX; const y=pad+chartH-v*chartH;
      ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle='#a78bfa'; ctx.fill();
    }
  });
}

// ===================== MANAGE PAGE =====================
function renderManage() {
  const list = document.getElementById('mngList');
  list.innerHTML = '';
  if (!S.habits.length) {
    list.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:2rem">Abhi koi habit nahi. Niche se add karo!</div>';
    return;
  }
  S.habits.forEach(h => {
    const subCount = getSubItems(h.id).length;
    const row = document.createElement('div');
    row.className = 'mng-row';
    row.innerHTML = `
      <div class="mng-ico" style="background:${h.color}20">${h.icon}</div>
      <div style="flex:1">
        <div class="mng-name">${h.name}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${h.sub||'No description'} ${subCount > 0 ? `· <span style="color:${h.color}">${subCount} items</span>` : ''}</div>
      </div>
      <div class="mng-actions">
        <button class="mng-edit mng-edit-btn" data-id="${h.id}" title="Edit habit">✏️ Edit</button>
        <button class="mng-edit mng-sub-btn" data-id="${h.id}" title="Manage items" style="color:var(--blu)">📋 Items</button>
        <button class="mng-del mng-del-btn" data-id="${h.id}" title="Delete habit">🗑</button>
      </div>
    `;
    row.querySelector('.mng-del-btn').addEventListener('click', () => deleteHabit(h.id));
    row.querySelector('.mng-edit-btn').addEventListener('click', () => openEditModal(h.id));
    row.querySelector('.mng-sub-btn').addEventListener('click', () => openSubTracker(h.id));
    list.appendChild(row);
  });
}

function deleteHabit(id) {
  if (!confirm('Yeh habit delete karna chahte ho?')) return;
  S.habits = S.habits.filter(h => h.id !== id);
  saveData(); renderManage(); renderToday();
  toast('Habit delete ho gayi 🗑');
}

// ===================== HABIT MODAL =====================
let selEmoji = EMOJIS[0];
let selColor = COLORS[0];
let editingId = null;

function openModal() {
  editingId = null;
  selEmoji = EMOJIS[0]; selColor = COLORS[0];
  document.getElementById('mName').value = '';
  document.getElementById('mSub').value = '';
  document.getElementById('modalTitle').textContent = 'Nai Habit ✨';
  document.getElementById('saveHabitBtn').textContent = 'Save Habit ✓';
  buildModalPickers();
  document.getElementById('overlay').classList.add('open');
  setTimeout(() => document.getElementById('mName').focus(), 100);
}

function openEditModal(id) {
  editingId = id;
  const h = S.habits.find(x => x.id === id);
  if (!h) return;
  selEmoji = h.icon; selColor = h.color;
  document.getElementById('mName').value = h.name;
  document.getElementById('mSub').value = h.sub || '';
  document.getElementById('modalTitle').textContent = 'Edit Habit ✏️';
  document.getElementById('saveHabitBtn').textContent = 'Update ✓';
  buildModalPickers();
  document.getElementById('overlay').classList.add('open');
  setTimeout(() => document.getElementById('mName').focus(), 100);
}

function buildModalPickers() {
  const ep = document.getElementById('emojiPick');
  ep.innerHTML = '';
  EMOJIS.forEach(e => {
    const d = document.createElement('div');
    d.className = 'e-opt' + (e===selEmoji?' sel':'');
    d.textContent = e;
    d.addEventListener('click', () => { selEmoji=e; ep.querySelectorAll('.e-opt').forEach(x=>x.classList.remove('sel')); d.classList.add('sel'); });
    ep.appendChild(d);
  });
  const cp = document.getElementById('colorPick');
  cp.innerHTML = '';
  COLORS.forEach(c => {
    const d = document.createElement('div');
    d.className = 'c-opt' + (c===selColor?' sel':'');
    d.style.background = c;
    d.addEventListener('click', () => { selColor=c; cp.querySelectorAll('.c-opt').forEach(x=>x.classList.remove('sel')); d.classList.add('sel'); });
    cp.appendChild(d);
  });
}

function closeModal() { document.getElementById('overlay').classList.remove('open'); }

function saveHabit() {
  const name = document.getElementById('mName').value.trim();
  if (!name) { toast('Naam toh dalo bhai! 🙏'); return; }
  if (editingId) {
    const h = S.habits.find(x => x.id === editingId);
    if (h) { h.name = name; h.sub = document.getElementById('mSub').value.trim(); h.icon = selEmoji; h.color = selColor; }
    saveData(); closeModal(); renderToday(); renderManage();
    toast('Habit update ho gayi! ✏️');
  } else {
    const id = 'h_' + Date.now();
    S.habits.push({ id, name, sub: document.getElementById('mSub').value.trim(), icon: selEmoji, color: selColor });
    saveData(); closeModal(); renderToday(); renderManage();
    toast('Nai habit add ho gayi! 🎯');
  }
}

// ===================== NAV =====================
function showPage(pg) {
  document.querySelectorAll('.pg').forEach(el => el.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('on'));
  document.getElementById('pg-'+pg).classList.add('on');
  document.querySelector(`[data-pg="${pg}"]`).classList.add('on');
  if (pg==='weekly') renderWeekly();
  if (pg==='monthly') renderMonthly();
  if (pg==='manage') renderManage();
  if (pg==='stats') renderStats();
}

// ===================== GREETING =====================
function initGreeting() {
  const h = today().getHours();
  const g = h<12 ? 'Good Morning bhai ☀️' : h<17 ? 'Good Afternoon bhai 🌤️' : 'Good Evening bhai 🌙';
  document.getElementById('greeting').textContent = g;
  document.getElementById('heroDate').textContent = today().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('heroQuote').textContent = QUOTES[today().getDay() % QUOTES.length];
}

// ===================== EVENT LISTENERS =====================
document.getElementById('tabBar').addEventListener('click', e => { const btn = e.target.closest('.tab'); if (btn) showPage(btn.dataset.pg); });
document.getElementById('openModalBtn').addEventListener('click', openModal);
document.getElementById('openModalBtn2').addEventListener('click', openModal);
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('saveHabitBtn').addEventListener('click', saveHabit);
document.getElementById('overlay').addEventListener('click', e => { if(e.target===document.getElementById('overlay')) closeModal(); });
document.getElementById('wkPrev').addEventListener('click', () => { wkOffset--; renderWeekly(); });
document.getElementById('wkNext').addEventListener('click', () => { wkOffset++; renderWeekly(); });
document.getElementById('moPrev').addEventListener('click', () => { moOffset--; renderMonthly(); });
document.getElementById('moNext').addEventListener('click', () => { moOffset++; renderMonthly(); });
document.getElementById('mName').addEventListener('keydown', e => { if(e.key==='Enter') saveHabit(); });

// Sub tracker events
document.getElementById('subBack').addEventListener('click', closeSubTracker);
document.getElementById('closeSubItemBtn').addEventListener('click', closeSubItemModal);
document.getElementById('saveSubItemBtn').addEventListener('click', saveSubItem);
document.getElementById('subItemOverlay').addEventListener('click', e => { if(e.target===document.getElementById('subItemOverlay')) closeSubItemModal(); });
document.getElementById('siName').addEventListener('keydown', e => { if(e.key==='Enter') saveSubItem(); });

// ===================== INIT =====================
checkBadges();
initGreeting();
renderToday();