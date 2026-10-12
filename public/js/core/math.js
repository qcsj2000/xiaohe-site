// 数学工具。算法思路来自 keybr.com 的 keybr-math（指数平滑、多项式回归、R²）。
export const makeFilter = (alpha) => {
  let n = 0, v = NaN;
  return { get n() { return n; }, add(x) { n++; v = n > 1 ? alpha * x + (1 - alpha) * v : x; return v; } };
};
/** 最小二乘多项式拟合（正规方程 + 高斯消元），返回系数 c[0..deg]。 */
export function polyFit(xs, ys, deg) {
  const m = deg + 1, A = Array.from({ length: m }, () => Array(m + 1).fill(0));
  for (let i = 0; i < xs.length; i++) {
    const p = []; let a = 1;
    for (let j = 0; j < 2 * m; j++) { p[j] = a; a *= xs[i]; }
    for (let r = 0; r < m; r++) { for (let c = 0; c < m; c++) A[r][c] += p[r + c]; A[r][m] += p[r] * ys[i]; }
  }
  for (let c = 0; c < m; c++) {
    let piv = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    if (Math.abs(A[c][c]) < 1e-12) continue;
    for (let r = 0; r < m; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= m; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[m] / row[i]));
}
export const polyEval = (c, x) => c.reduce((a, v, i) => a + v * x ** i, 0);
export const polyDeriv = (c) => c.slice(1).map((v, i) => v * (i + 1));
export function r2(xs, ys, c) {
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let res = 0, tot = 0;
  ys.forEach((y, i) => { res += (y - polyEval(c, xs[i])) ** 2; tot += (y - my) ** 2; });
  return tot ? 1 - res / tot : 0;
}
