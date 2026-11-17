import { QUESTIONS } from './questions.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEY = 'olamdev_ana203_v1';
const LETTERS = ['A', 'B', 'C', 'D'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- storage ---------- */
let store = { attempts: 0, best: 0, totalPct: 0, history: [], settings: {} };
try { Object.assign(store, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
store.settings = Object.assign({ theme: 'light', feedback: 'instant', timePerQ: 0, pass: 50 }, store.settings);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

/* ---------- helpers ---------- */
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
const topics = () => {
  const m = new Map();
  QUESTIONS.forEach(q => m.set(q.topic, (m.get(q.topic) || 0) + 1));
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
};

/* ---------- navigation ---------- */
const TITLES = { home: 'olamdev_ana203', setup: 'Start Quiz', topics: 'Topics', quiz: 'Quiz', result: 'Result', progress: 'Progress', settings: 'Settings' };
let current = 'home';
function go(name) {
  if (name === 'topics') renderTopics();
  if (name === 'progress') renderProgress();
  if (name === 'settings') renderSettings();
  if (name === 'setup') renderSetup();
  $$('.screen').forEach(s => (s.hidden = s.id !== 's-' + name));
  $('#btnBack').hidden = name === 'home';
  $('#title').textContent = TITLES[name];
  current = name;
  window.scrollTo(0, 0);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (b) go(b.dataset.go);
});
$('#btnBack').onclick = () => {
  if (current === 'quiz') return quitQuiz();
  go(current === 'result' ? 'home' : 'home');
};

/* ---------- theme ---------- */
const applyTheme = () => {
  document.documentElement.dataset.theme = store.settings.theme;
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.content = store.settings.theme === 'dark' ? '#0e1517' : '#0f766e';
};

/* ---------- setup ---------- */
let sel = { topic: 'All', count: 20 };
function renderSetup() {
  const t = $('#selTopic');
  t.innerHTML = `<option value="All">All topics (${QUESTIONS.length})</option>` +
    topics().map(([n, c]) => `<option value="${esc(n)}">${esc(n)} (${c})</option>`).join('');
  t.value = sel.topic;
  t.onchange = () => { sel.topic = t.value; renderChips(); };
  renderChips();
}
const pool = () => (sel.topic === 'All' ? QUESTIONS : QUESTIONS.filter(q => q.topic === sel.topic));
function renderChips() {
  const n = pool().length;
  const opts = [20, 50, 100, 'All'];
  if (sel.count !== 'All' && sel.count > n) sel.count = n < 20 ? 'All' : 20;
  $('#countChips').innerHTML = opts.map(o =>
    `<button class="chip ${o === sel.count ? 'on' : ''}" data-c="${o}">${o}</button>`).join('');
  $$('#countChips .chip').forEach(b => b.onclick = () => {
    sel.count = b.dataset.c === 'All' ? 'All' : +b.dataset.c;
    renderChips();
  });
  const actual = sel.count === 'All' ? n : Math.min(sel.count, n);
  $('#setupHint').textContent = `${actual} question${actual === 1 ? '' : 's'} will be shuffled` +
    (n < (sel.count === 'All' ? 0 : sel.count) ? ` (only ${n} available in this topic)` : '') + '.';
}
$('#btnBegin').onclick = () => startQuiz();

/* ---------- topics ---------- */
function renderTopics() {
  $('#topicList').innerHTML = topics().map(([n, c], i) =>
    `<button class="topic" data-i="${i}">${esc(n)}<span>${c}</span></button>`).join('');
  const list = topics();
  $$('#topicList .topic').forEach(b => b.onclick = () => { sel.topic = list[+b.dataset.i][0]; go('setup'); });
}

/* ---------- quiz ---------- */
let quiz = null;
function startQuiz() {
  const p = shuffle(pool());
  const n = sel.count === 'All' ? p.length : Math.min(sel.count, p.length);
  const qs = p.slice(0, n).map(q => {
    const o = shuffle(q.options.map((t, k) => ({ t, c: k === q.answer })));
    return { q: q.q, topic: q.topic, explanation: q.explanation, options: o.map(x => x.t), answer: o.findIndex(x => x.c) };
  });
  const per = store.settings.timePerQ;
  quiz = { qs, ans: new Array(n).fill(null), i: 0, sec: 0, limit: per ? per * n : 0, topic: sel.topic, done: false };
  clearInterval(quiz.tid);
  quiz.tid = setInterval(tick, 1000);
  go('quiz');
  renderQ();
  $('#palette').hidden = true;
}
function tick() {
  if (!quiz || quiz.done) return;
  quiz.sec++;
  drawTimer();
  if (quiz.limit && quiz.sec >= quiz.limit) { alert("Time is up!"); finishQuiz(true); }
}
function drawTimer() {
  const el = $('#qTimer');
  if (quiz.limit) {
    const left = Math.max(0, quiz.limit - quiz.sec);
    el.textContent = '\u23F1 ' + fmt(left);
    el.classList.toggle('low', left <= 30);
  } else { el.textContent = '\u23F1 ' + fmt(quiz.sec); el.classList.remove('low'); }
}
const instant = () => store.settings.feedback === 'instant';
function renderQ() {
  const { qs, ans, i } = quiz, q = qs[i], a = ans[i];
  $('#qCount').textContent = `${i + 1}/${qs.length}`;
  $('#progFill').style.width = ((ans.filter(x => x !== null).length) / qs.length * 100) + '%';
  $('#qTopic').textContent = q.topic;
  $('#qText').textContent = q.q;
  const locked = instant() && a !== null;
  $('#opts').innerHTML = q.options.map((t, k) => {
    let cls = 'opt';
    if (locked) { if (k === q.answer) cls += ' ok'; else if (k === a) cls += ' no'; }
    else if (k === a) cls += ' sel';
    return `<button class="${cls}" data-k="${k}" ${locked ? 'disabled' : ''}><b>${LETTERS[k]}</b><span>${esc(t)}</span></button>`;
  }).join('');
  $$('#opts .opt').forEach(b => b.onclick = () => pick(+b.dataset.k));
  const fb = $('#fb');
  if (locked) {
    const ok = a === q.answer;
    fb.hidden = false;
    fb.className = 'fb ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `<strong class="${ok ? 'ok' : 'no'}">${ok ? '\u2714 Correct!' : '\u2716 Wrong.'}</strong> ` +
      (ok ? '' : `Correct answer: <b>${LETTERS[q.answer]}. ${esc(q.options[q.answer])}</b><br>`) + `<br>${esc(q.explanation)}`;
  } else fb.hidden = true;
  $('#btnPrev').disabled = i === 0;
  $('#btnNext').textContent = i === qs.length - 1 ? 'Finish \u2714' : 'Next \u2192';
  drawTimer();
  drawPalette();
}
function pick(k) {
  if (quiz.done) return;
  quiz.ans[quiz.i] = k;
  renderQ();
}
function drawPalette() {
  const { qs, ans, i } = quiz;
  $('#palette').innerHTML = qs.map((q, n) => {
    let c = '';
    if (ans[n] !== null) c = instant() ? (ans[n] === q.answer ? 'ok' : 'no') : 'ans';
    if (n === i) c += ' cur';
    return `<button class="${c}" data-n="${n}">${n + 1}</button>`;
  }).join('');
  $$('#palette button').forEach(b => b.onclick = () => { quiz.i = +b.dataset.n; renderQ(); });
}
$('#btnPalette').onclick = () => { const p = $('#palette'); p.hidden = !p.hidden; };
$('#btnPrev').onclick = () => { if (quiz.i > 0) { quiz.i--; renderQ(); } };
$('#btnNext').onclick = () => {
  if (quiz.i < quiz.qs.length - 1) { quiz.i++; renderQ(); return; }
  const un = quiz.ans.filter(x => x === null).length;
  if (un && !confirm(`${un} question${un > 1 ? 's are' : ' is'} unanswered. Finish anyway?`)) return;
  finishQuiz();
};
function quitQuiz() {
  if (confirm('Quit this quiz? Your answers will not be saved.')) { clearInterval(quiz.tid); quiz.done = true; go('home'); }
}
$('#btnQuit').onclick = quitQuiz;

/* ---------- result ---------- */
let filter = 'all';
function finishQuiz() {
  if (quiz.done) return;
  quiz.done = true;
  clearInterval(quiz.tid);
  const total = quiz.qs.length;
  const score = quiz.qs.filter((q, i) => quiz.ans[i] === q.answer).length;
  const pct = Math.round(score / total * 100);
  const pass = pct >= store.settings.pass;
  quiz.score = score; quiz.pct = pct; quiz.pass = pass;
  store.attempts++;
  store.totalPct += pct;
  store.best = Math.max(store.best, pct);
  store.history.unshift({ d: Date.now(), topic: quiz.topic, score, total, pct, pass, sec: quiz.sec });
  store.history = store.history.slice(0, 100);
  save();
  $('#resScore').textContent = `${score} / ${total}`;
  $('#resPct').textContent = pct + '%';
  const b = $('#resBadge');
  b.textContent = pass ? 'PASS' : 'FAIL';
  b.className = 'badge ' + (pass ? 'pass' : 'fail');
  $('#resMeta').textContent = `Pass mark ${store.settings.pass}% \u00B7 Time ${fmt(quiz.sec)} \u00B7 ${quiz.topic === 'All' ? 'All topics' : quiz.topic}`;
  filter = 'all';
  go('result');
  renderReview();
}
function renderReview() {
  $$('[data-filter]').forEach(b => b.classList.toggle('on', b.dataset.filter === filter));
  $('#review').innerHTML = quiz.qs.map((q, i) => {
    const a = quiz.ans[i], ok = a === q.answer;
    if (filter === 'wrong' && ok) return '';
    if (filter === 'right' && !ok) return '';
    return `<div class="rev ${ok ? 'ok' : 'no'}">
      <p class="q">${i + 1}. ${esc(q.q)}</p>
      <p class="your ${ok ? '' : 'no'}">Your answer: ${a === null ? '<i>Not answered</i>' : LETTERS[a] + '. ' + esc(q.options[a])}</p>
      ${ok ? '' : `<p class="corr">Correct: <b>${LETTERS[q.answer]}. ${esc(q.options[q.answer])}</b></p>`}
      <p class="ex">${esc(q.explanation)}</p></div>`;
  }).join('') || '<p class="hint">Nothing to show here.</p>';
}
$$('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; renderReview(); });

/* ---------- progress ---------- */
function renderProgress() {
  $('#stAttempts').textContent = store.attempts;
  $('#stBest').textContent = store.best + '%';
  $('#stAvg').textContent = (store.attempts ? Math.round(store.totalPct / store.attempts) : 0) + '%';
  $('#history').innerHTML = store.history.length ? store.history.map(h =>
    `<div class="hrow"><div><b>${esc(h.topic === 'All' ? 'All topics' : h.topic)}</b><small>${new Date(h.d).toLocaleString()} \u00B7 ${fmt(h.sec || 0)}</small></div>
     <div style="text-align:right"><b>${h.score}/${h.total}</b><small>${h.pct}% \u00B7 ${h.pass ? 'Pass' : 'Fail'}</small></div></div>`).join('')
    : '<p class="hint">No quizzes taken yet.</p>';
}
$('#btnReset').onclick = () => {
  if (!confirm('Delete all attempts, best score and history?')) return;
  store.attempts = 0; store.best = 0; store.totalPct = 0; store.history = [];
  save(); renderProgress();
};

/* ---------- settings ---------- */
function renderSettings() {
  const map = { setTheme: 'theme', setFeedback: 'feedback', setTime: 'timePerQ', setPass: 'pass' };
  Object.entries(map).forEach(([id, key]) => {
    $$('#' + id + ' .chip').forEach(b => {
      b.classList.toggle('on', String(store.settings[key]) === b.dataset.v);
      b.onclick = () => {
        const v = b.dataset.v;
        store.settings[key] = (key === 'timePerQ' || key === 'pass') ? +v : v;
        save(); applyTheme(); renderSettings();
      };
    });
  });
  $('#offlineMsg').textContent = ('serviceWorker' in navigator)
    ? 'Works offline after the first load. Your progress is stored on this device.'
    : 'Offline mode needs a browser with service worker support.';
}

/* ---------- PWA ---------- */
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#btnInstall').hidden = false; });
$('#btnInstall').onclick = async () => {
  if (!deferred) return;
  deferred.prompt(); await deferred.userChoice; deferred = null; $('#btnInstall').hidden = true;
};
window.addEventListener('appinstalled', () => { $('#btnInstall').hidden = true; });
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

/* ---------- init ---------- */
applyTheme();
$('#qTotal').textContent = QUESTIONS.length;
go('home');
