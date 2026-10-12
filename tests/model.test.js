import test from 'node:test';
import assert from 'node:assert/strict';
import { Target, speedToTime, makeResult, validateResult, buildKeyStats, findSession, learningRate, guidedKeys, pickLesson } from '../public/js/core/model.js';
import { polyFit, polyEval, makeFilter } from '../public/js/core/math.js';

test('速度和用时互转', () => { assert.equal(speedToTime(120), 500); assert.equal(new Target(120).confidence(250), 2); assert.equal(new Target(120).confidence(null), null); });
test('指数平滑 alpha=0.1', () => { const f = makeFilter(0.1); f.add(500); assert.ok(Math.abs(f.add(400) - 490) < 1e-9); });
test('多项式拟合能还原二次曲线', () => {
  const xs = [-4, -3, -2, -1, 0], ys = xs.map((x) => 2 + 3 * x + 0.5 * x * x), c = polyFit(xs, ys, 2);
  assert.ok(Math.abs(polyEval(c, 1) - 5.5) < 1e-6);
});
test('积分公式：速度 × 键数 ÷ (错误+1) × 长度/50', () => {
  const r = makeResult({ t: 0, len: 50, time: 30000, errors: 0, hist: { a: [1, 0, 300], b: [1, 0, 300], c: [1, 0, 300], d: [1, 0, 300], e: [1, 0, 300] } });
  assert.equal(r.speed, 100); assert.equal(r.score, 500); assert.equal(r.accuracy, 1);
  assert.ok(validateResult(r)); assert.ok(!validateResult(makeResult({ t: 0, len: 5, time: 500, errors: 0, hist: { a: [1, 0, 100] } })));
});
test('按键统计回放：平滑值与最佳值', () => {
  const mk = (t) => makeResult({ t, len: 40, time: 20000, errors: 0, hist: { a: [5, 0, t] } });
  const s = buildKeyStats(['a', 'b'], [mk(500), mk(400)]).get('a');
  assert.equal(s.samples.length, 2); assert.ok(Math.abs(s.timeToType - 490) < 1e-9); assert.ok(Math.abs(s.bestTimeToType - 490) < 1e-9);
  assert.equal(buildKeyStats(['a', 'b'], []).get('b').timeToType, null);
});
test('findSession：间隔超过 1 小时就截断', () => {
  const s = [0, 1, 2, 3].map((i) => ({ index: i, timeStamp: i < 2 ? i : 4e6 + i, filteredTimeToType: 300 }));
  assert.equal(findSession(s).length, 2);
});
test('学习速率：持续进步时可预测达标课数', () => {
  const samples = Array.from({ length: 12 }, (_, i) => ({ index: i, timeStamp: i * 1000, filteredTimeToType: 600 - i * 15 }));
  const r = learningRate(samples, new Target(150));
  assert.ok(r.certainty >= 0.5 && r.learningRate > 0 && r.remainingLessons >= 1);
  assert.equal(learningRate(samples.slice(0, 3), new Target(150)), null);
});
test('引导解锁：先开 minSize 个键，全部达标才开下一个', () => {
  const L = ['a', 'b', 'c', 'd', 'e'], t = new Target(100); // 目标每键 600ms
  let g = guidedKeys(L, buildKeyStats(L, []), t, { minSize: 2 });
  assert.deepEqual([...g.included], ['a', 'b']); assert.equal(g.focus, 'a');
  const fast = [makeResult({ t: 1, len: 40, time: 20000, errors: 0, hist: { a: [5, 0, 300], b: [5, 0, 300] } })];
  g = guidedKeys(L, buildKeyStats(L, fast), t, { minSize: 2 });
  assert.deepEqual([...g.included], ['a', 'b', 'c']); assert.equal(g.focus, 'c');
});
test('出题：焦点键权重更高且不连续重复', () => {
  const pool = [{ k: 'aa' }, { k: 'bb' }, { k: 'cc' }], out = pickLesson(pool, 'a', 300);
  assert.equal(out.length, 300); assert.ok(out.every((x, i) => i === 0 || x !== out[i - 1]));
  assert.ok(out.filter((x) => x.k === 'aa').length > out.filter((x) => x.k === 'bb').length);
});
