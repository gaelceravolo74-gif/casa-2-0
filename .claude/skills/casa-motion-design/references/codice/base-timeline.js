// Estratto da masterpiece/index.html: utilità di base, easing, spring, rumore, timeline, shake.

// =============================================================== utilities
const TAU = Math.PI * 2, D2R = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const sm = t => t * t * (3 - 2 * t);
const ss = (a, b, v) => sm(inv(a, b, v));
const win = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
const E = {
  lin: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t,
  inQuart: t => t * t * t * t,
  outCubic: t => 1 - (1 - t) ** 3,
  outQuart: t => 1 - (1 - t) ** 4,
  outQuint: t => 1 - (1 - t) ** 5,
  outExpo: t => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  inExpo: t => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  inOutQuart: t => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
  inOutQuint: t => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  inOutExpo: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
  outBack: t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  outBackS: t => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
  inBack: t => 2.70158 * t ** 3 - 1.70158 * t * t,
  outElastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
};
// eased progress of the window [a, b]
const ep = (a, b, t, f = E.inOutCubic) => f(inv(a, b, t));
// damped spring response to a step at time 0 (0 → 1 with overshoot)
const spring = (t, f = 7, z = 0.42) => {
  if (t <= 0) return 0;
  const w = TAU * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
};
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (a, b = 0) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// smooth 1D value noise in [-1, 1]
const noise1 = x => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, 17) * 2 - 1, hash(i + 1, 17) * 2 - 1, u);
};


// =============================================================== timeline
// 100 BPM: one beat is 0.6 s, one bar 2.4 s. Picture and score both read
// this table, so every cut, slam and stamp lands on the music.
const BPM = 100, BEAT = 60 / BPM, DUR = 40;
const T = {
  hai: 0, casa: 0.3, tivoli: 0.6, fill: 1.0, punch: 1.2, q2: 1.8,
  promise: 3.6, pumps: [3.9, 4.2, 4.5, 4.8, 5.1, 5.35, 5.6, 5.8], gonfiata: 4.8, pop: 6.0,
  chart: 6.3, months0: 6.45, months1: 8.85, ribassi: 7.8, rewind: 9.0,
  noino: 9.6, data: 10.8, dots: [10.8, 11.1, 11.4, 11.55, 11.7, 12.0, 12.15, 12.3, 12.6], lock: 13.05, giusto: 13.2,
  house: 14.4, props: [15.0, 15.3, 15.6, 15.9], flash: 16.2, docs: 16.8, stamps: [17.4, 18.0, 18.6], noi: 18.0,
  phone: 19.2, pings: [19.8, 20.4, 21.0], report: 21.6, trasp: 22.8, accepted: 23.4,
  sold: 24.0, keys: 24.3, pull: 25.2, stats: [26.4, 27.0, 27.6], office: 28.8, push: 30.3,
  cta: 31.2, gratis: 33.6, senza: 34.8, tap: 35.4, logo: 36.0, end: 40.0,
};


// camera shake: decaying noise after each impact
const IMPACTS = [[T.pop, 22], [T.noino, 12], [T.sold, 18], [T.gratis, 8], [T.logo, 6], [T.stamps[0], 5], [T.stamps[1], 5], [T.stamps[2], 7]];
function shake(t) {
  let x = 0, y = 0;
  for (const [ti, amp] of IMPACTS) {
    const u = t - ti;
    if (u < 0 || u > 0.5) continue;
    const e = amp * Math.exp(-u * 11);
    x += noise1(u * 38 + ti) * e; y += noise1(u * 41 + ti * 3 + 9) * e;
  }
  return [x, y];
}
