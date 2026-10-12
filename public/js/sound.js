// 用 Web Audio 合成提示音，不需要音频文件。浏览器要求先有用户操作才能出声，所以第一次响的时候才创建。
let ctx = null;
function ac() {
  try {
    ctx ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; } // 不支持 Web Audio 时静默
}
function tone(freq, dur, { type = 'sine', vol = 0.06, slide = 0 } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
}
export const sfx = {
  key() { tone(880, 0.035, { type: 'triangle', vol: 0.04 }); },
  err() { tone(220, 0.16, { type: 'square', vol: 0.05, slide: -90 }); },
};
