// 用最小 DOM 桩跑一遍练习页逻辑：打完一课应写入一条结果，答错会计入失误。
import test from 'node:test';
import assert from 'node:assert/strict';

const els = {}, queue = [], handlers = {}, store = {};
const mk = (id, kids = true) => ({ id, style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {} }, dataset: {}, children: kids ? [mk('', false), mk('', false)] : [],
  innerHTML: '', textContent: '', className: '', value: '', checked: false, offsetWidth: 0, addEventListener() {}, focus() {}, blur() {}, getAttribute: () => '0 0 300 80' });
globalThis.document = { getElementById: (id) => (els[id] ??= mk(id)),
  querySelectorAll: (s) => (s === '.k' ? [...'qwertyuiopasdfghjklzxcvbnm'].map((l) => ({ ...mk(), dataset: { k: l } })) : []) };
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
globalThis.addEventListener = (t, f) => { handlers[t] = f; };
globalThis.matchMedia = () => ({ matches: false });
globalThis.confirm = () => true;
let now = 0; Object.defineProperty(globalThis, 'performance', { value: { now: () => (now += 250) }, configurable: true });
globalThis.setTimeout = (f) => { queue.push(f); return 0; };
globalThis.clearTimeout = () => {};

const { D } = await import('../public/js/data.js');
await import('../public/js/practice.js');
const press = (c) => handlers.keydown({ code: 'Key' + c.toUpperCase(), target: { id: '' }, preventDefault() {} });
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
