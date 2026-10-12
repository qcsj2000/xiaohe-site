const dims = (svg) => svg.getAttribute('viewBox').split(' ').map(Number).slice(2);
export function lineChart(svg, vals, { ref, fmt = (v) => v.toFixed(1), empty = '数据不足' } = {}) {
  const [W, H] = dims(svg), L = 6, p = vals.slice(-100);
  if (p.length < 2) { svg.innerHTML = `<text x="8" y="18" fill="currentColor">${empty}</text>`; return; }
  const mx = Math.max(...p, ref || 0) * 1.1 || 1, X = (i) => L + (i / (p.length - 1)) * (W - 2 * L), Y = (v) => H - 6 - (v / mx) * (H - 22);
  svg.innerHTML = (ref ? `<line x1="${L}" x2="${W - L}" y1="${Y(ref)}" y2="${Y(ref)}" stroke="var(--ok)" stroke-dasharray="4 3"/>` : '')
    + `<polyline fill="none" stroke="var(--acc)" stroke-width="2" vector-effect="non-scaling-stroke" points="${p.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}"/>`
    + `<text x="${L}" y="12" fill="currentColor">最高 ${fmt(Math.max(...p))} · 最近 ${fmt(p.at(-1))} · 共 ${vals.length} 个点</text>`;
}
export function barChart(svg, vals, { ref, tip = (i, v) => String(v) } = {}) {
  const [W, H] = dims(svg), mx = Math.max(ref || 0, ...vals) || 1, bw = W / vals.length, Y = (v) => H - 10 - (v / mx) * (H - 30);
  svg.innerHTML = vals.map((v, i) => `<rect x="${i * bw + 2}" y="${Y(v)}" width="${bw - 4}" height="${H - 10 - Y(v)}" fill="var(--acc)"><title>${tip(i, v)}</title></rect>`).join('')
    + (ref ? `<line x1="0" x2="${W}" y1="${Y(ref)}" y2="${Y(ref)}" stroke="var(--ok)" stroke-dasharray="4 3"/>` : '');
}
