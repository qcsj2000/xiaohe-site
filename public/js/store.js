// 本地存储：只存设置和每课结果，其余统计都由结果回放得出。
export const KEY = 'xhTrainer:v1';
export const defaults = () => ({ settings: { target: 100, goal: 30, py: true, hint: false, mode: 'guided' }, results: [] });
export function load() {
  const d = defaults();
  try { const v = JSON.parse(localStorage.getItem(KEY)); return { settings: { ...d.settings, ...v?.settings }, results: v?.results ?? [] }; }
  catch { return d; }
}
export function save(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 存储不可用时只是不记忆 */ } }
export const raw = () => { try { return localStorage.getItem(KEY) || '{}'; } catch { return '{}'; } };
