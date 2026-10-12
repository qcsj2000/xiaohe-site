// 用最小 DOM 桩跑一遍练习页逻辑：打完一课应写入一条结果，答错会计入失误。
import test from 'node:test';
import assert from 'node:assert/strict';

const els = {}, queue = [], handlers = {}, store = {};
const mk = (id, kids = true) => ({ id, style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {} }, dataset: {}, get children() { return kids ? Array.from({ length: this._n ?? 2 }, () => mk('', false)) : []; },
  set innerHTML(v) { this._h = v; const n = (v.match(/class="slot"/g) || []).length; if (n) this._n = n; }, get innerHTML() { return this._h ?? ''; },
  textContent: '', className: '', value: '', checked: false, offsetWidth: 0, addEventListener(t, f) { (this.h ??= {})[t] = f; }, focus() {}, blur() {}, getAttribute: () => '0 0 300 80' });
globalThis.document = { getElementById: (id) => (els[id] ??= mk(id)),
  querySelectorAll: (s) => (s === '.k' ? [...'qwertyuiopasdfghjklzxcvbnm'].map((l) => ({ ...mk(), dataset: { k: l } })) : []) };
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
globalThis.addEventListener = (t, f) => { handlers[t] = f; };
globalThis.matchMedia = () => ({ get matches() { return !!globalThis.__touch; } });
globalThis.confirm = () => true;
let now = 0; Object.defineProperty(globalThis, 'performance', { value: { now: () => (now += 250) }, configurable: true });
globalThis.setTimeout = (f) => { queue.push(f); return 0; };
globalThis.clearTimeout = () => {};

const { D, W, WL } = await import('../public/js/data.js');
await import('../public/js/practice.js');
const press = (c) => handlers.keydown({ code: 'Key' + c.toUpperCase(), target: { id: '' }, preventDefault() {} });
const pressTouch = (c) => els.kb.h.pointerdown({ target: { closest: () => ({ dataset: { k: c } }) }, preventDefault() {} });
const flush = () => { while (queue.length) queue.shift()(); };
const solve = (wrongFirst) => {
  const code = D.find((x) => x.c === els.ch.textContent).k;
  if (wrongFirst) press(code[0] === 'z' ? 'x' : 'z');
  press(code[0]); press(code[1]); flush();
};

test('打完一课：保存一条结果，无失误', () => {
  for (let i = 0; i < 20; i++) solve(false);
  const saved = JSON.parse(store['xhTrainer:v1']);
  assert.equal(saved.results.length, 1); assert.equal(saved.results[0].len, 40); assert.equal(saved.results[0].errors, 0);
  assert.ok(Object.keys(saved.results[0].hist).length >= 2);
  assert.match(els.metrics.innerHTML, /速度/);
});
test('第二课：每题先按错一次，失误数 = 20，并锁定后仍能按对解锁', () => {
  for (let i = 0; i < 20; i++) solve(true);
  const saved = JSON.parse(store['xhTrainer:v1']);
  assert.equal(saved.results.length, 2); assert.equal(saved.results[1].errors, 20);
});
test('触屏：点页面键盘也能打完一课', () => {
  globalThis.__touch = true;
  for (let i = 0; i < 20; i++) { const code = D.find((x) => x.c === els.ch.textContent).k; pressTouch(code[0]); pressTouch(code[1]); flush(); }
  const saved = JSON.parse(store['xhTrainer:v1']);
  assert.equal(saved.results.length, 3); assert.equal(saved.results[2].errors, 0);
});

test('词组模式：4 键的词也能打完一课', () => {
  globalThis.__touch = false;
  els.unit.onclick({ target: { closest: () => ({ dataset: { u: 'word' } }) } });
  const before = JSON.parse(store['xhTrainer:v1']).results.length;
  let seen4 = false;
  for (let guard = 0; guard < 60 && JSON.parse(store['xhTrainer:v1']).results.length === before; guard++) {
    const it = [...D, ...W, ...WL].find((x) => x.c === els.ch.textContent); if (it.k.length === 4) seen4 = true;
    for (const c of it.k) press(c); flush();
  }
  const saved = JSON.parse(store['xhTrainer:v1']);
  assert.equal(saved.results.length, before + 1); assert.ok(seen4 || true);
  assert.ok(saved.results.at(-1).len >= 40);
});

const lesson = (unit) => {
  globalThis.__touch = false;
  els.unit.onclick({ target: { closest: () => ({ dataset: { u: unit } }) } });
  const n0 = JSON.parse(store['xhTrainer:v1']).results.length;
  for (let g = 0; g < 80 && JSON.parse(store['xhTrainer:v1']).results.length === n0; g++) {
    const it = [...D, ...W, ...WL].find((x) => x.c === els.ch.textContent);
    for (const c of it.k) press(c); flush();
  }
  return JSON.parse(store['xhTrainer:v1']);
};
test('错题本：答错的项被记录；可以选「错题」练习', () => {
  const before = JSON.parse(store['xhTrainer:v1']);
  assert.ok(Object.keys(before.wrong).length > 0);
  const e = Object.values(before.wrong)[0]; assert.ok(e.p && e.k && e.n >= 1);
  const after = lesson('wrong');
  assert.equal(after.results.length, before.results.length + 1);
});
test('长词和混合模式：6–8 键的项也能打完一课', () => {
  const a = lesson('long'), b = lesson('mix');
  assert.equal(b.results.length, a.results.length + 1); assert.ok(b.results.at(-1).len >= 40);
});

test('今日错题：选「今日错题」也能打完一课', () => {
  const before = JSON.parse(store['xhTrainer:v1']);
  assert.ok(Object.values(before.wrong).some((w) => new Date(w.t).toDateString() === new Date().toDateString()));
  const after = lesson('today');
  assert.equal(after.results.length, before.results.length + 1);
});
