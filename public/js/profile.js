import { ORDER } from './data.js';
import { Target, timeToSpeed, makeResult, validateResult, buildKeyStats, learningRate, dayKey, weekKey, weeklyKeySpeeds } from './core/model.js';
import { lineChart, barChart } from './charts.js';
import { load, KEY, raw } from './store.js';

const $ = (id) => document.getElementById(id);
const fm = (n, d = 0) => n.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
const { settings: S, results: raws, wrong: WR } = load();
const results = raws.map(makeResult).filter(validateResult), tg = new Target(S.target);
const sum = (f) => results.reduce((a, r) => a + f(r), 0), len = sum((r) => r.len);

$('cards').innerHTML = [
  ['累计积分', fm(sum((r) => r.score))], ['总练习时长', fm(sum((r) => r.time) / 60000) + ' 分钟'], ['完成课数', fm(results.length)],
  ['平均正确率', len ? fm((sum((r) => r.len - r.errors) / len) * 100, 1) + '%' : '—'], ['目标速度', S.target + ' 击键/分'],
  ['最近一课', results.length ? fm(results.at(-1).speed) + ' 击键/分' : '—'],
].map(([a, b]) => `<div class="card2"><b>${b}</b><span>${a}</span></div>`).join('');

lineChart($('cS'), results.map((r) => r.speed), { ref: S.target, fmt: (v) => fm(v), empty: '数据不足：至少完成 2 课（每课 20 题）' });
lineChart($('cA'), results.map((r) => r.accuracy * 100), { fmt: (v) => fm(v, 1) + '%', empty: '数据不足：至少完成 2 课' });
const ds = [...Array(30)].map((_, i) => dayKey(Date.now() - (29 - i) * 864e5));
barChart($('cD'), ds.map((d) => sum((r) => (dayKey(r.t) === d ? r.time : 0)) / 60000), { ref: S.goal, tip: (i, v) => `${ds[i]}：${fm(v, 1)} 分钟` });

// 每周汇总（周一为起点）
const weekOf = weekKey;
const wk = new Map();
for (const r of results) {
  const k = weekOf(r.t), w = wk.get(k) ?? { n: 0, time: 0, sp: 0, len: 0, err: 0, score: 0 };
  w.n++; w.time += r.time; w.sp += r.speed; w.len += r.len; w.err += r.errors; w.score += r.score; wk.set(k, w);
}
const weeks = [...wk].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
$('wk').innerHTML = weeks.map(([k, w], i) => {
  const sp = w.sp / w.n, acc = ((w.len - w.err) / w.len) * 100, P = i ? weeks[i - 1][1] : null;
  const dl = (a, b, d, u = '') => (P ? ` <em class="${a >= b ? 'up' : 'dn'}">${a >= b ? '↑' : '↓'}${fm(Math.abs(a - b), d)}${u}</em>` : '');
  return `<tr><td>${k}</td><td>${w.n}</td><td>${fm(w.time / 60000, 1)}</td><td>${fm(sp)}${dl(sp, P && P.sp / P.n, 0)}</td><td>${fm(acc, 1)}%${dl(acc, P && ((P.len - P.err) / P.len) * 100, 1, '%')}</td><td>${fm(w.score)}</td></tr>`;
}).join('') || '<tr><td colspan="6">还没有记录</td></tr>';
// 错题本
const wrong = Object.entries(WR ?? {}).sort((a, b) => b[1].n - a[1].n);
$('wb').innerHTML = wrong.map(([c, w]) => `<tr><td><b>${c}</b></td><td>${w.p}</td><td>${w.k.toUpperCase()}</td><td>${w.n}</td><td>${w.ok}/3</td></tr>`).join('') || '<tr><td colspan="5">错题本是空的：答错的字词会自动进来，连对 3 次移出</td></tr>';
$('clrWrong').onclick = () => { try { const st = JSON.parse(raw()); st.wrong = {}; localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* 没有数据就不用清 */ } location.reload(); };

// 每个键每周速度
const ks = weeklyKeySpeeds(results, 6), rows = ORDER.filter((k) => ks.speeds.has(k));
$('kw').innerHTML = rows.length
  ? `<thead><tr><th>键</th>${ks.weeks.map((w) => `<th>${w.slice(5)}</th>`).join('')}<th>变化</th></tr></thead><tbody>${rows.map((k) => {
    const v = ks.speeds.get(k), a = v.at(-1), b = v.at(-2);
    const cell = (x) => (x == null ? '<td>—</td>' : `<td style="background:hsl(${Math.round(Math.min(x / S.target, 1) * 120)} 55% 62%);color:#10261a">${fm(x)}</td>`);
    const d = a != null && b != null ? `<em class="${a >= b ? 'up' : 'dn'}">${a >= b ? '↑' : '↓'}${fm(Math.abs(a - b))}</em>` : '—';
    return `<tr><td><b>${k.toUpperCase()}</b></td>${v.map(cell).join('')}<td>${d}</td></tr>`;
  }).join('')}</tbody>`
  : '<tbody><tr><td>还没有记录</td></tr></tbody>';

const stats = buildKeyStats(ORDER, results);
$('tb').innerHTML = ORDER.map((k) => {
  const s = stats.get(k), c = tg.confidence(s.timeToType), lr = s.samples.length ? learningRate(s.samples, tg) : null, h = c == null ? 0 : Math.round(Math.min(c, 1) * 120);
  const eta = !lr ? '—' : c >= 1 ? '已达标' : Number.isFinite(lr.remainingLessons) ? `约 ${lr.remainingLessons} 课` : '趋势不明';
  return `<tr><td><b>${k.toUpperCase()}</b></td><td>${s.samples.length}</td><td>${s.timeToType ? fm(timeToSpeed(s.timeToType)) : '—'}</td><td>${s.bestTimeToType ? fm(timeToSpeed(s.bestTimeToType)) : '—'}</td><td><div class="pb"><i style="width:${c == null ? 0 : Math.round(Math.min(c, 1) * 100)}%;background:hsl(${h} 60% 48%)"></i></div></td><td>${eta}</td></tr>`;
}).join('');

$('exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([raw()], { type: 'application/json' })); a.download = 'xiaohe-progress.json'; a.click(); };
$('imp').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const t = await f.text(); JSON.parse(t); localStorage.setItem(KEY, t); location.reload(); } catch { alert('文件格式不对'); } };
$('clr').onclick = () => { if (confirm('清除全部练习数据？不可恢复。')) { localStorage.removeItem(KEY); location.reload(); } };
