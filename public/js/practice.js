import { D, ORDER, ROWS, label, ex } from './data.js';
import { Target, timeToSpeed, makeResult, validateResult, baseOf, buildKeyStats, guidedKeys, learningRate, dailyMinutes, pickLesson } from './core/model.js';
import { lineChart } from './charts.js';
import { load, save } from './store.js';

const $ = (id) => document.getElementById(id);
const ST = load(), SET = ST.settings, LESSON = 20;
const FIXED = { r1: ROWS[0], r2: ROWS[1], r3: ROWS[2], all: ROWS.join('') };
const MIN = (() => { for (let n = 2; n <= ORDER.length; n++) { const s = new Set(ORDER.slice(0, n)); if (D.filter((x) => [...x.k].every((c) => s.has(c))).length >= 8) return n; } return ORDER.length; })();
const fm = (n, d = 0) => n.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });

let results = ST.results.map(makeResult), stats, lk, pool, focus = null, sel = '';
let L, cur, typed = '', wrong = false, bad = 0, wc = '', busy = false, itemT0 = 0, lastT = 0, timer = 0;
const sess = { n: 0, ok: 0, streak: 0, recent: [] };
const tgt = () => new Target(SET.target);
const conf = (k) => tgt().confidence(stats.get(k)?.timeToType);
const hue = (c) => (c == null ? 0 : Math.round(Math.min(c, 1) * 120));

$('kb').innerHTML = ROWS.map((r) => `<div class="kr">${[...r].map((k) => `<div class="k" data-k="${k}"><b>${k}</b><s>${ex(k)}</s><i>${label(k)}</i></div>`).join('')}</div>`).join('');
const KEL = Object.fromEntries([...document.querySelectorAll('.k')].map((e) => [e.dataset.k, e]));

/** 由历史结果重算统计，并决定本轮开放哪些键、重点练哪个键。 */
function refresh() {
  stats = buildKeyStats(ORDER, results);
  if (SET.mode === 'guided') lk = guidedKeys(ORDER, stats, tgt(), { minSize: MIN });
  else {
    const set = new Set(FIXED[SET.mode]), t = tgt();
    const ks = ORDER.map((l) => ({ letter: l, confidence: t.confidence(stats.get(l).timeToType), included: set.has(l) }));
    const w = ks.filter((k) => k.included && (k.confidence ?? 0) < 1).sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0))[0];
    lk = { keys: ks, included: set, focus: w?.letter ?? null };
  }
  focus = lk.focus;
  pool = D.filter((x) => [...x.k].every((c) => lk.included.has(c)));
}
function newLesson() { L = { items: pickLesson(pool, focus, LESSON), idx: 0, hist: {}, errors: 0, ms: 0, log: [] }; showItem(); }
function showItem() {
  cur = L.items[L.idx]; typed = ''; wrong = false; busy = false; itemT0 = lastT = performance.now();
  $('slots').className = 'slots'; render();
}
function endLesson() {
  const hist = {};
  for (const [k, h] of Object.entries(L.hist)) hist[k] = [h.hit, h.miss, h.hit ? h.sum / h.hit : 0];
  const r = makeResult({ t: Date.now(), len: LESSON * 2, time: L.ms, errors: L.errors, hist });
  if (validateResult(r)) { results.push(r); results = results.slice(-1000); save({ settings: SET, results: results.map(baseOf) }); }
  refresh(); newLesson();
}
function finishItem(ok) {
  const ms = performance.now() - itemT0;
  L.ms += Math.min(ms, 6000); L.log.push(ok); sess.n++; sess.recent.push(ms); if (sess.recent.length > 10) sess.recent.shift();
  if (ok) { sess.ok++; sess.streak++; } else sess.streak = 0;
  busy = true; render();
  timer = setTimeout(() => { L.idx++; L.idx >= LESSON ? endLesson() : showItem(); }, 260);
}
const flash = (c, cl) => { const el = KEL[c]; if (!el) return; el.classList.add(cl); setTimeout(() => el.classList.remove(cl), cl === 'err' ? 240 : 110); };

function onKey(c) {
  if (busy) return;
  const exp = cur.k[typed.length];
  if (wrong && c !== exp) { // 答错后锁定：只认正确答案的下一个键
    flash(c, 'err'); const sl = $('slots'); sl.classList.remove('shk'); void sl.offsetWidth; sl.classList.add('shk'); return;
  }
  flash(c, c === exp ? 'press' : 'err');
  if (!wrong) { // 只统计首次作答；纠正时不再计入
    const now = performance.now(), h = (L.hist[exp] ??= { hit: 0, miss: 0, sum: 0 });
    if (c === exp) { h.hit++; h.sum += Math.min(now - lastT, 5000); } else { h.miss++; L.errors++; }
    lastT = now;
    if (c !== exp) { wrong = true; bad = typed.length; wc = c; render(); return; }
  }
  typed += c; render();
  if (typed === cur.k) { if (!wrong) $('slots').className = 'slots ok'; finishItem(!wrong); }
}

function render() {
  const s = $('slots').children, show = wrong || SET.hint, t = tgt();
  $('ch').textContent = cur.c; $('py').textContent = SET.py ? cur.p : '';
  for (let i = 0; i < 2; i++) {
    s[i].textContent = typed[i] || (wrong && i === bad ? wc : '');
    s[i].classList.toggle('cur', i === typed.length && !busy);
    s[i].classList.toggle('bad', wrong && i === bad && !typed[i]);
  }
  $('msg').className = 'msg' + (wrong ? ' bad' : '');
  $('msg').innerHTML = show ? [...cur.k].map((c, i) => `<b class="${i < typed.length ? 'e' : ''}">${c}</b>`).join('') : '';
  for (const k in KEL) {
    const n = show ? [...cur.k].flatMap((c, i) => (c === k ? [i + 1] : [])).join('·') : '', c = conf(k), el = KEL[k];
    el.classList.toggle('hl', !!n); el.dataset.n = n; el.classList.toggle('off', !lk.included.has(k)); el.classList.toggle('sel', sel === k);
    el.style.setProperty('--bar', c == null ? 0 : 1); el.style.setProperty('--h', hue(c));
  }
  $('strip').innerHTML = ORDER.map((k) => { const c = conf(k); return `<button data-k="${k}" class="${lk.included.has(k) ? '' : 'lock'} ${c == null ? 'n' : ''} ${sel === k ? 'sel' : ''} ${focus === k ? 'foc' : ''}" style="--h:${hue(c)}">${k}</button>`; }).join('');
  const past = L.items.slice(Math.max(0, L.idx - 4), L.idx).map((x, i, a) => `<span class="${L.log[L.idx - a.length + i] ? 'd1' : 'd3'}">${x.c}</span>`).join('');
  $('flow').innerHTML = past + `<span class="cur">${cur.c}</span>` + L.items.slice(L.idx + 1, L.idx + 6).map((x) => `<span>${x.c}</span>`).join('');
  // 统计卡片
  const rc = sess.recent;
  $('sV').textContent = rc.length > 2 ? Math.round(60000 / (rc.reduce((a, b) => a + b, 0) / rc.length)) : '—';
  $('sT').textContent = sess.n; $('sA').textContent = sess.n ? Math.round((sess.ok / sess.n) * 100) + '%' : '—'; $('sS').textContent = sess.streak;
  // 上一课与再上一课对比（keybr 风格）
  const [P, Lr] = results.slice(-2).length === 2 ? results.slice(-2) : [null, results.at(-1)];
  const dl = (a, b, d, u = '') => (!P ? '' : ` <em class="${a >= b ? 'up' : 'dn'}">${a >= b ? '↑+' : '↓−'}${fm(Math.abs(a - b), d)}${u}</em>`);
  const prog = `<span class="m">本课 ${L.idx}/${LESSON}</span>`;
  $('metrics').innerHTML = Lr ? `速度 <b>${fm(Lr.speed, 1)}</b> 击键/分${dl(Lr.speed, P?.speed, 1)} 　正确率 <b>${fm(Lr.accuracy * 100, 1)}%</b>${dl(Lr.accuracy * 100, P?.accuracy * 100, 1, '%')} 　积分 <b>${fm(Lr.score)}</b>${dl(Lr.score, P?.score, 0)} 　${prog}`
    : `每 ${LESSON} 题为一课，完成后显示速度、正确率、积分和与上一课的对比 　${prog}`;
  const mins = dailyMinutes(results), pct = Math.min(100, (mins / SET.goal) * 100);
  $('goalT').textContent = `今日目标 ${Math.floor(mins)}/${SET.goal} 分钟${pct >= 100 ? ' ✓ 已完成' : ''} · 累计积分 ${fm(results.reduce((a, r) => a + r.score, 0))}`;
  $('goalB').style.width = pct + '%';
  // 信息行：引导模式给出焦点键和预计课数
  const lr = focus ? learningRate(stats.get(focus).samples, t) : null;
  const eta = lr ? (Number.isFinite(lr.remainingLessons) ? `，按趋势预计还需约 ${lr.remainingLessons} 课达标` : '，趋势暂不明确') : '';
  $('info').textContent = SET.mode === 'guided'
    ? `当前重点键 ${focus ? focus.toUpperCase() : '—'}${eta} · 已解锁 ${lk.included.size}/${ORDER.length} · 所有已解锁键都达到目标（置信度 ≥ 100%）才解锁下一个`
    : `固定范围练习；重点键 ${focus ? focus.toUpperCase() : '—'}。选「引导」可按熟练度逐步开放按键`;
  // 曲线：选中键看该键的速度，否则看每课速度
  const st = sel && stats.get(sel);
  $('chartT').textContent = sel ? `${sel.toUpperCase()} 键速度曲线（击键/分，虚线为目标）· 再点一次取消` : '每课速度曲线（击键/分，虚线为目标）· 点击键盘或字母条看单个键';
  lineChart($('chart'), sel ? (st?.samples ?? []).map((x) => timeToSpeed(x.filteredTimeToType)) : results.map((r) => r.speed), { ref: SET.target, fmt: (v) => fm(v), empty: '数据不足：至少完成 2 课' });
}

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.id === 'cap' || e.target.id === 'tgt') return;
  if (e.code === 'Backspace') return;
  if (/^Key[A-Z]$/.test(e.code)) { e.preventDefault(); onKey(e.code[3].toLowerCase()); }
});
$('stage').addEventListener('click', () => { if (matchMedia('(pointer:coarse)').matches) $('cap').focus(); });
$('cap').addEventListener('input', (e) => { for (const ch of e.target.value.toLowerCase()) if (/[a-z]/.test(ch)) onKey(ch); e.target.value = ''; });
const selKey = (k) => { sel = sel === k ? '' : k; render(); };
$('kb').onclick = (e) => { const k = e.target.closest('.k'); if (k) selKey(k.dataset.k); };
$('strip').onclick = (e) => { const b = e.target.closest('button'); if (b) selKey(b.dataset.k); };
const persist = () => save({ settings: SET, results: results.map(baseOf) });
$('seg').onclick = (e) => {
  const b = e.target.closest('button'); if (!b) return;
  SET.mode = b.dataset.m; persist(); clearTimeout(timer); syncSeg(); refresh(); newLesson();
};
const syncSeg = () => document.querySelectorAll('#seg button').forEach((b) => b.classList.toggle('on', b.dataset.m === SET.mode));
$('oPy').onchange = (e) => { SET.py = e.target.checked; persist(); render(); };
$('oHint').onchange = (e) => { SET.hint = e.target.checked; persist(); render(); };
$('tgt').onchange = (e) => { SET.target = Math.max(75, Math.min(750, +e.target.value || 100)); e.target.value = SET.target; e.target.blur(); persist(); refresh(); render(); };
$('reset').onclick = () => { if (!confirm('清除所有练习记录？不可恢复。')) return; results = []; persist(); clearTimeout(timer); refresh(); newLesson(); };

$('oPy').checked = SET.py; $('oHint').checked = SET.hint; $('tgt').value = SET.target; syncSeg();
refresh(); newLesson();
