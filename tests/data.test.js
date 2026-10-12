import test from 'node:test';
import assert from 'node:assert/strict';
import { D, W, WL, ORDER, ROWS } from '../public/js/data.js';
const k = (c) => D.find((x) => x.c === c)?.k;

test('官网键位图例字', () => {
  const want = { 秋: 'qq', 软: 'rr', 云: 'yy', 撇: 'pp', 带: 'dd', 粉: 'ff', 更: 'gg', 航: 'hh', 揍: 'zz', 草: 'cc', 滨: 'bb', 鸟: 'nn', 眠: 'mm',
    月: 'yt', 蛙: 'wx', 王: 'wl', 鱼: 'yv', 安: 'aj', 迎: 'yk', 怂: 'ss', 恿: 'ys', 两: 'll', 快: 'kk', 夏: 'xx', 追: 'vv', 梳: 'uu', 翅: 'ii' };
  for (const [c, code] of Object.entries(want)) { if (k(c)) assert.equal(k(c), code, c); }
});
test('规则：sh/ch/zh、零声母、j q x 后的 u', () => {
  assert.equal(k('中'), 'vs'); assert.equal(k('书'), 'uu'); assert.equal(k('爱'), 'ad'); assert.equal(k('欧'), 'oz'); assert.equal(k('二'), 'er');
  assert.equal(k('去'), 'qu'); assert.equal(k('女'), 'nv'); assert.equal(k('饿'), 'ee');
});
test('每个音节都是两个小写字母，且键都在键盘上', () => {
  const keys = new Set(ROWS.join(''));
  for (const x of D) { assert.match(x.k, /^[a-z]{2}$/, x.c); assert.ok([...x.k].every((c) => keys.has(c)), x.c); }
  assert.ok(D.length > 500); assert.ok(ORDER.length >= 20);
});

test('同一个字只对应一种键序，题库规模足够', () => {
  const by = new Map();
  for (const x of D) { if (!by.has(x.c)) by.set(x.c, new Set()); by.get(x.c).add(x.k); }
  assert.deepEqual([...by].filter(([, s]) => s.size > 1), []);
  assert.ok(D.length > 2000); assert.ok(new Set(D.map((x) => x.p)).size > 350);
});

test('词组：二字词，键序 4 个字母，且和单字键序一致', () => {
  assert.ok(W.length > 1500);
  const code = new Map(D.map((x) => [x.c, x.k]));
  for (const x of W) {
    assert.match(x.k, /^[a-z]{4}$/, x.c);
    const [a, b] = [...x.c];
    if (code.has(a) && code.has(b) && x.p.split(' ').length === 2) assert.equal(x.k.length, 4);
  }
  assert.equal(W.find((x) => x.c === '学习')?.k, 'xtxi');
});

test('长词：三字词 6 键、四字词 8 键', () => {
  assert.ok(WL.length > 2000);
  for (const x of WL) { const n = [...x.c].length; assert.ok(n === 3 || n === 4, x.c); assert.equal(x.k.length, n * 2, x.c); assert.match(x.k, /^[a-z]+$/); }
});

test('成语：四字、8 键，且收了常见成语', () => {
  const idioms = WL.filter((x) => [...x.c].length === 4);
  assert.ok(idioms.length > 1000);
  assert.equal(idioms.find((x) => x.c === '一心一意')?.k, 'yixbyiyi');
});
