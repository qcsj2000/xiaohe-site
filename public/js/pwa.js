// 离线缓存：已打开过的页面断网也能用。找不到 serviceWorker 或注册失败时静默跳过。
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
