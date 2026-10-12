import { ORDER } from './data.js';
import { Target, timeToSpeed, makeResult, validateResult, buildKeyStats, learningRate, dayKey } from './core/model.js';
import { lineChart, barChart } from './charts.js';
import { load, KEY, raw } from './store.js';

const $ = (id) => document.getElementById(id);
const fm = (n, d = 0) => n.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
const { settings: S, results: raws } = load();
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

const stats = buildKeyStats(ORDER, results);
$('tb').innerHTML = ORDER.map((k) => {
  const s = stats.get(k), c = tg.confidence(s.timeToType), lr = s.samples.length ? learningRate(s.samples, tg) : null, h = c == null ? 0 : Math.round(Math.min(c, 1) * 120);
  const eta = !lr ? '—' : c >= 1 ? '已达标' : Number.isFinite(lr.remainingLessons) ? `约 ${lr.remainingLessons} 课` : '趋势不明';
  return `<tr><td><b>${k.toUpperCase()}</b></td><td>${s.samples.length}</td><td>${s.timeToType ? fm(timeToSpeed(s.timeToType)) : '—'}</td><td>${s.bestTimeToType ? fm(timeToSpeed(s.bestTimeToType)) : '—'}</td><td><div class="pb"><i style="width:${c == null ? 0 : Math.round(Math.min(c, 1) * 100)}%;background:hsl(${h} 60% 48%)"></i></div></td><td>${eta}</td></tr>`;
}).join('');

$('exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([raw()], { type: 'application/json' })); a.download = 'xiaohe-progress.json'; a.click(); };
$('imp').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const t = await f.text(); JSON.parse(t); localStorage.setItem(KEY, t); location.reload(); } catch { alert('文件格式不对'); } };
$('clr').onclick = () => { if (confirm('清除全部练习数据？不可恢复。')) { localStorage.removeItem(KEY); location.reload(); } };
