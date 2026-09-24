// ===================== FIREBASE SETUP =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBN5bDDOm6hqa9gnwX6Gzcwz1fOLABiX80",
  authDomain: "progress-tracker-58872.firebaseapp.com",
  projectId: "progress-tracker-58872",
  storageBucket: "progress-tracker-58872.firebasestorage.app",
  messagingSenderId: "113483110534",
  appId: "1:113483110534:web:95c64f103b24f2644b9907"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let unsubscribeSnapshot = null;
let saveTimeout = null;

// ===================== CONSTANTS =====================
const EMOJIS = ['🌅','💪','💻','📚','🎌','🏃','🧘','🎯','📖','🎨','🎵','🍎','💡','🚀','🌙','⚡','🏋️','🧠','✍️','🎮','🌿','🎸','🤸','🏊'];
const SUB_EMOJIS = ['🏋️','🏃','🤸','🏊','🚴','🧘','⚽','🏀','🎯','💪','🔥','⚡','📚','💻','🎸','🎨','🍎','🌿','🧠','✍️','📖','🎵','🚀','💡','🎮','🌙','🌅','🤼','🥊','🏇'];
const COLORS = ['#7c5af5','#38bdf8','#34d399','#fbbf24','#fb7185','#f472b6','#fb923c','#a78bfa','#4ade80','#60a5fa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
  {min:0,    name:'Rookie Grinder',    emoji:'🌱'},
  {min:100,  name:'Committed Beast',   emoji:'💪'},
  {min:250,  name:'Grind Master',      emoji:'⚡'},
  {min:500,  name:'Elite Performer',   emoji:'🚀'},
  {min:1000, name:'Legendary Grinder', emoji:'🏆'},
  {min:2000, name:'God Mode 🔱',       emoji:'🌟'},
];

const BADGE_DEFS = [
  {id:'first',  emoji:'🎯', name:'First Step',    desc:'Pehli habit complete ki'},
  {id:'week7',  emoji:'🔥', name:'Week Warrior',  desc:'7-day streak'},
  {id:'perfect',emoji:'⭐', name:'Perfect Day',   desc:'Ek din saari habits done'},
  {id:'month',  emoji:'🏅', name:'Month Grinder', desc:'30 days kuch na kuch kiya'},
  {id:'century',emoji:'💯', name:'Century',       desc:'100 total check-ins'},
  {id:'beast',  emoji:'🦁', name:'Beast Mode',    desc:'Saari habits 7 din lagaataar'},
];

const DEFAULT_HABITS = [
  {id:'h_wake',  name:'Early Wakeup', sub:'6 AM se pehle',       icon:'🌅', color:'#fbbf24'},
  {id:'h_gym',   name:'Exercise',     sub:'Workout / yoga',       icon:'💪', color:'#fb7185'},
  {id:'h_code',  name:'Coding',       sub:'Practice / projects',  icon:'💻', color:'#38bdf8'},
  {id:'h_study', name:'Tuitions',     sub:'Padhai complete',      icon:'📚', color:'#34d399'},
  {id:'h_anime', name:'Anime / Movie',sub:'Deserved break',       icon:'🎌', color:'#f472b6'},
];

const DEFAULT_EXERCISE_ITEMS = [
  {id:'si_bench', name:'Bench Press', emoji:'🏋️', sets:3, reps:10, duration:''},
  {id:'si_squat', name:'Squats',      emoji:'🤸', sets:3, reps:12, duration:''},
  {id:'si_run',   name:'Running',     emoji:'🏃', sets:null, reps:null, duration:'30 min'},
  {id:'si_pull',  name:'Pull-ups',    emoji:'💪', sets:3, reps:8,  duration:''},
];

// ===================== STATE =====================
function getInitialState() {
  return {
    habits: JSON.parse(JSON.stringify(DEFAULT_HABITS)),
    history: {},
    badges: [],
    subItems: { h_gym: JSON.parse(JSON.stringify(DEFAULT_EXERCISE_ITEMS)) },
    subHistory: {}
  };
}

let S = getInitialState();
let lastToggledHabitId = null;
let lastToggledAction = null;
let lastAddedHabitId = null;
let prevTccPct = null;

function resetState() {
  S = getInitialState();
  lastToggledHabitId = null;
  lastToggledAction = null;
  lastAddedHabitId = null;
  prevTccPct = null;
  if (typeof closeQuickAdd === 'function') closeQuickAdd();
  if (typeof clearHeatmapSelection === 'function') clearHeatmapSelection();
  renderPersonalRecords();
  renderHabitInsights();
}

// ===================== FIREBASE DATA SYNC =====================
function getUserDocRef() {
  if (!currentUser || currentUser.isGuest) return null;
  return doc(db, 'users', currentUser.uid);
}

async function loadFromFirebase() {
  if (!currentUser) return;
  if (currentUser.isGuest) {
    try {
      const raw = localStorage.getItem('pt_data_' + currentUser.uid);
      if (raw) {
        const data = JSON.parse(raw);
        S = {
          habits: data.habits || JSON.parse(JSON.stringify(DEFAULT_HABITS)),
          history: data.history || {},
          badges: data.badges || [],
          subItems: data.subItems || { h_gym: JSON.parse(JSON.stringify(DEFAULT_EXERCISE_ITEMS)) },
          subHistory: data.subHistory || {}
        };
      }
    } catch(e) {
      console.error('Local load error:', e);
    }
    updateSyncLabel('locally saved');
    return;
  }
  try {
    const snap = await getDoc(getUserDocRef());
    if (snap.exists()) {
      const data = snap.data();
      S = {
        habits: data.habits || JSON.parse(JSON.stringify(DEFAULT_HABITS)),
        history: data.history || {},
        badges: data.badges || [],
        subItems: data.subItems || { h_gym: JSON.parse(JSON.stringify(DEFAULT_EXERCISE_ITEMS)) },
        subHistory: data.subHistory || {}
      };
    } else {
      await saveToFirebase();
    }
  } catch(e) {
    console.error('Firebase load error:', e);
  }
}

function saveToFirebase() {
  if (!currentUser) return;
  if (currentUser.isGuest) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('pt_data_' + currentUser.uid, JSON.stringify(S));
        updateSyncLabel('locally saved');
      } catch(e) {
        console.error('Local save error:', e);
      }
    }, 500);
    return;
  }
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const ref = getUserDocRef();
      if (ref) {
        await setDoc(ref, S);
        updateSyncLabel('abhi');
      }
    } catch(e) {
      console.error('Firebase save error:', e);
    }
  }, 800);
}

function updateSyncLabel(when) {
  const el = document.getElementById('umSync');
  if (el) el.textContent = '🔄 Last synced: ' + when;
}

function subscribeToChanges() {
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  if (!currentUser || currentUser.isGuest) return;
  const ref = getUserDocRef();
  if (!ref) return;
  unsubscribeSnapshot = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const newStr = JSON.stringify(data);
    const curStr = JSON.stringify(S);
    if (newStr !== curStr) {
      S = {
        habits: data.habits || S.habits,
        history: data.history || {},
        badges: data.badges || [],
        subItems: data.subItems || {},
        subHistory: data.subHistory || {}
      };
      renderToday();
      updateSyncLabel('abhi');
    }
  });
}

// ===================== UTILS =====================
function dkey(date) {
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
function today() { return new Date(); }
function todayKey() { return dkey(today()); }
function getDone(key) { return Array.isArray(S.history[key]) ? S.history[key] : []; }
function setDone(key, arr) { S.history[key] = arr; saveToFirebase(); }
function getSubItems(hid) { return Array.isArray(S.subItems[hid]) ? S.subItems[hid] : []; }
function getSubDone(hid, dk) { return S.subHistory[hid] && Array.isArray(S.subHistory[hid][dk]) ? S.subHistory[hid][dk] : []; }
function setSubDone(hid, dk, arr) {
  if (!S.subHistory[hid]) S.subHistory[hid] = {};
  S.subHistory[hid][dk] = arr;
  saveToFirebase();
}

function calcStreak() {
  let streak = 0;
  const d = new Date(today());
  const tk = dkey(d);
  if (getDone(tk).length > 0) { streak = 1; d.setDate(d.getDate()-1); }
  else d.setDate(d.getDate()-1);
  while (streak < 9999) {
    const k = dkey(d);
    if (S.habits.length > 0 && getDone(k).length === S.habits.length) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

function calcTotalXP() {
  let xp = 0;
  Object.keys(S.history).forEach(k => {
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
      return { level: i+1, name: lvl.name, emoji: lvl.emoji, pct: Math.min(pct,100), xpInLevel: next ? xp - lvl.min : xp, xpNeeded: next ? next.min - lvl.min : xp };
    }
  }
  return { level:1, name:LEVELS[0].name, emoji:LEVELS[0].emoji, pct:0, xpInLevel:0, xpNeeded:100 };
}

function checkBadges() {
  const earned = new Set(S.badges);
  const newBadges = [];
  const checkins = calcTotalCheckins();
  const streak = calcStreak();
  if (!earned.has('first') && checkins >= 1)   { earned.add('first');   newBadges.push('first'); }
  if (!earned.has('week7') && streak >= 7)      { earned.add('week7');   newBadges.push('week7'); }
  if (!earned.has('century') && checkins >= 100){ earned.add('century'); newBadges.push('century'); }
  if (!earned.has('perfect')) {
    for (let k of Object.keys(S.history)) {
      if (S.habits.length > 0 && getDone(k).length === S.habits.length) { earned.add('perfect'); newBadges.push('perfect'); break; }
    }
  }
  if (!earned.has('month')) {
    let days = 0;
    Object.keys(S.history).forEach(k => { if (getDone(k).length > 0) days++; });
    if (days >= 30) { earned.add('month'); newBadges.push('month'); }
  }
  if (!earned.has('beast') && S.habits.length > 0) {
    let bc = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today()); d.setDate(d.getDate()-i);
      if (getDone(dkey(d)).length === S.habits.length) bc++;
      else break;
    }
    if (bc >= 7) { earned.add('beast'); newBadges.push('beast'); }
  }
  S.badges = [...earned];
  saveToFirebase();
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

// ===================== TODAY COMMAND CENTER =====================
function renderTodayCommandCenter() {
  const tk = todayKey();
  const done = getDone(tk);
  const total = S.habits.length;
  const doneCount = done.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const streak = calcStreak();
  const remaining = Math.max(0, total - doneCount);
  const allCompleted = total > 0 && doneCount === total;

  const dateEl = document.getElementById('tccDate');
  if (dateEl) {
    dateEl.textContent = today().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  const countEl = document.getElementById('tccCount');
  if (countEl) {
    countEl.textContent = `${doneCount} / ${total} habits completed`;
  }

  const pctEl = document.getElementById('tccPct');
  if (pctEl) {
    pctEl.textContent = `${pct}%`;
    if (prevTccPct !== null && prevTccPct !== pct) {
      pctEl.classList.remove('pct-bump');
      void pctEl.offsetWidth;
      pctEl.classList.add('pct-bump');
    }
    prevTccPct = pct;
  }

  const barEl = document.getElementById('tccBarFill');
  if (barEl) {
    barEl.style.width = `${pct}%`;
    if (allCompleted) {
      barEl.classList.add('completed');
    } else {
      barEl.classList.remove('completed');
    }
  }

  const streakEl = document.getElementById('tccStreak');
  if (streakEl) {
    streakEl.textContent = `🔥 ${streak} day streak`;
  }

  const remEl = document.getElementById('tccRemaining');
  if (remEl) {
    if (allCompleted) {
      remEl.textContent = `🎉 0 habits remaining`;
    } else {
      remEl.textContent = `⏳ ${remaining} ${remaining === 1 ? 'habit' : 'habits'} remaining`;
    }
  }

  const bannerEl = document.getElementById('tccCompleteBanner');
  if (bannerEl) {
    bannerEl.style.display = allCompleted ? 'flex' : 'none';
  }

  const cardEl = document.getElementById('todayCC');
  if (cardEl) {
    if (allCompleted) {
      cardEl.classList.add('all-done');
    } else {
      cardEl.classList.remove('all-done');
    }
  }
}

// ===================== TODAY =====================
function renderToday() {
  const tk = todayKey();
  const done = getDone(tk);
  const total = S.habits.length;
  const pct = total ? done.length / total : 0;
  const circ = 226.2;
  document.getElementById('ringCircle').style.strokeDashoffset = circ - circ * pct;
  document.getElementById('ringPct').textContent = Math.round(pct*100) + '%';
  document.getElementById('statStreak').textContent = calcStreak();
  document.getElementById('statDone').textContent = done.length + (total ? '/'+total : '');
  renderLevel();
  renderTodayCommandCenter();
  renderPersonalRecords();
  renderHabitInsights();

  const list = document.getElementById('habitsList');
  list.innerHTML = '';
  if (!S.habits.length) {
    list.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:2rem">Koi habit nahi! Niche se add karo.</div>';
    return;
  }

  S.habits.forEach(h => {
    const isDone = done.includes(h.id);
    const isJustToggled = (h.id === lastToggledHabitId);
    const isJustAdded = (h.id === lastAddedHabitId);
    let animClass = '';
    if (isJustToggled) {
      animClass = (lastToggledAction === 'complete') ? ' just-completed' : ' just-unchecked';
    } else if (isJustAdded) {
      animClass = ' just-added';
    }

    const subItems = getSubItems(h.id);
    const subDone = getSubDone(h.id, tk);
    const hasSub = subItems.length > 0;
    const card = document.createElement('div');
    card.className = 'hcard' + (isDone ? ' done' : '') + animClass;
    if (isDone) { card.style.background = h.color + '14'; card.style.borderColor = h.color + '55'; }
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const d2 = new Date(today()); d2.setDate(d2.getDate()-i);
      const hit = getDone(dkey(d2)).includes(h.id);
      dots += `<div class="hdot${hit?' hit':''}${i===0?' today':''}"></div>`;
    }
    const subPill = hasSub ? `<span style="font-size:10px;color:${h.color};background:${h.color}18;padding:2px 7px;border-radius:20px;margin-left:6px">${subDone.length}/${subItems.length}</span>` : '';
    card.innerHTML = `
      <div class="hcard-ico" style="background:${h.color}20">${h.icon}</div>
      <div class="hcard-body">
        <div class="hcard-name">${h.name}${subPill}</div>
        <div class="hcard-sub">${h.sub || ''}</div>
        <div class="hcard-dots">${dots}</div>
      </div>
      ${hasSub ? `<button class="hcard-expand" title="Open details">📋</button>` : ''}
      <div class="hcard-chk" style="${isDone?'background:'+h.color+';border-color:'+h.color+';color:#fff':''}">${isDone?'✓':''}</div>
    `;
    if (hasSub) card.querySelector('.hcard-expand').addEventListener('click', e => { e.stopPropagation(); openSubTracker(h.id); });
    const chk = card.querySelector('.hcard-chk');
    chk.addEventListener('click', e => { e.stopPropagation(); toggleHabit(h.id); });
    card.addEventListener('click', () => openHabitDetail(h.id));
    list.appendChild(card);
  });

  if (activeDetailHabitId) {
    const exists = S.habits.some(h => h.id === activeDetailHabitId);
    if (!exists) closeHabitDetail();
    else renderHabitDetail(activeDetailHabitId);
  }

  if (activeHeatmapDateKey) {
    renderHeatmapDayDetails(activeHeatmapDateKey);
  }
}

function toggleHabit(id) {
  const tk = todayKey();
  const arr = [...getDone(tk)];
  const idx = arr.indexOf(id);
  const prevXP = calcTotalXP();
  if (idx === -1) {
    lastToggledHabitId = id;
    lastToggledAction = 'complete';
    arr.push(id);
    setDone(tk, arr);
    const newBadges = checkBadges();
    newBadges.forEach(bid => {
      const b = BADGE_DEFS.find(x=>x.id===bid);
      if (b) setTimeout(() => toast('Badge unlocked: '+b.name+' '+b.emoji), 500);
    });
    if (arr.length === S.habits.length && S.habits.length > 0) { confetti(); toast('BEAST MODE! Saari habits done! 🔥🔥'); }
    else toast('Done! +' + (calcTotalXP()-prevXP) + ' XP 💪');
  } else {
    lastToggledHabitId = id;
    lastToggledAction = 'uncomplete';
    arr.splice(idx, 1);
    setDone(tk, arr);
  }
  renderToday();
  setTimeout(() => {
    if (lastToggledHabitId === id) {
      lastToggledHabitId = null;
      lastToggledAction = null;
    }
  }, 350);
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
  document.querySelectorAll('.sub-tab').forEach(btn => { btn.onclick = () => setSubTab(btn.dataset.stab); });
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
  if (tab === 'items')    renderSubItems(h);
  if (tab === 'progress') renderSubProgress(h);
  if (tab === 'manage')   renderSubManage(h);
}

function renderSubHero(h) {
  const tk = todayKey();
  const subItems = getSubItems(h.id);
  const subDone = getSubDone(h.id, tk);
  let totalComp = 0;
  if (S.subHistory[h.id]) Object.values(S.subHistory[h.id]).forEach(arr => { totalComp += arr.length; });
  let maxStreak = 0, cur = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today()); d.setDate(d.getDate()-(29-i));
    if (getSubDone(h.id, dkey(d)).length > 0) { cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 0;
  }
  document.getElementById('subHero').innerHTML = `
    <div class="sub-hero-ico" style="background:${h.color}25">${h.icon}</div>
    <div class="sub-hero-info">
      <div class="sub-hero-name">${h.name}</div>
      <div class="sub-hero-sub">${h.sub || 'No description'}</div>
      <div class="sub-hero-stats">
        <div class="sub-hero-stat"><div class="sub-hero-stat-n" style="color:${h.color}">${subItems.length}</div><div class="sub-hero-stat-l">items</div></div>
        <div class="sub-hero-stat"><div class="sub-hero-stat-n" style="color:var(--grn)">${subDone.length}/${subItems.length}</div><div class="sub-hero-stat-l">today</div></div>
        <div class="sub-hero-stat"><div class="sub-hero-stat-n" style="color:var(--ylw)">${totalComp}</div><div class="sub-hero-stat-l">total done</div></div>
        <div class="sub-hero-stat"><div class="sub-hero-stat-n" style="color:var(--org)">${maxStreak}</div><div class="sub-hero-stat-l">best streak</div></div>
      </div>
    </div>`;
}

function renderSubItems(h) {
  const tk = todayKey();
  const subItems = getSubItems(h.id);
  const subDone = getSubDone(h.id, tk);
  const content = document.getElementById('subContent');
  if (!subItems.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-ico">📋</div><div>Koi items nahi hain</div><div style="font-size:12px;margin-top:6px">Manage tab se add karo</div></div><button class="add-habit-btn" onclick="openSubItemModal(null)">+ Item add karo</button>`;
    return;
  }
  let html = '<div class="sub-items-list">';
  subItems.forEach(item => {
    const isDone = subDone.includes(item.id);
    let meta = [];
    if (item.sets && item.reps) meta.push(`${item.sets} sets × ${item.reps} reps`);
    else if (item.sets) meta.push(`${item.sets} sets`);
    else if (item.reps) meta.push(`${item.reps} reps`);
    if (item.duration) meta.push(item.duration);
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today()); d.setDate(d.getDate()-i);
      dots += `<div class="si-dot${getSubDone(h.id,dkey(d)).includes(item.id)?' hit':''}"></div>`;
    }
    html += `<div class="si-card${isDone?' done':''}" style="${isDone?'background:'+h.color+'14;border-color:'+h.color+'55':''}" data-id="${item.id}">
      <div class="si-ico" style="background:${h.color}20">${item.emoji||'💪'}</div>
      <div class="si-body">
        <div class="si-name">${item.name}</div>
        <div class="si-meta">${meta.join(' · ')||'Tap to mark done'}</div>
        <div class="si-streak">${dots}</div>
      </div>
      <div class="si-chk" style="${isDone?'background:'+h.color+';border-color:'+h.color+';color:#fff':''}">${isDone?'✓':''}</div>
    </div>`;
  });
  html += '</div><button class="add-habit-btn" onclick="openSubItemModal(null)">+ Item add karo</button>';
  content.innerHTML = html;
  content.querySelectorAll('.si-card').forEach(card => { card.addEventListener('click', () => toggleSubItem(h.id, card.dataset.id)); });
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
      toast(`${h?h.icon:'🔥'} Saari items done! Beast! 💪`);
      const mainDone = [...getDone(tk)];
      if (!mainDone.includes(habitId)) { mainDone.push(habitId); setDone(tk, mainDone); checkBadges(); }
    } else { toast('Item done! 💪'); }
  } else {
    arr.splice(idx, 1);
    setSubDone(habitId, tk, arr);
  }
  if (h) { renderSubItems(h); renderSubHero(h); }
}

function renderSubProgress(h) {
  const subItems = getSubItems(h.id);
  const content = document.getElementById('subContent');
  if (!subItems.length) { content.innerHTML = `<div class="empty-state"><div class="empty-state-ico">📈</div><div>Koi items nahi — pehle add karo</div></div>`; return; }
  let html = `<div class="lbl" style="margin-bottom:12px">last 30 days — per item</div>`;
  subItems.forEach(item => {
    let cnt = 0;
    for (let i = 0; i < 30; i++) { const d = new Date(today()); d.setDate(d.getDate()-i); if (getSubDone(h.id,dkey(d)).includes(item.id)) cnt++; }
    const pct = Math.round(cnt/30*100);
    let meta = [];
    if (item.sets && item.reps) meta.push(`${item.sets}×${item.reps}`);
    if (item.duration) meta.push(item.duration);
    html += `<div class="sp-row">
      <div class="sp-name"><span>${item.emoji||'💪'}</span><span>${item.name}</span>${meta.length?`<span style="font-size:10px;color:var(--muted);font-weight:400">${meta.join(' · ')}</span>`:''}
      </div>
      <div class="sp-bar-wrap"><div class="sp-track"><div class="sp-fill" style="width:${pct}%;background:${h.color}"></div></div><div class="sp-pct">${pct}%</div></div>
      <div class="sp-counts">${cnt}/30 days completed</div>
    </div>`;
  });
  html += `<div class="lbl" style="margin:1.25rem 0 10px">activity — last 10 weeks</div><div style="background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:14px;overflow-x:auto"><div style="display:flex;gap:3px">`;
  const startDate = new Date(today()); startDate.setDate(startDate.getDate()-69);
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate()-1);
  const cur = new Date(startDate); let weeks = []; let cw = [];
  while (cur <= today()) {
    if (cur.getDay() === 0 && cw.length) { weeks.push(cw); cw = []; }
    const k = dkey(cur); const isFuture = cur > today();
    const d = getSubDone(h.id, k); const items = getSubItems(h.id);
    const pct = items.length && !isFuture ? d.length/items.length : 0;
    const lvl = isFuture?'future':pct===0?'l0':pct<0.5?'l2':pct<1?'l3':'l4';
    cw.push(`<div class="hm-cell ${lvl}" title="${cur.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}: ${d.length}/${items.length}"></div>`);
    cur.setDate(cur.getDate()+1);
  }
  if (cw.length) weeks.push(cw);
  weeks.forEach(w => { html += `<div class="hm-week">${w.join('')}</div>`; });
  html += `</div></div>`;
  content.innerHTML = html;
}

function renderSubManage(h) {
  const subItems = getSubItems(h.id);
  const content = document.getElementById('subContent');
  let html = '';
  if (!subItems.length) html += `<div class="empty-state"><div class="empty-state-ico">⚙️</div><div>Koi items nahi abhi</div></div>`;
  else subItems.forEach(item => {
    let meta = [];
    if (item.sets && item.reps) meta.push(`${item.sets} sets × ${item.reps} reps`);
    if (item.duration) meta.push(item.duration);
    html += `<div class="sm-row">
      <div class="sm-ico" style="background:${h.color}20">${item.emoji||'💪'}</div>
      <div class="sm-info"><div class="sm-name">${item.name}</div><div class="sm-meta">${meta.join(' · ')||'No details'}</div></div>
      <div class="sm-actions">
        <button class="sm-edit" data-id="${item.id}">✏️ Edit</button>
        <button class="sm-del" data-id="${item.id}">🗑</button>
      </div>
    </div>`;
  });
  html += `<button class="add-habit-btn" onclick="openSubItemModal(null)">+ Item add karo</button>`;
  content.innerHTML = html;
  content.querySelectorAll('.sm-edit').forEach(btn => btn.addEventListener('click', () => openSubItemModal(btn.dataset.id)));
  content.querySelectorAll('.sm-del').forEach(btn => btn.addEventListener('click', () => deleteSubItem(h.id, btn.dataset.id)));
}

function deleteSubItem(habitId, itemId) {
  if (!confirm('Yeh item delete karna chahte ho?')) return;
  if (!S.subItems[habitId]) return;
  S.subItems[habitId] = S.subItems[habitId].filter(x => x.id !== itemId);
  saveToFirebase();
  const h = S.habits.find(x => x.id === habitId);
  if (h) { renderSubManage(h); renderSubHero(h); }
  toast('Item delete ho gaya 🗑');
}

// ===================== SUB ITEM MODAL =====================
let editingSubItemId = null;
let siSelEmoji = SUB_EMOJIS[0];

window.openSubItemModal = function(itemId) {
  editingSubItemId = itemId;
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
};

function buildSubEmojiPicker() {
  const ep = document.getElementById('siEmojiPick');
  ep.innerHTML = '';
  SUB_EMOJIS.forEach(e => {
    const d = document.createElement('div');
    d.className = 'e-opt' + (e === siSelEmoji ? ' sel' : '');
    d.textContent = e;
    d.addEventListener('click', () => { siSelEmoji=e; ep.querySelectorAll('.e-opt').forEach(x=>x.classList.remove('sel')); d.classList.add('sel'); });
    ep.appendChild(d);
  });
}

function closeSubItemModal() { document.getElementById('subItemOverlay').classList.remove('open'); }

function saveSubItem() {
  const name = document.getElementById('siName').value.trim();
  if (!name) { toast('Naam toh dalo! 🙏'); return; }
  const sets = parseInt(document.getElementById('siSets').value) || null;
  const reps = parseInt(document.getElementById('siReps').value) || null;
  const duration = document.getElementById('siDuration').value.trim() || '';
  if (!S.subItems[subHabitId]) S.subItems[subHabitId] = [];
  if (editingSubItemId) {
    const item = S.subItems[subHabitId].find(x => x.id === editingSubItemId);
    if (item) { item.name=name; item.sets=sets; item.reps=reps; item.duration=duration; item.emoji=siSelEmoji; }
    toast('Item update ho gaya! ✏️');
  } else {
    S.subItems[subHabitId].push({ id:'si_'+Date.now(), name, sets, reps, duration, emoji:siSelEmoji });
    toast('Nai item add ho gayi! 🎯');
  }
  saveToFirebase();
  closeSubItemModal();
  const h = S.habits.find(x => x.id === subHabitId);
  if (h) { setSubTab(subActiveTab); renderSubHero(h); }
}

// ===================== HABIT DETAIL VIEW =====================
let activeDetailHabitId = null;

function calcHabitCurrentStreak(habitId) {
  const d = new Date(today());
  d.setHours(0, 0, 0, 0);
  const tk = dkey(d);
  const doneToday = getDone(tk).includes(habitId);

  let streak = 0;
  if (doneToday) {
    streak = 1;
    d.setDate(d.getDate() - 1);
  } else {
    d.setDate(d.getDate() - 1);
  }

  while (streak < 9999) {
    const k = dkey(d);
    if (getDone(k).includes(habitId)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calcHabitBestStreak(habitId) {
  const dates = Object.keys(S.history || {})
    .filter(k => getDone(k).includes(habitId))
    .sort();

  if (dates.length === 0) return 0;

  let maxStreak = 0;
  let curStreak = 0;
  let prevDate = null;

  for (const dateStr of dates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const curDate = new Date(y, m - 1, d);
    curDate.setHours(0, 0, 0, 0);

    if (!prevDate) {
      curStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        curStreak++;
      } else if (diffDays > 1) {
        curStreak = 1;
      }
    }
    if (curStreak > maxStreak) maxStreak = curStreak;
    prevDate = curDate;
  }

  const currentStreak = calcHabitCurrentStreak(habitId);
  return Math.max(maxStreak, currentStreak);
}

function getHabitStats(habitId) {
  const completedDates = Object.keys(S.history || {})
    .filter(k => getDone(k).includes(habitId))
    .sort();

  const totalCompletions = completedDates.length;
  const currentStreak = calcHabitCurrentStreak(habitId);
  const bestStreak = calcHabitBestStreak(habitId);

  let completionRatePct = null;
  let lastCompletedStr = 'Not completed yet';

  if (totalCompletions > 0) {
    const earliestKey = completedDates[0];
    const [ey, em, ed] = earliestKey.split('-').map(Number);
    const startDate = new Date(ey, em - 1, ed);
    startDate.setHours(0, 0, 0, 0);

    const todayDate = new Date(today());
    todayDate.setHours(0, 0, 0, 0);

    const msDiff = todayDate.getTime() - startDate.getTime();
    const daysSpan = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24)) + 1);
    const denominator = Math.max(totalCompletions, daysSpan);
    completionRatePct = Math.min(100, Math.round((totalCompletions / denominator) * 100));

    const latestKey = completedDates[completedDates.length - 1];
    const [ly, lm, ld] = latestKey.split('-').map(Number);
    const formattedDate = `${ld} ${MONTHS_SHORT[lm - 1]} ${ly}`;
    if (latestKey === todayKey()) {
      lastCompletedStr = `Today (${formattedDate})`;
    } else {
      lastCompletedStr = formattedDate;
    }
  }

  return {
    totalCompletions,
    currentStreak,
    bestStreak,
    completionRatePct,
    lastCompletedStr,
    completedDates
  };
}

function openHabitDetail(habitId) {
  const h = S.habits.find(x => x.id === habitId);
  if (!h) return;
  activeDetailHabitId = habitId;
  renderHabitDetail(habitId);
  const overlay = document.getElementById('habitDetailOverlay');
  if (overlay) overlay.classList.add('open');
}

function closeHabitDetail() {
  activeDetailHabitId = null;
  const overlay = document.getElementById('habitDetailOverlay');
  if (overlay) overlay.classList.remove('open');
}

function renderHabitDetail(habitId) {
  const h = S.habits.find(x => x.id === habitId);
  if (!h) {
    closeHabitDetail();
    return;
  }

  const tk = todayKey();
  const isDoneToday = getDone(tk).includes(habitId);
  const stats = getHabitStats(habitId);
  const subItems = getSubItems(h.id);
  const subDone = getSubDone(h.id, tk);
  const hasSub = subItems.length > 0;

  const title = `${h.icon} ${h.name}`;
  const navTitleEl = document.getElementById('hdNavTitle');
  if (navTitleEl) navTitleEl.textContent = title;

  let historyRowsHtml = '';
  for (let i = 0; i < 30; i++) {
    const d = new Date(today());
    d.setDate(d.getDate() - i);
    const dk = dkey(d);
    const isDone = getDone(dk).includes(habitId);
    const isToday = i === 0;
    const isYesterday = i === 1;
    const dateFormatted = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
    const dayTag = isToday ? 'Today' : (isYesterday ? 'Yesterday' : DAYS_S[d.getDay()]);

    historyRowsHtml += `
      <div class="hd-history-row">
        <div class="hd-history-date">
          <span>${dateFormatted}</span>
          <span class="hd-history-daytag${isToday ? ' today' : ''}">${dayTag}</span>
        </div>
        <div class="hd-history-status ${isDone ? 'done' : 'missed'}">
          ${isDone ? '✓ Done' : '—'}
        </div>
      </div>
    `;
  }

  const contentEl = document.getElementById('hdContent');
  if (!contentEl) return;

  const emptyBannerHtml = stats.totalCompletions === 0 ? `
    <div class="hd-empty">
      <div class="hd-empty-icon">🌱</div>
      <div class="hd-empty-title">No completion history yet</div>
      <div class="hd-empty-desc">Complete this habit to start building streaks and tracking your consistency over time.</div>
    </div>
  ` : '';

  contentEl.innerHTML = `
    <div class="hd-hero">
      <div class="hd-hero-main">
        <div class="hd-hero-ico" style="background:${h.color}25">${h.icon}</div>
        <div class="hd-hero-info">
          <div class="hd-hero-title">${h.name}</div>
          <div class="hd-hero-sub">Your history with this habit</div>
          ${h.sub ? `<div class="hd-hero-desc">${h.sub}</div>` : ''}
        </div>
      </div>
      <div class="hd-hero-actions">
        ${hasSub ? `<button class="hd-today-btn" id="hdSubBtn" style="color:var(--blu);border-color:var(--border2)">📋 Items (${subDone.length}/${subItems.length})</button>` : ''}
        <button class="hd-today-btn ${isDoneToday ? 'done' : ''}" id="hdToggleToday">
          ${isDoneToday ? '✓ Done Today' : '○ Mark Done Today'}
        </button>
      </div>
    </div>

    ${emptyBannerHtml}

    <div class="lbl">Habit Statistics</div>
    <div class="hd-grid">
      <div class="hd-stat">
        <div class="hd-stat-lbl">🔥 Current Streak</div>
        <div class="hd-stat-val">${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}</div>
      </div>
      <div class="hd-stat">
        <div class="hd-stat-lbl">🏆 Best Streak</div>
        <div class="hd-stat-val">${stats.totalCompletions > 0 ? `${stats.bestStreak} ${stats.bestStreak === 1 ? 'day' : 'days'}` : 'No record yet'}</div>
      </div>
      <div class="hd-stat">
        <div class="hd-stat-lbl">✅ Total Completions</div>
        <div class="hd-stat-val">${stats.totalCompletions} ${stats.totalCompletions === 1 ? 'day' : 'days'}</div>
      </div>
      <div class="hd-stat">
        <div class="hd-stat-lbl">📊 Completion Rate</div>
        <div class="hd-stat-val">${stats.completionRatePct !== null ? `${stats.completionRatePct}%` : 'No history'}</div>
      </div>
    </div>

    <div class="hd-recent-card">
      <div class="hd-recent-lbl">📅 Recent Activity</div>
      <div class="hd-recent-val">${stats.lastCompletedStr === 'Not completed yet' ? 'Not completed yet' : 'Last completed: ' + stats.lastCompletedStr}</div>
    </div>

    <div class="hd-history-card">
      <div class="hd-history-head">
        <div class="hd-history-title">Completion History</div>
        <div class="hd-history-sub">Last 30 days</div>
      </div>
      <div class="hd-history-list">
        ${historyRowsHtml}
      </div>
    </div>
  `;

  const toggleBtn = document.getElementById('hdToggleToday');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      toggleHabit(habitId);
    };
  }

  const subBtn = document.getElementById('hdSubBtn');
  if (subBtn) {
    subBtn.onclick = () => {
      openSubTracker(habitId);
    };
  }
}

window.openHabitDetail = openHabitDetail;
window.closeHabitDetail = closeHabitDetail;

// ===================== WEEKLY =====================
let wkOffset = 0;
function getWeekDays(offset) {
  const d = new Date(today()); d.setDate(d.getDate()-d.getDay()+offset*7); d.setHours(0,0,0,0);
  const days = [];
  for (let i=0;i<7;i++) { const day=new Date(d); day.setDate(d.getDate()+i); days.push(day); }
  return days;
}
function renderWeekly() {
  const days = getWeekDays(wkOffset), tk = todayKey();
  const fmt = d => d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  document.getElementById('wkTitle').textContent = fmt(days[0])+' – '+fmt(days[6])+' '+days[6].getFullYear();
  let totalDone=0, perfectDays=0, activeDays=0;
  days.forEach(d => {
    const k=dkey(d), done=getDone(k), isFuture=d>today()&&k!==tk;
    if (!isFuture) { totalDone+=done.length; if(done.length>0) activeDays++; if(S.habits.length&&done.length===S.habits.length) perfectDays++; }
  });
  const possible = S.habits.length*days.filter(d=>!(d>today()&&dkey(d)!==tk)).length;
  const avg = possible ? Math.round(totalDone/possible*100) : 0;
  document.getElementById('wkSummary').innerHTML = `<div class="sum-card"><div class="sum-n">${totalDone}</div><div class="sum-l">total done</div></div><div class="sum-card"><div class="sum-n">${perfectDays}</div><div class="sum-l">perfect days</div></div><div class="sum-card"><div class="sum-n">${activeDays}</div><div class="sum-l">active days</div></div><div class="sum-card"><div class="sum-n">${avg}%</div><div class="sum-l">avg complete</div></div>`;
  const barsEl = document.getElementById('wkBars'); barsEl.innerHTML = '';
  days.forEach(d => {
    const k=dkey(d),done=getDone(k),isFuture=d>today()&&k!==tk,isToday=k===tk;
    const pct=S.habits.length&&!isFuture?Math.round(done.length/S.habits.length*100):0;
    const col=document.createElement('div'); col.className='wbar-col'+(isToday?' hl':'');
    col.innerHTML=`<div class="wbar-name">${DAYS_S[d.getDay()]}</div><div class="wbar-num">${d.getDate()}</div><div class="wbar-track"><div class="wbar-fill" style="height:${pct}%"></div></div><div class="wbar-pct">${isFuture?'—':pct+'%'}</div>`;
    barsEl.appendChild(col);
  });
  const tbl=document.getElementById('wkTable');
  const headCells=days.map(d=>`<th>${DAYS_S[d.getDay()]}<br><span style="font-size:9px;font-weight:400">${d.getDate()}</span></th>`).join('');
  let rows=`<thead><tr><th>Habit</th>${headCells}</tr></thead><tbody>`;
  if (!S.habits.length) rows+=`<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:1.5rem">Koi habit nahi hai</td></tr>`;
  else S.habits.forEach(h => {
    const cells=days.map(d=>{const k=dkey(d),isFuture=d>today()&&k!==tk,done=getDone(k).includes(h.id),cls=isFuture?'f':done?'y':'n';return`<td><div class="tc ${cls}"></div></td>`;}).join('');
    rows+=`<tr><td><span style="margin-right:6px">${h.icon}</span>${h.name}</td>${cells}</tr>`;
  });
  tbl.innerHTML=rows+'</tbody>';
}

// ===================== MONTHLY =====================
let moOffset = 0;
function renderMonthly() {
  const now=today(), ref=new Date(now.getFullYear(),now.getMonth()+moOffset,1);
  const yr=ref.getFullYear(), mo=ref.getMonth(), dIM=new Date(yr,mo+1,0).getDate(), fD=new Date(yr,mo,1).getDay(), tk=todayKey();
  document.getElementById('moTitle').textContent=MONTHS[mo]+' '+yr;
  let totalDone=0,perfectDays=0,activeDays=0,countedDays=0;
  for (let d=1;d<=dIM;d++) {
    const dt=new Date(yr,mo,d),k=dkey(dt);
    if (dt>now&&k!==tk) continue; countedDays++;
    const done=getDone(k); totalDone+=done.length;
    if (done.length>0) activeDays++;
    if (S.habits.length&&done.length===S.habits.length) perfectDays++;
  }
  const possible=S.habits.length*countedDays, avg=possible?Math.round(totalDone/possible*100):0;
  document.getElementById('moSummary').innerHTML=`<div class="sum-card"><div class="sum-n">${totalDone}</div><div class="sum-l">total done</div></div><div class="sum-card"><div class="sum-n">${perfectDays}</div><div class="sum-l">perfect days</div></div><div class="sum-card"><div class="sum-n">${activeDays}</div><div class="sum-l">active days</div></div><div class="sum-card"><div class="sum-n">${avg}%</div><div class="sum-l">completion</div></div>`;
  const grid=document.getElementById('calGrid'); grid.innerHTML='';
  for (let e=0;e<fD;e++) { const empty=document.createElement('div'); empty.className='cal-cell empty'; grid.appendChild(empty); }
  for (let d=1;d<=dIM;d++) {
    const dt=new Date(yr,mo,d),k=dkey(dt),isFuture=dt>now&&k!==tk,isToday=k===tk,done=getDone(k),pct=S.habits.length&&!isFuture?done.length/S.habits.length:0;
    const cell=document.createElement('div'); cell.className='cal-cell'+(isFuture?' future':'')+(isToday?' is-today':'');
    const numEl=isToday?`<div class="cal-num" style="display:flex"><div style="background:var(--pur);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">${d}</div></div>`:`<div class="cal-num">${d}</div>`;
    const dots=!isFuture&&done.length>0?S.habits.filter(h=>done.includes(h.id)).map(h=>`<div class="cal-cdot" style="background:${h.color}"></div>`).join(''):'';
    cell.innerHTML=`${numEl}<div class="cal-dots-row">${dots}</div>${!isFuture&&pct>0?`<div class="cal-bar"><div class="cal-bar-fill" style="width:${Math.round(pct*100)}%"></div></div>`:''}`;
    grid.appendChild(cell);
  }
  const moH=document.getElementById('moHabits'); moH.innerHTML='';
  if (!S.habits.length) { moH.innerHTML='<div style="padding:1rem;color:var(--muted);font-size:13px;text-align:center">Koi habit nahi hai</div>'; return; }
  S.habits.forEach(h => {
    let cnt=0,total2=0;
    for (let d=1;d<=dIM;d++) { const dt=new Date(yr,mo,d),k=dkey(dt); if(dt>now&&k!==tk) continue; total2++; if(getDone(k).includes(h.id)) cnt++; }
    const pct=total2?Math.round(cnt/total2*100):0;
    const row=document.createElement('div'); row.className='mhb-row';
    row.innerHTML=`<div class="mhb-ico">${h.icon}</div><div class="mhb-name">${h.name}</div><div class="mhb-track"><div class="mhb-fill" style="width:${pct}%;background:${h.color}"></div></div><div class="mhb-pct">${cnt}/${total2} (${pct}%)</div>`;
    moH.appendChild(row);
  });
}

// ===================== PERSONAL RECORDS =====================
function renderPersonalRecords() {
  const card = document.getElementById('prCard');
  if (!card) return;

  const emptyEl = document.getElementById('prEmpty');
  const gridEl = document.getElementById('prGrid');

  let totalCompletions = 0;
  const historyKeys = Object.keys(S.history || {});
  historyKeys.forEach(k => {
    totalCompletions += [...new Set(getDone(k))].length;
  });

  if (totalCompletions === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (gridEl) gridEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (gridEl) gridEl.style.display = 'grid';

  // 1. Longest Streak
  const datesWithDone = historyKeys.filter(k => getDone(k).length > 0);
  let longestStreak = 0;

  if (datesWithDone.length > 0) {
    datesWithDone.sort();
    const [sy, sm, sd] = datesWithDone[0].split('-').map(Number);
    const cur = new Date(sy, sm - 1, sd);
    cur.setHours(0, 0, 0, 0);

    const end = today();
    end.setHours(0, 0, 0, 0);
    const tk = todayKey();

    let curRun = 0;
    while (cur <= end) {
      const k = dkey(cur);
      const done = getDone(k);
      const isStreakDay = (k === tk) ? (done.length > 0) : (S.habits.length > 0 && done.length >= S.habits.length);

      if (isStreakDay) {
        curRun++;
        if (curRun > longestStreak) longestStreak = curRun;
      } else {
        curRun = 0;
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  const currentStreak = calcStreak();
  longestStreak = Math.max(longestStreak, currentStreak);

  const longestStreakEl = document.getElementById('prLongestStreak');
  if (longestStreakEl) {
    longestStreakEl.textContent = longestStreak > 0 ? `${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}` : 'No record yet';
  }

  // 2. Current Streak
  const currentStreakEl = document.getElementById('prCurrentStreak');
  if (currentStreakEl) {
    currentStreakEl.textContent = `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;
  }

  // 3. Best Day
  let maxHabitsDone = 0;
  let bestDayKey = null;

  historyKeys.forEach(k => {
    const done = [...new Set(getDone(k))];
    if (done.length > maxHabitsDone) {
      maxHabitsDone = done.length;
      bestDayKey = k;
    } else if (done.length === maxHabitsDone && maxHabitsDone > 0 && k > bestDayKey) {
      bestDayKey = k;
    }
  });

  const bestDayEl = document.getElementById('prBestDay');
  if (bestDayEl) {
    if (maxHabitsDone > 0 && bestDayKey) {
      const [by, bm, bd] = bestDayKey.split('-').map(Number);
      bestDayEl.textContent = `${maxHabitsDone} ${maxHabitsDone === 1 ? 'habit' : 'habits'} · ${bd} ${MONTHS_SHORT[bm - 1] || ''} ${by}`;
    } else {
      bestDayEl.textContent = 'No record yet';
    }
  }

  // 4. Most Consistent Day
  let maxPct = 0;
  let bestPctKey = null;

  historyKeys.forEach(k => {
    const done = [...new Set(getDone(k))];
    if (done.length > 0) {
      const dayHabits = new Set([...S.habits.map(h => h.id), ...done]);
      const denominator = Math.max(1, dayHabits.size);
      const pct = Math.min(100, Math.round((done.length / denominator) * 100));
      if (pct > maxPct) {
        maxPct = pct;
        bestPctKey = k;
      } else if (pct === maxPct && maxPct > 0 && k > bestPctKey) {
        bestPctKey = k;
      }
    }
  });

  const consistentDayEl = document.getElementById('prConsistentDay');
  if (consistentDayEl) {
    if (maxPct > 0 && bestPctKey) {
      const [cy, cm, cd] = bestPctKey.split('-').map(Number);
      consistentDayEl.textContent = `${maxPct}% · ${cd} ${MONTHS_SHORT[cm - 1] || ''} ${cy}`;
    } else {
      consistentDayEl.textContent = 'No record yet';
    }
  }

  // 5. Total Completions
  const totalCompletionsEl = document.getElementById('prTotalCompletions');
  if (totalCompletionsEl) {
    totalCompletionsEl.textContent = `${totalCompletions.toLocaleString()} ${totalCompletions === 1 ? 'completion' : 'completions'}`;
  }

  // 6. Most Active Month
  const monthCounts = {};
  historyKeys.forEach(k => {
    const doneCount = [...new Set(getDone(k))].length;
    if (doneCount > 0 && k.length >= 7) {
      const ym = k.slice(0, 7);
      monthCounts[ym] = (monthCounts[ym] || 0) + doneCount;
    }
  });

  let maxMonthKey = null;
  let maxMonthCompletions = 0;
  Object.entries(monthCounts).forEach(([ym, count]) => {
    if (count > maxMonthCompletions) {
      maxMonthCompletions = count;
      maxMonthKey = ym;
    } else if (count === maxMonthCompletions && maxMonthCompletions > 0 && ym > maxMonthKey) {
      maxMonthKey = ym;
    }
  });

  const activeMonthEl = document.getElementById('prActiveMonth');
  if (activeMonthEl) {
    if (maxMonthCompletions > 0 && maxMonthKey) {
      const [my, mm] = maxMonthKey.split('-').map(Number);
      const mName = MONTHS[mm - 1] || '';
      activeMonthEl.textContent = `${mName} ${my} · ${maxMonthCompletions} ${maxMonthCompletions === 1 ? 'completion' : 'completions'}`;
    } else {
      activeMonthEl.textContent = 'No record yet';
    }
  }
}

// ===================== STATS =====================
function renderStats() { renderPersonalRecords(); renderHabitInsights(); renderHeatmap(); renderPieChart(); renderTopHabits(); renderLineChart(); }

// ===================== HABIT INSIGHTS =====================
function getDateKeysInRange(startKey, endKey) {
  if (!startKey || !endKey || startKey > endKey) return [];
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const cur = new Date(sy, sm - 1, sd);
  cur.setHours(0, 0, 0, 0);

  const [ey, em, ed] = endKey.split('-').map(Number);
  const end = new Date(ey, em - 1, ed);
  end.setHours(0, 0, 0, 0);

  const keys = [];
  while (cur <= end) {
    keys.push(dkey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

function isHabitEligibleOnDateKey(habit, dateKey, earliestDateWithDone) {
  const tk = todayKey();
  if (dateKey > tk) return false;
  if (earliestDateWithDone && dateKey < earliestDateWithDone) {
    return (getDone(dateKey) || []).includes(habit.id);
  }
  if (habit.id && habit.id.startsWith('h_')) {
    const ts = parseInt(habit.id.slice(2), 10);
    if (!isNaN(ts) && ts > 1500000000000) {
      const habitCreatedKey = dkey(new Date(ts));
      if (dateKey < habitCreatedKey) {
        return (getDone(dateKey) || []).includes(habit.id);
      }
    }
  }
  return true;
}

function getHabitCompletionRate(habit, earliestDateWithDone) {
  const tk = todayKey();
  if (!earliestDateWithDone) return { completionDays: 0, eligibleDays: 0, ratePct: null };

  let habitStartKey = earliestDateWithDone;
  if (habit.id && habit.id.startsWith('h_')) {
    const ts = parseInt(habit.id.slice(2), 10);
    if (!isNaN(ts) && ts > 1500000000000) {
      const createdKey = dkey(new Date(ts));
      if (createdKey > habitStartKey) {
        habitStartKey = createdKey;
      }
    }
  }
  const completedDates = Object.keys(S.history || {})
    .filter(k => (getDone(k) || []).includes(habit.id))
    .sort();
  if (completedDates.length > 0 && completedDates[0] < habitStartKey) {
    habitStartKey = completedDates[0];
  }
  if (habitStartKey > tk) habitStartKey = tk;

  const dateKeys = getDateKeysInRange(habitStartKey, tk);
  let completionDays = 0;
  let eligibleDays = 0;

  dateKeys.forEach(k => {
    if (isHabitEligibleOnDateKey(habit, k, earliestDateWithDone)) {
      eligibleDays++;
      if ((getDone(k) || []).includes(habit.id)) {
        completionDays++;
      }
    }
  });

  const ratePct = eligibleDays > 0 ? Math.min(100, Math.round((completionDays / eligibleDays) * 100)) : null;
  return { completionDays, eligibleDays, ratePct };
}

function getBestWeekday(earliestDateWithDone) {
  if (!earliestDateWithDone) return null;
  const tk = todayKey();
  const dateKeys = getDateKeysInRange(earliestDateWithDone, tk);
  if (dateKeys.length < 3) return null;

  const weekdayStats = Array.from({ length: 7 }, () => ({ completed: 0, eligible: 0, dayCount: 0 }));

  dateKeys.forEach(k => {
    const [y, m, d] = k.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dow = dt.getDay();

    const doneIds = [...new Set(getDone(k) || [])];
    const completedCount = doneIds.length;

    let eligibleCount = completedCount;
    S.habits.forEach(h => {
      if (!doneIds.includes(h.id) && isHabitEligibleOnDateKey(h, k, earliestDateWithDone)) {
        eligibleCount++;
      }
    });

    if (eligibleCount > 0) {
      weekdayStats[dow].completed += completedCount;
      weekdayStats[dow].eligible += eligibleCount;
      weekdayStats[dow].dayCount++;
    }
  });

  let bestDow = null;
  let bestRate = -1;
  let maxCompleted = 0;

  weekdayStats.forEach((st, dow) => {
    if (st.eligible > 0 && st.completed > 0) {
      const rate = st.completed / st.eligible;
      if (rate > bestRate || (rate === bestRate && st.completed > maxCompleted)) {
        bestRate = rate;
        bestDow = dow;
        maxCompleted = st.completed;
      }
    }
  });

  if (bestDow === null || bestRate <= 0) return null;

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    dayName: weekdayNames[bestDow],
    ratePct: Math.min(100, Math.round(bestRate * 100)),
    completed: weekdayStats[bestDow].completed,
    eligible: weekdayStats[bestDow].eligible
  };
}

function getRecentTrend(earliestDateWithDone) {
  if (!earliestDateWithDone) return null;
  
  const recentDays = [];
  const priorDays = [];
  
  const now = today();
  now.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    recentDays.push(dkey(d));
  }

  for (let i = 7; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    priorDays.push(dkey(d));
  }

  const priorTrackingDays = priorDays.filter(k => k >= earliestDateWithDone);
  if (priorTrackingDays.length < 3) {
    return null;
  }

  let recentCompletions = 0;
  recentDays.forEach(k => {
    recentCompletions += [...new Set(getDone(k) || [])].length;
  });

  let priorCompletions = 0;
  priorDays.forEach(k => {
    priorCompletions += [...new Set(getDone(k) || [])].length;
  });

  let trendType = 'steady';
  let desc = 'Your recent completion activity matches the previous period.';
  let valText = 'Activity is steady (→)';

  if (recentCompletions > priorCompletions) {
    trendType = 'up';
    valText = 'Activity is higher (↗)';
    desc = 'Your recent completion activity is higher than the previous period.';
  } else if (recentCompletions < priorCompletions) {
    trendType = 'down';
    valText = 'Activity is lower (↘)';
    desc = 'Your recent completion activity is lower than the previous period.';
  }

  return {
    trendType,
    valText,
    desc,
    recentCompletions,
    priorCompletions
  };
}

function getHabitInsights() {
  const historyKeys = Object.keys(S.history || {});
  const datesWithCompletions = historyKeys
    .filter(k => (getDone(k) || []).length > 0)
    .sort();

  const earliestDateWithDone = datesWithCompletions[0] || null;
  let totalCompletions = 0;
  historyKeys.forEach(k => {
    totalCompletions += [...new Set(getDone(k) || [])].length;
  });

  const habitStats = S.habits.map(h => {
    const compRate = getHabitCompletionRate(h, earliestDateWithDone);
    
    let uniqueDays = 0;
    historyKeys.forEach(k => {
      if (k <= todayKey() && (getDone(k) || []).includes(h.id)) {
        uniqueDays++;
      }
    });

    return {
      habit: h,
      completionDays: compRate.completionDays,
      eligibleDays: compRate.eligibleDays,
      ratePct: compRate.ratePct,
      uniqueDays
    };
  });

  // 1. Strongest Habit
  let strongest = null;
  if (totalCompletions >= 3 && datesWithCompletions.length >= 2) {
    const qualifying = habitStats.filter(x => x.eligibleDays >= 3 && x.ratePct !== null && x.completionDays >= 1);
    if (qualifying.length > 0) {
      qualifying.sort((a, b) => {
        if (b.ratePct !== a.ratePct) return b.ratePct - a.ratePct;
        return b.completionDays - a.completionDays;
      });
      strongest = qualifying[0];
    }
  }

  // 2. Best Day
  const bestDay = getBestWeekday(earliestDateWithDone);

  // 3. Recent Trend
  const trend = getRecentTrend(earliestDateWithDone);

  // 4. Most Active Habit
  let mostActive = null;
  if (totalCompletions > 0 && S.habits.length > 0) {
    const activeHabits = [...habitStats].filter(x => x.uniqueDays > 0);
    if (activeHabits.length > 0) {
      activeHabits.sort((a, b) => b.uniqueDays - a.uniqueDays);
      mostActive = activeHabits[0];
    }
  }

  // 5. Overall Consistency
  let overallConsistency = null;
  if (earliestDateWithDone && totalCompletions > 0) {
    const tk = todayKey();
    const dateKeys = getDateKeysInRange(earliestDateWithDone, tk);
    let totalDoneAllDays = 0;
    let totalEligibleAllDays = 0;

    dateKeys.forEach(k => {
      const doneIds = [...new Set(getDone(k) || [])];
      let dayEligible = doneIds.length;
      S.habits.forEach(h => {
        if (!doneIds.includes(h.id) && isHabitEligibleOnDateKey(h, k, earliestDateWithDone)) {
          dayEligible++;
        }
      });
      totalDoneAllDays += doneIds.length;
      totalEligibleAllDays += Math.max(doneIds.length, dayEligible);
    });

    if (totalEligibleAllDays > 0 && totalDoneAllDays > 0) {
      const pct = Math.min(100, Math.round((totalDoneAllDays / totalEligibleAllDays) * 100));
      overallConsistency = {
        pct,
        totalDone: totalDoneAllDays,
        totalEligible: totalEligibleAllDays
      };
    }
  }

  // 6. Weakest / Needs Attention
  let needsAttention = null;
  if (totalCompletions >= 3 && S.habits.length >= 2) {
    const qualifying = habitStats.filter(x => x.eligibleDays >= 3 && x.ratePct !== null);
    if (qualifying.length >= 2) {
      qualifying.sort((a, b) => {
        if (a.ratePct !== b.ratePct) return a.ratePct - b.ratePct;
        return a.completionDays - b.completionDays;
      });
      const lowest = qualifying[0];
      const highest = qualifying[qualifying.length - 1];
      if (lowest.ratePct < 95 && lowest.ratePct < highest.ratePct) {
        needsAttention = lowest;
      } else {
        needsAttention = 'on_track';
      }
    }
  }

  return {
    totalCompletions,
    hasHabits: S.habits.length > 0,
    strongest,
    bestDay,
    trend,
    mostActive,
    overallConsistency,
    needsAttention
  };
}

function renderHabitInsights() {
  const card = document.getElementById('hiCard');
  if (!card) return;

  const emptyEl = document.getElementById('hiEmpty');
  const gridEl = document.getElementById('hiGrid');

  const insights = getHabitInsights();

  if (!insights.hasHabits || insights.totalCompletions === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (gridEl) gridEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (gridEl) gridEl.style.display = 'grid';

  // 1. Strongest Habit
  const strongestValEl = document.getElementById('hiStrongestHabit');
  const strongestSubEl = document.getElementById('hiStrongestHabitSub');
  if (strongestValEl && strongestSubEl) {
    if (insights.strongest) {
      strongestValEl.textContent = `${insights.strongest.habit.icon} ${insights.strongest.habit.name} — ${insights.strongest.ratePct}%`;
      strongestSubEl.textContent = `${insights.strongest.completionDays} of ${insights.strongest.eligibleDays} days completed`;
    } else {
      strongestValEl.textContent = 'Not enough data yet.';
      strongestSubEl.textContent = 'Requires a few days of recorded activity.';
    }
  }

  // 2. Best Day
  const bestDayValEl = document.getElementById('hiBestDay');
  const bestDaySubEl = document.getElementById('hiBestDaySub');
  if (bestDayValEl && bestDaySubEl) {
    if (insights.bestDay) {
      bestDayValEl.textContent = `${insights.bestDay.dayName} — ${insights.bestDay.ratePct}% completion`;
      bestDaySubEl.textContent = `${insights.bestDay.completed} habits completed on ${insights.bestDay.dayName}s`;
    } else {
      bestDayValEl.textContent = 'Not enough data yet.';
      bestDaySubEl.textContent = 'Track habits across different days of the week.';
    }
  }

  // 3. Recent Trend
  const trendValEl = document.getElementById('hiRecentTrend');
  const trendSubEl = document.getElementById('hiRecentTrendSub');
  if (trendValEl && trendSubEl) {
    if (insights.trend) {
      trendValEl.textContent = insights.trend.valText;
      trendSubEl.textContent = insights.trend.desc;
    } else {
      trendValEl.textContent = 'Not enough data yet.';
      trendSubEl.textContent = 'Compare periods once more history is recorded.';
    }
  }

  // 4. Most Active Habit
  const mostActiveValEl = document.getElementById('hiMostActiveHabit');
  const mostActiveSubEl = document.getElementById('hiMostActiveHabitSub');
  if (mostActiveValEl && mostActiveSubEl) {
    if (insights.mostActive) {
      mostActiveValEl.textContent = `${insights.mostActive.habit.icon} ${insights.mostActive.habit.name}`;
      mostActiveSubEl.textContent = `${insights.mostActive.uniqueDays} ${insights.mostActive.uniqueDays === 1 ? 'day' : 'days'} completed`;
    } else {
      mostActiveValEl.textContent = 'Not enough data yet.';
      mostActiveSubEl.textContent = 'Complete habits to see your most frequent activity.';
    }
  }

  // 5. Overall Consistency
  const consistencyValEl = document.getElementById('hiConsistency');
  const consistencySubEl = document.getElementById('hiConsistencySub');
  if (consistencyValEl && consistencySubEl) {
    if (insights.overallConsistency) {
      consistencyValEl.textContent = `${insights.overallConsistency.pct}% overall completion`;
      consistencySubEl.textContent = `${insights.overallConsistency.totalDone} of ${insights.overallConsistency.totalEligible} eligible habit-days`;
    } else {
      consistencyValEl.textContent = 'Not enough data yet.';
      consistencySubEl.textContent = 'Updates as you log daily habits.';
    }
  }

  // 6. Weakest / Needs Attention
  const needsAttentionValEl = document.getElementById('hiNeedsAttention');
  const needsAttentionSubEl = document.getElementById('hiNeedsAttentionSub');
  if (needsAttentionValEl && needsAttentionSubEl) {
    if (insights.needsAttention === 'on_track') {
      needsAttentionValEl.textContent = 'All habits on track';
      needsAttentionSubEl.textContent = 'All active habits maintain healthy consistency.';
    } else if (insights.needsAttention) {
      needsAttentionValEl.textContent = `${insights.needsAttention.habit.icon} ${insights.needsAttention.habit.name} — ${insights.needsAttention.ratePct}%`;
      needsAttentionSubEl.textContent = `${insights.needsAttention.completionDays} of ${insights.needsAttention.eligibleDays} days completed`;
    } else {
      needsAttentionValEl.textContent = 'Not enough data yet.';
      needsAttentionSubEl.textContent = 'Requires more activity across multiple habits.';
    }
  }
}

if (typeof window !== 'undefined') {
  window.getHabitInsights = getHabitInsights;
  window.renderHabitInsights = renderHabitInsights;
}

let activeHeatmapDateKey = null;

function getDayDetailsData(dateKey) {
  if (!dateKey || typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const rawDone = getDone(dateKey) || [];
  const doneIds = [...new Set(rawDone)];

  const completedHabits = [];
  doneIds.forEach(id => {
    const existing = S.habits.find(h => h.id === id);
    if (existing) {
      completedHabits.push(existing);
    } else {
      completedHabits.push({
        id,
        name: `Habit (${id})`,
        icon: '📌',
        color: '#8b8ba7',
        isDeleted: true
      });
    }
  });

  const allHistoryDatesWithDone = Object.keys(S.history || {})
    .filter(k => (getDone(k) || []).length > 0)
    .sort();
  const earliestDateWithDone = allHistoryDatesWithDone[0] || null;

  const isToday = (dateKey === todayKey());
  const isBeforeAnyTracking = earliestDateWithDone && (dateKey < earliestDateWithDone);

  const incompleteHabits = [];
  if (isToday || !isBeforeAnyTracking) {
    S.habits.forEach(h => {
      if (doneIds.includes(h.id)) return;

      if (h.id && h.id.startsWith('h_')) {
        const ts = parseInt(h.id.slice(2), 10);
        if (!isNaN(ts) && ts > 1500000000000) {
          const habitCreatedDate = new Date(ts);
          const habitCreatedKey = dkey(habitCreatedDate);
          if (dateKey < habitCreatedKey) {
            return;
          }
        }
      }

      incompleteHabits.push(h);
    });
  }

  const totalEligible = completedHabits.length + incompleteHabits.length;
  const pct = totalEligible > 0 ? Math.min(100, Math.round((completedHabits.length / totalEligible) * 100)) : 0;

  return {
    dateKey,
    completedHabits,
    incompleteHabits,
    totalEligible,
    pct,
    isToday,
    hasNoCompletions: completedHabits.length === 0
  };
}

function selectHeatmapDate(dateKey) {
  activeHeatmapDateKey = dateKey;

  const grid = document.getElementById('hmGrid');
  if (grid) {
    grid.querySelectorAll('.hm-cell').forEach(cell => {
      if (cell.dataset.date === dateKey) {
        cell.classList.add('selected');
        cell.setAttribute('aria-selected', 'true');
      } else {
        cell.classList.remove('selected');
        cell.removeAttribute('aria-selected');
      }
    });
  }

  renderHeatmapDayDetails(dateKey);

  const detailsEl = document.getElementById('hmDayDetails');
  if (detailsEl) {
    const rect = detailsEl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.bottom > vh || rect.top < 0) {
      detailsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function clearHeatmapSelection() {
  activeHeatmapDateKey = null;
  const grid = document.getElementById('hmGrid');
  if (grid) {
    grid.querySelectorAll('.hm-cell').forEach(cell => {
      cell.classList.remove('selected');
      cell.removeAttribute('aria-selected');
    });
  }
  const detailsEl = document.getElementById('hmDayDetails');
  if (detailsEl) {
    detailsEl.style.display = 'none';
    detailsEl.innerHTML = '';
  }
}

function renderHeatmapDayDetails(dateKey) {
  const detailsEl = document.getElementById('hmDayDetails');
  if (!detailsEl) return;

  const data = getDayDetailsData(dateKey);
  if (!data) {
    clearHeatmapSelection();
    return;
  }

  const [y, m, d] = dateKey.split('-').map(Number);
  const formattedDate = `${d} ${MONTHS[m - 1] || ''} ${y}`;
  const title = `📅 ${formattedDate}`;

  let completedHtml = '';
  if (data.completedHabits.length === 0) {
    completedHtml = '<div class="hm-day-empty-state">🌱 No habits completed on this day.</div>';
  } else {
    completedHtml = '<div class="hm-day-habit-list">' +
      data.completedHabits.map(h => {
        const canClick = !h.isDeleted && S.habits.some(x => x.id === h.id);
        return `
          <div class="hm-day-habit-item${canClick ? ' clickable' : ''}" data-id="${h.id}" title="${canClick ? 'View habit detail' : 'Deleted habit'}">
            <span class="hm-day-habit-ico">${h.icon}</span>
            <span class="hm-day-habit-name">${h.name}</span>
            ${canClick ? '<span class="hm-day-habit-tag">›</span>' : '<span class="hm-day-habit-tag">(deleted)</span>'}
          </div>
        `;
      }).join('') +
      '</div>';
  }

  let incompleteHtml = '';
  if (data.hasNoCompletions && data.incompleteHabits.length === 0) {
    incompleteHtml = '<div class="hm-day-empty-state">No incomplete habits recorded.</div>';
  } else if (data.incompleteHabits.length === 0 && data.completedHabits.length > 0) {
    incompleteHtml = '<div class="hm-day-all-done">🎉 All eligible habits completed!</div>';
  } else {
    incompleteHtml = '<div class="hm-day-habit-list">' +
      data.incompleteHabits.map(h => {
        const canClick = S.habits.some(x => x.id === h.id);
        return `
          <div class="hm-day-habit-item${canClick ? ' clickable' : ''}" data-id="${h.id}" title="View habit detail">
            <span class="hm-day-habit-ico">${h.icon}</span>
            <span class="hm-day-habit-name">${h.name}</span>
            <span class="hm-day-habit-tag">›</span>
          </div>
        `;
      }).join('') +
      '</div>';
  }

  detailsEl.innerHTML = `
    <div class="hm-day-header">
      <div class="hm-day-title">${title}</div>
      <button type="button" class="hm-day-clear" id="hmClearDayBtn" aria-label="Clear selection" title="Clear selection">✕ Clear</button>
    </div>

    <div class="hm-day-summary">
      <div class="hm-day-summary-left">
        <div class="hm-day-summary-lbl">Completion Summary</div>
        <div class="hm-day-summary-val">${data.completedHabits.length} / ${data.totalEligible} habits completed</div>
      </div>
      <div class="hm-day-summary-pct">${data.pct}% complete</div>
    </div>

    <div class="hm-day-lists">
      <div class="hm-day-sec">
        <div class="hm-day-sec-title done">✅ Completed (${data.completedHabits.length})</div>
        ${completedHtml}
      </div>
      <div class="hm-day-sec">
        <div class="hm-day-sec-title missed">⭕ Not Completed (${data.incompleteHabits.length})</div>
        ${incompleteHtml}
      </div>
    </div>
  `;

  detailsEl.style.display = 'block';

  const clearBtn = document.getElementById('hmClearDayBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearHeatmapSelection();
    });
  }

  detailsEl.querySelectorAll('.hm-day-habit-item.clickable').forEach(item => {
    item.addEventListener('click', () => {
      const hid = item.dataset.id;
      if (hid && typeof openHabitDetail === 'function') {
        openHabitDetail(hid);
      }
    });
  });
}

function renderHeatmap() {
  const grid = document.getElementById('hmGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const now = today(), startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 83);
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate() - 1);
  const cur = new Date(startDate);
  let weekEl = null;

  while (cur <= now) {
    if (cur.getDay() === 0) {
      weekEl = document.createElement('div');
      weekEl.className = 'hm-week';
      grid.appendChild(weekEl);
    }
    const k = dkey(cur);
    const isFuture = cur > now;
    const done = getDone(k);
    const pct = S.habits.length && !isFuture ? done.length / S.habits.length : 0;
    const lvl = isFuture ? 'future' : pct === 0 ? 'l0' : pct < 0.25 ? 'l1' : pct < 0.5 ? 'l2' : pct < 0.75 ? 'l3' : 'l4';
    
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'hm-cell ' + lvl;

    const [cy, cm, cd] = k.split('-').map(Number);
    const dateLabel = `${cd} ${MONTHS[cm - 1] || ''} ${cy}`;
    const pctInt = Math.round(pct * 100);

    if (isFuture) {
      cell.disabled = true;
      cell.setAttribute('aria-disabled', 'true');
      cell.title = 'Future date';
      cell.setAttribute('aria-label', 'Future date');
    } else {
      const accessibleLabel = `${dateLabel} — ${pctInt}% complete (${done.length} of ${S.habits.length} completed)`;
      cell.title = accessibleLabel;
      cell.setAttribute('aria-label', accessibleLabel);
      cell.dataset.date = k;

      if (activeHeatmapDateKey === k) {
        cell.classList.add('selected');
        cell.setAttribute('aria-selected', 'true');
      }

      cell.addEventListener('click', () => {
        selectHeatmapDate(k);
      });
    }

    weekEl.appendChild(cell);
    cur.setDate(cur.getDate() + 1);
  }

  if (activeHeatmapDateKey) {
    renderHeatmapDayDetails(activeHeatmapDateKey);
  }
}

window.selectHeatmapDate = selectHeatmapDate;
window.clearHeatmapSelection = clearHeatmapSelection;

function renderPieChart() {
  const canvas=document.getElementById('pieCanvas'),ctx=canvas.getContext('2d');
  canvas.width=100; canvas.height=100; ctx.clearRect(0,0,100,100);
  if (!S.habits.length) { ctx.fillStyle='#3a3a52'; ctx.beginPath(); ctx.arc(50,50,40,0,Math.PI*2); ctx.fill(); document.getElementById('pieLegend').innerHTML='<div style="color:var(--muted);font-size:11px">Koi data nahi</div>'; return; }
  const ht=S.habits.map(h=>{let cnt=0; Object.keys(S.history).forEach(k=>{if(getDone(k).includes(h.id)) cnt++;}); return{h,cnt};}).filter(x=>x.cnt>0);
  const total=ht.reduce((a,b)=>a+b.cnt,0);
  if (!total) { ctx.fillStyle='#3a3a52'; ctx.beginPath(); ctx.arc(50,50,40,0,Math.PI*2); ctx.fill(); document.getElementById('pieLegend').innerHTML='<div style="color:var(--muted);font-size:11px">Start karo!</div>'; return; }
  let sa=-Math.PI/2;
  ht.forEach(({h,cnt})=>{ const slice=cnt/total*Math.PI*2; ctx.beginPath(); ctx.moveTo(50,50); ctx.arc(50,50,42,sa,sa+slice); ctx.fillStyle=h.color; ctx.fill(); sa+=slice; });
  ctx.beginPath(); ctx.arc(50,50,24,0,Math.PI*2); ctx.fillStyle='#0f0f14'; ctx.fill();
  const leg=document.getElementById('pieLegend'); leg.innerHTML='';
  ht.slice(0,5).forEach(({h,cnt})=>{ const pct=Math.round(cnt/total*100); const row=document.createElement('div'); row.className='pie-leg-row'; row.innerHTML=`<div class="pie-leg-dot" style="background:${h.color}"></div><div class="pie-leg-name">${h.icon} ${h.name}</div><div class="pie-leg-pct">${pct}%</div>`; leg.appendChild(row); });
}

function renderTopHabits() {
  const wrap=document.getElementById('topHabitsChart'); wrap.innerHTML='';
  if (!S.habits.length) { wrap.innerHTML='<div style="color:var(--muted);font-size:11px">Koi habit nahi</div>'; return; }
  const ht=S.habits.map(h=>{let cnt=0; Object.keys(S.history).forEach(k=>{if(getDone(k).includes(h.id)) cnt++;}); return{h,cnt};}).sort((a,b)=>b.cnt-a.cnt);
  const maxCnt=ht[0]?.cnt||1;
  ht.forEach(({h,cnt})=>{ const pct=maxCnt?Math.round(cnt/maxCnt*100):0; const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px'; row.innerHTML=`<span style="font-size:14px;flex-shrink:0">${h.icon}</span><div style="flex:1"><div style="font-size:11px;font-weight:600;margin-bottom:3px">${h.name}</div><div style="height:5px;background:var(--s3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${h.color};border-radius:3px;transition:width .5s"></div></div></div><span style="font-size:11px;color:var(--muted);min-width:28px;text-align:right">${cnt}x</span>`; wrap.appendChild(row); });
}

function renderLineChart() {
  const canvas=document.getElementById('lineCanvas'),ctx=canvas.getContext('2d');
  const W=canvas.offsetWidth||400,H=120; canvas.width=W; canvas.height=H; ctx.clearRect(0,0,W,H);
  const points=[];
  for (let i=29;i>=0;i--) { const d=new Date(today()); d.setDate(d.getDate()-i); const done=getDone(dkey(d)); points.push(S.habits.length?done.length/S.habits.length:0); }
  const pad=10,chartH=H-pad*2,stepX=(W-pad*2)/(points.length-1);
  ctx.strokeStyle='#252535'; ctx.lineWidth=1;
  [0,.25,.5,.75,1].forEach(v=>{const y=pad+chartH-v*chartH; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke();});
  const grad=ctx.createLinearGradient(0,pad,0,H); grad.addColorStop(0,'#7c5af540'); grad.addColorStop(1,'#7c5af500');
  ctx.beginPath(); ctx.moveTo(pad,pad+chartH);
  points.forEach((v,i)=>{const x=pad+i*stepX,y=pad+chartH-v*chartH; i===0?ctx.lineTo(x,y):ctx.lineTo(x,y);});
  ctx.lineTo(pad+(points.length-1)*stepX,pad+chartH); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); ctx.strokeStyle='#7c5af5'; ctx.lineWidth=2; ctx.lineJoin='round';
  points.forEach((v,i)=>{const x=pad+i*stepX,y=pad+chartH-v*chartH; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}); ctx.stroke();
  points.forEach((v,i)=>{if(i%5===0||i===points.length-1){const x=pad+i*stepX,y=pad+chartH-v*chartH; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle='#a78bfa'; ctx.fill();}});
}

// ===================== MANAGE =====================
function renderManage() {
  const list=document.getElementById('mngList'); list.innerHTML='';
  if (!S.habits.length) { list.innerHTML='<div style="color:var(--muted);font-size:13px;text-align:center;padding:2rem">Abhi koi habit nahi. Niche se add karo!</div>'; return; }
  S.habits.forEach(h => {
    const subCount=getSubItems(h.id).length;
    const isJustAdded = (h.id === lastAddedHabitId);
    const row=document.createElement('div'); row.className='mng-row' + (isJustAdded ? ' just-added' : '');
    row.innerHTML=`
      <div class="mng-ico" style="background:${h.color}20;cursor:pointer" title="View details">${h.icon}</div>
      <div style="flex:1;cursor:pointer" class="mng-info-wrap"><div class="mng-name">${h.name}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${h.sub||'No description'}${subCount>0?` · <span style="color:${h.color}">${subCount} items</span>`:''}</div></div>
      <div class="mng-actions">
        <button class="mng-edit mng-stat-btn" data-id="${h.id}" style="color:var(--pur2)">📊 Stats</button>
        <button class="mng-edit mng-edit-btn" data-id="${h.id}">✏️ Edit</button>
        <button class="mng-edit mng-sub-btn" data-id="${h.id}" style="color:var(--blu)">📋 Items</button>
        <button class="mng-del mng-del-btn" data-id="${h.id}">🗑</button>
      </div>`;
    row.querySelector('.mng-stat-btn').addEventListener('click', () => openHabitDetail(h.id));
    row.querySelector('.mng-ico').addEventListener('click', () => openHabitDetail(h.id));
    row.querySelector('.mng-info-wrap').addEventListener('click', () => openHabitDetail(h.id));
    row.querySelector('.mng-del-btn').addEventListener('click', () => deleteHabit(h.id));
    row.querySelector('.mng-edit-btn').addEventListener('click', () => openEditModal(h.id));
    row.querySelector('.mng-sub-btn').addEventListener('click', () => openSubTracker(h.id));
    list.appendChild(row);
  });
}

function deleteHabit(id) {
  if (!confirm('Yeh habit delete karna chahte ho?')) return;
  S.habits = S.habits.filter(h => h.id !== id);
  if (activeDetailHabitId === id) {
    closeHabitDetail();
  }
  saveToFirebase(); renderManage(); renderToday();
  toast('Habit delete ho gayi 🗑');
}

// ===================== HABIT MODAL =====================
let selEmoji=EMOJIS[0], selColor=COLORS[0], editingId=null;

function openModal() {
  editingId=null; selEmoji=EMOJIS[0]; selColor=COLORS[0];
  document.getElementById('mName').value=''; document.getElementById('mSub').value='';
  document.getElementById('modalTitle').textContent='Nai Habit ✨';
  document.getElementById('saveHabitBtn').textContent='Save Habit ✓';
  buildModalPickers(); document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('mName').focus(),100);
}

function openEditModal(id) {
  editingId=id;
  const h=S.habits.find(x=>x.id===id); if (!h) return;
  selEmoji=h.icon; selColor=h.color;
  document.getElementById('mName').value=h.name; document.getElementById('mSub').value=h.sub||'';
  document.getElementById('modalTitle').textContent='Edit Habit ✏️';
  document.getElementById('saveHabitBtn').textContent='Update ✓';
  buildModalPickers(); document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('mName').focus(),100);
}

function buildModalPickers() {
  const ep=document.getElementById('emojiPick'); ep.innerHTML='';
  EMOJIS.forEach(e=>{const d=document.createElement('div'); d.className='e-opt'+(e===selEmoji?' sel':''); d.textContent=e; d.addEventListener('click',()=>{selEmoji=e; ep.querySelectorAll('.e-opt').forEach(x=>x.classList.remove('sel')); d.classList.add('sel');}); ep.appendChild(d);});
  const cp=document.getElementById('colorPick'); cp.innerHTML='';
  COLORS.forEach(c=>{const d=document.createElement('div'); d.className='c-opt'+(c===selColor?' sel':''); d.style.background=c; d.addEventListener('click',()=>{selColor=c; cp.querySelectorAll('.c-opt').forEach(x=>x.classList.remove('sel')); d.classList.add('sel');}); cp.appendChild(d);});
}

function closeModal() { document.getElementById('overlay').classList.remove('open'); }

function createAndSaveHabit(name, sub = '', icon = null, color = null) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    toast('Naam toh dalo bhai! 🙏');
    return false;
  }

  const id = 'h_' + Date.now();
  lastAddedHabitId = id;

  const habitIcon = icon || EMOJIS[S.habits.length % EMOJIS.length] || '🎯';
  const habitColor = color || COLORS[S.habits.length % COLORS.length] || '#7c5af5';

  S.habits.push({
    id,
    name: trimmedName.slice(0, 60),
    sub: (sub || '').trim(),
    icon: habitIcon,
    color: habitColor
  });

  saveToFirebase();
  renderToday();
  renderManage();

  setTimeout(() => {
    if (lastAddedHabitId === id) lastAddedHabitId = null;
  }, 500);

  toast('Nai habit add ho gayi! 🎯');
  return true;
}

function saveHabit() {
  const name=document.getElementById('mName').value.trim();
  if (!name) { toast('Naam toh dalo bhai! 🙏'); return; }
  if (editingId) {
    const h=S.habits.find(x=>x.id===editingId);
    if (h) { h.name=name.slice(0, 60); h.sub=document.getElementById('mSub').value.trim(); h.icon=selEmoji; h.color=selColor; }
    saveToFirebase(); closeModal(); renderToday(); renderManage();
    toast('Habit update ho gayi! ✏️');
  } else {
    closeModal();
    createAndSaveHabit(name, document.getElementById('mSub').value, selEmoji, selColor);
  }
}

// ===================== QUICK ADD HABIT =====================
function isQuickAddOpen() {
  const box = document.getElementById('quickAddBox');
  return box && box.style.display !== 'none';
}

function openQuickAdd() {
  const box = document.getElementById('quickAddBox');
  const btn = document.getElementById('quickAddToggleBtn');
  const input = document.getElementById('quickAddInput');
  if (!box) return;

  box.style.display = 'block';
  if (btn) {
    btn.setAttribute('aria-expanded', 'true');
    btn.style.display = 'none';
  }
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 60);
  }
}

function closeQuickAdd() {
  const box = document.getElementById('quickAddBox');
  const btn = document.getElementById('quickAddToggleBtn');
  const input = document.getElementById('quickAddInput');
  if (!box) return;

  box.style.display = 'none';
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.style.display = 'inline-flex';
  }
  if (input) {
    input.value = '';
  }
}

let isSubmittingQuickAdd = false;

function submitQuickAdd() {
  if (isSubmittingQuickAdd) return;
  const input = document.getElementById('quickAddInput');
  if (!input) return;

  const name = input.value.trim();
  if (!name) {
    toast('Naam toh dalo bhai! 🙏');
    input.focus();
    return;
  }

  isSubmittingQuickAdd = true;
  try {
    const success = createAndSaveHabit(name);
    if (success) {
      input.value = '';
      closeQuickAdd();
    }
  } finally {
    isSubmittingQuickAdd = false;
  }
}

if (typeof window !== 'undefined') {
  window.openQuickAdd = openQuickAdd;
  window.closeQuickAdd = closeQuickAdd;
  window.submitQuickAdd = submitQuickAdd;
  window.createAndSaveHabit = createAndSaveHabit;
}

// ===================== NAV =====================
function showPage(pg) {
  document.querySelectorAll('.pg').forEach(el=>el.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(el=>el.classList.remove('on'));
  document.getElementById('pg-'+pg).classList.add('on');
  document.querySelector(`[data-pg="${pg}"]`).classList.add('on');
  if (pg !== 'today') closeQuickAdd();
  if (pg==='weekly') renderWeekly();
  if (pg==='monthly') renderMonthly();
  if (pg==='manage') renderManage();
  if (pg==='stats') renderStats();
}

function initGreeting() {
  const h=today().getHours();
  document.getElementById('greeting').textContent=h<12?'Good Morning bhai ☀️':h<17?'Good Afternoon bhai 🌤️':'Good Evening bhai 🌙';
  document.getElementById('heroDate').textContent=today().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('heroQuote').textContent=QUOTES[today().getDay()%QUOTES.length];
}

// ===================== AUTH UI =====================
function showApp(user) {
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('loadingScreen').style.display='none';
  document.getElementById('appRoot').style.display='block';
  const btn=document.getElementById('userBtn');
  if (user.photoURL) { btn.style.cssText=`background:url(${user.photoURL}) center/cover;border-radius:50%;width:32px;height:32px;border:2px solid var(--pur);`; btn.textContent=''; }
  else btn.textContent = user.displayName?user.displayName[0].toUpperCase():'👤';
  document.getElementById('umProfile').innerHTML=`<img src="${user.photoURL||''}" style="width:36px;height:36px;border-radius:50%;margin-right:10px;vertical-align:middle" onerror="this.style.display='none'"/><strong>${user.displayName||'Grinder'}</strong><br/><span style="font-size:11px;color:var(--muted)">${user.email}</span>`;
  initGreeting();
  renderToday();
}

function showLogin() {
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loadingScreen').style.display='none';
  document.getElementById('appRoot').style.display='none';
}

document.getElementById('userBtn').addEventListener('click', () => {
  const menu=document.getElementById('userMenu');
  menu.style.display=menu.style.display==='none'?'block':'none';
});
document.addEventListener('click', e => {
  if (!e.target.closest('#userBtn')&&!e.target.closest('#userMenu')) document.getElementById('userMenu').style.display='none';
});

document.getElementById('signOutBtn').addEventListener('click', async () => {
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  clearTimeout(saveTimeout);
  localStorage.removeItem('pt_active_guest');
  resetState();
  if (auth) {
    try { await signOut(auth); } catch(e) {}
  }
  currentUser=null;
  showLogin();
});

function loginAsGuest() {
  const guestUser = {
    uid: 'guest_user',
    displayName: 'Guest Grinder',
    email: 'guest@progress-tracker.local',
    photoURL: '',
    isGuest: true
  };
  currentUser = guestUser;
  localStorage.setItem('pt_active_guest', 'true');
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('loadingScreen').style.display='flex';
  loadFromFirebase().then(() => {
    showApp(guestUser);
  });
}

document.getElementById('guestSignInBtn')?.addEventListener('click', () => {
  loginAsGuest();
});

document.getElementById('googleSignInBtn').addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch(e) {
    console.warn('Google sign-in error:', e);
    toast('Google sign-in blocked or unavailable. Continuing as Guest...');
    setTimeout(() => {
      loginAsGuest();
    }, 800);
  }
});

// ===================== AUTH STATE =====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    localStorage.removeItem('pt_active_guest');
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('loadingScreen').style.display='flex';
    await loadFromFirebase();
    subscribeToChanges();
    showApp(user);
  } else {
    if (localStorage.getItem('pt_active_guest') === 'true') {
      loginAsGuest();
      return;
    }
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    clearTimeout(saveTimeout);
    resetState();
    currentUser = null;
    showLogin();
  }
});

// ===================== EVENT LISTENERS =====================
document.getElementById('tabBar').addEventListener('click', e=>{const btn=e.target.closest('.tab'); if(btn) showPage(btn.dataset.pg);});
document.getElementById('openModalBtn').addEventListener('click', openModal);
document.getElementById('openModalBtn2').addEventListener('click', openModal);
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('saveHabitBtn').addEventListener('click', saveHabit);
document.getElementById('overlay').addEventListener('click', e=>{if(e.target===document.getElementById('overlay')) closeModal();});
document.getElementById('wkPrev').addEventListener('click', ()=>{wkOffset--; renderWeekly();});
document.getElementById('wkNext').addEventListener('click', ()=>{wkOffset++; renderWeekly();});
document.getElementById('moPrev').addEventListener('click', ()=>{moOffset--; renderMonthly();});
document.getElementById('moNext').addEventListener('click', ()=>{moOffset++; renderMonthly();});
document.getElementById('mName').addEventListener('keydown', e=>{if(e.key==='Enter') saveHabit();});
document.getElementById('subBack').addEventListener('click', closeSubTracker);
document.getElementById('habitDetailBack').addEventListener('click', closeHabitDetail);
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (isQuickAddOpen()) {
      closeQuickAdd();
    } else if (activeDetailHabitId) {
      closeHabitDetail();
    } else if (activeHeatmapDateKey) {
      clearHeatmapSelection();
    }
  }
});
document.getElementById('quickAddToggleBtn')?.addEventListener('click', openQuickAdd);
document.getElementById('quickAddCancelBtn')?.addEventListener('click', closeQuickAdd);
document.getElementById('quickAddForm')?.addEventListener('submit', e => {
  e.preventDefault();
  submitQuickAdd();
});
document.getElementById('quickAddInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitQuickAdd();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeQuickAdd();
  }
});
document.getElementById('closeSubItemBtn').addEventListener('click', closeSubItemModal);
document.getElementById('saveSubItemBtn').addEventListener('click', saveSubItem);
document.getElementById('subItemOverlay').addEventListener('click', e=>{if(e.target===document.getElementById('subItemOverlay')) closeSubItemModal();});
document.getElementById('siName').addEventListener('keydown', e=>{if(e.key==='Enter') saveSubItem();});

// ===================== PWA SERVICE WORKER =====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}