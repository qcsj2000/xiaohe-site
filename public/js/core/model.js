// 学习模型：按键统计、置信度、引导式解锁、学习速率、积分。
// 移植自 keybr.com（AGPL-3.0）的 keybr-result / keybr-lesson，适配到「双拼音节」练习。
import { makeFilter, polyFit, polyEval, polyDeriv, r2 } from './math.js';

/** 速度单位是「击键/分」（cpm）；时间单位是毫秒。 */
export const speedToTime = (v) => 60000 / v;
export const timeToSpeed = (v) => 60000 / v;
export const dayKey = (t) => new Date(t).toLocaleDateString('sv');

export class Target {
  constructor(targetSpeed) { this.targetSpeed = targetSpeed; }
  /** 置信度 = 目标每键用时 / 实际每键用时；≥1 表示达标。 */
  confidence(timeToType) { return timeToType == null ? null : speedToTime(this.targetSpeed) / timeToType; }
}

export const RESULT_FILTER = { minLength: 10, minTime: 1000 };
/** 一课的结果。hist: { 键: [命中数, 失误数, 平均每键用时ms] }。score 公式同 keybr。 */
export function makeResult({ t, len, time, errors, hist }) {
  const complexity = Object.keys(hist).length;
  let speed = 0, accuracy = 0, score = 0;
  if (len > 0 && time > 0 && complexity > 0) {
    speed = (len / (time / 1000)) * 60;
    accuracy = (len - errors) / len;
    score = ((speed * complexity) / (errors + 1)) * (len / 50);
  }
  return { t, len, time, errors, hist, complexity, speed, accuracy, score };
}
export const validateResult = (r) =>
  r.len >= RESULT_FILTER.minLength && r.time >= RESULT_FILTER.minTime && r.complexity >= 1 && r.speed >= 1;
export const baseOf = ({ t, len, time, errors, hist }) => ({ t, len, time, errors, hist });

/** 回放所有课的结果，得到每个键的样本和平滑后的用时（平滑系数 0.1，同 keybr）。 */
export function buildKeyStats(letters, results) {
  const map = new Map(letters.map((l) => [l, { letter: l, samples: [], timeToType: null, bestTimeToType: null, f: makeFilter(0.1), i: 0 }]));
  for (const r of results) {
    for (const s of map.values()) {
      const h = r.hist[s.letter];
      if (h && h[2] > 0) {
        const ft = s.f.add(h[2]);
        s.samples.push({ index: s.i, timeStamp: r.t, hitCount: h[0], missCount: h[1], timeToType: h[2], filteredTimeToType: ft });
        s.timeToType = ft;
        s.bestTimeToType = Math.min(s.bestTimeToType ?? Infinity, ft);
      }
      s.i++;
    }
  }
  return map;
}

/** 取最近一段不间断、没有变慢的练习（间隔超过 1 小时或变慢即截断）。 */
export function findSession(samples) {
  const n = samples.length;
  for (let i = n - 1; i > 0; i--) {
    const a = samples[i - 1], b = samples[i];
    if (b.timeStamp - a.timeStamp > 3600000) return samples.slice(i);
    if (b.filteredTimeToType > a.filteredTimeToType && n - i + 1 >= 5) return samples.slice(i);
  }
  return samples.slice(0);
}

/** 学习速率：对速度做多项式回归，R²≥0.5 才可信，估算还需几课达到目标。 */
export function learningRate(samples, target) {
  const recent = samples.slice(-30);
  if (recent.length < 5) return null;
  const session = findSession(recent);
  const used = session.length >= 5 ? session : recent;
  const x0 = used.at(-1).index + 1;
  const xs = used.map((s) => s.index + 1 - x0), ys = used.map((s) => timeToSpeed(s.filteredTimeToType));
  const deg = used.length > 20 ? 3 : used.length > 10 ? 2 : 1;
  const c = polyFit(xs, ys, deg), certainty = r2(xs, ys, c);
  const out = { certainty, learningRate: NaN, remainingLessons: NaN };
  if (certainty >= 0.5) {
    out.learningRate = polyEval(polyDeriv(c), 0);
    for (let i = 1; i <= 50; i++) if (polyEval(c, i) >= target.targetSpeed) { out.remainingLessons = i; break; }
  }
  return out;
}

/**
 * 引导式解锁（GuidedLesson.update 的移植，alphabetSize=0）：
 * 先放进 minSize 个键；已达标的键一直保留；只有所有已解锁键都曾达标，才放进下一个键。
 * 焦点键 = 已解锁且未达标的键里最弱的一个。
 */
export function guidedKeys(letters, stats, target, { minSize = 6, recover = false } = {}) {
  const keys = letters.map((letter) => {
    const s = stats.get(letter);
    return { letter, confidence: target.confidence(s.timeToType), bestConfidence: target.confidence(s.bestTimeToType), included: false };
  });
  const inc = () => keys.filter((k) => k.included);
  const cf = (k) => (recover ? k.confidence ?? 0 : k.bestConfidence ?? 0);
  for (const k of keys) {
    const I = inc();
    if (I.length < minSize) { k.included = true; continue; }
    if ((k.bestConfidence ?? 0) >= 1) { k.included = true; continue; }
    if (I.every((x) => cf(x) >= 1)) k.included = true;
  }
  const weakest = inc().filter((k) => cf(k) < 1).sort((a, b) => cf(a) - cf(b))[0];
  return { keys, included: new Set(inc().map((k) => k.letter)), focus: weakest?.letter ?? null };
}

/** 抽一课的题，直到累计击键数达到 budget：含焦点键的项权重 ×4，且不连续重复。 */
export function pickLesson(pool, focus, budget, rng = Math.random) {
  const w = pool.map((x) => (focus && x.k.includes(focus) ? 4 : 1)), out = [];
  let prev = null, keys = 0;
  while (keys < budget && pool.length) {
    const tot = w.reduce((a, b, i) => a + (pool[i] === prev && pool.length > 1 ? 0 : b), 0);
    let r = rng() * tot, j = 0;
    for (; j < pool.length; j++) { if (pool[j] === prev && pool.length > 1) continue; r -= w[j]; if (r <= 0) break; }
    prev = pool[Math.min(j, pool.length - 1)]; out.push(prev); keys += prev.k.length;
  }
  return out;
}

export const dailyMinutes = (results, now = Date.now()) =>
  results.filter((r) => dayKey(r.t) === dayKey(now)).reduce((a, r) => a + r.time, 0) / 60000;

/** 周一为起点的周标识（YYYY-MM-DD）。 */
export const weekKey = (t) => { const d = new Date(t); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); };
/** 每个键最近 nWeeks 周的平均速度（击键/分，按命中数加权）；没练过的周为 null。 */
export function weeklyKeySpeeds(results, nWeeks = 6, now = Date.now()) {
  const weeks = [];
  for (let i = nWeeks - 1; i >= 0; i--) weeks.push(weekKey(now - i * 7 * 864e5));
  const acc = new Map();
  for (const r of results) {
    const w = weekKey(r.t); if (!weeks.includes(w)) continue;
    for (const [k, h] of Object.entries(r.hist)) {
      if (!(h[0] > 0 && h[2] > 0)) continue;
      const m = acc.get(k) ?? new Map(), a = m.get(w) ?? [0, 0];
      a[0] += h[2] * h[0]; a[1] += h[0]; m.set(w, a); acc.set(k, m);
    }
  }
  const speeds = new Map();
  for (const [k, m] of acc) speeds.set(k, weeks.map((w) => (m.has(w) ? timeToSpeed(m.get(w)[0] / m.get(w)[1]) : null)));
  return { weeks, speeds };
}
