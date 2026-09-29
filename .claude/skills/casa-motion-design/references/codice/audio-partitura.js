// Estratto da masterpiece/index.html: tutto l'audio (motore, foley, partitura) + i hook di render offline.

// ================================================================== audio
// A score composed in code (B minor / D major, 100 BPM) and ASMR foley that
// read the same cue table as the picture. The music and the foley are one
// part: every sound effect owns its place in the bar and the band plays
// around it. Where an effect speaks, the band rests on it, or changes pace
// with it. The reels are its hi-hats, the pumps its pulse, the price cuts
// step its bass down, the data points and the props play its arpeggio, the
// stamps are its backbeat and the notifications its melody. Nothing turns
// the music down: no sidechain, no ducking, no compressor across the mix.
// Graph: instruments → music / drums / sfx buses at fixed levels → generated
// reverb + dotted-eighth delay → presence EQ → a soft clipper, which has no
// memory, so a loud hit never pulls the music down after it. The impacts are
// levelled on their own bus.
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function makeNoise(ac, sec) {
  const b = ac.createBuffer(1, Math.floor(ac.sampleRate * sec), ac.sampleRate), d = b.getChannelData(0), r = rng(123);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  return b;
}
function makeIR(ac, sec, decay) {
  const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch), r = rng(7 + ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const x = i / n, k = 0.08 + 0.9 * x;          // darker as it decays
      lp += (r() * 2 - 1 - lp) * (1 - k * 0.92);
      d[i] = lp * Math.pow(1 - x, decay) * (i < ac.sampleRate * 0.012 ? i / (ac.sampleRate * 0.012) : 1);
    }
    // a few early reflections
    for (const [ms, g] of [[11, 0.5], [19, 0.36], [29, 0.28], [41, 0.2]]) { const j = Math.floor(ac.sampleRate * (ms + ch * 3) / 1000); d[j] += g; }
  }
  return b;
}
// a waveshaper curve from a function on [-1, 1]
function curveOf(fn, n = 2048) { const c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = fn(i / (n - 1) * 2 - 1); return c; }
// a mixer channel at a fixed level; G.bus keeps them
function bus(G, name, dest, level) {
  const g = G.ac.createGain(); g.gain.value = level; g.connect(dest); G.bus[name] = g;
  return g;
}
function audioGraph(ac, t0 = 0) {
  // live: sources that outlast one note, stopped when playback restarts
  const G = { ac, nr: rng(99), t0, bus: {}, live: [] };
  // master: 30 Hz high-pass → presence (phone speakers live between 300 Hz and 6 kHz)
  // and air → a soft clipper, linear to 0.6 with a smooth knee that never passes 0.95
  G.out = ac.createGain(); G.out.gain.value = 1.0;
  const hp = filt(G, 'highpass', 30, 0.7), pres = filt(G, 'peaking', 2800, 0.7), air = filt(G, 'highshelf', 8000);
  pres.gain.value = 2.5; air.gain.value = 1.5;
  const clipIn = ac.createGain(), clip = ac.createWaveShaper();
  clipIn.gain.value = 0.5;
  clip.curve = curveOf(u => { const x = 2 * u, a = Math.abs(x); return Math.sign(x) * (a < 0.6 ? a : 0.6 + 0.35 * Math.tanh((a - 0.6) / 0.35)); });
  G.post = ac.createGain(); G.post.gain.value = 0.94;
  G.out.connect(hp); hp.connect(pres); pres.connect(air); air.connect(clipIn); clipIn.connect(clip); clip.connect(G.post); G.post.connect(ac.destination);
  G.music = bus(G, 'music', G.out, 0.5);
  G.drums = bus(G, 'drums', G.out, 0.6);
  G.sfx = bus(G, 'sfx', G.out, 1.4);
  // the impacts are levelled on their own, so their peaks never reach the music
  const hitComp = ac.createDynamicsCompressor();
  hitComp.threshold.value = -12; hitComp.knee.value = 6; hitComp.ratio.value = 3; hitComp.attack.value = 0.002; hitComp.release.value = 0.15;
  hitComp.connect(G.out);
  G.hits = bus(G, 'hits', hitComp, 0.8);
  G.rev = ac.createConvolver(); G.rev.buffer = makeIR(ac, 2.6, 3.2);
  G.revIn = ac.createGain(); G.revIn.connect(G.rev);
  const revHp = filt(G, 'highpass', 220), revOut = ac.createGain(); revOut.gain.value = 0.42; G.bus.rev = revOut;
  G.rev.connect(revHp); revHp.connect(revOut); revOut.connect(G.out);
  // stereo ping-pong delay, dotted eighths, as eight feed-forward taps: left,
  // right, -8.9 dB every second repeat. A feedback loop sounds the same, but the
  // browser may run it a render quantum apart, so two exports would not match.
  G.dlyIn = ac.createGain();
  const dlp = filt(G, 'lowpass', 3200); G.dlyIn.connect(dlp);
  const oL = pan(G, G.out, -0.75), oR = pan(G, G.out, 0.75);
  for (let k = 0; k < 8; k++) {
    const dt = BEAT * 0.75 * (k + 1), d = ac.createDelay(dt + 0.1), g = ac.createGain();
    d.delayTime.value = dt; g.gain.value = 0.26 * Math.pow(0.36, k >> 1);
    dlp.connect(d); d.connect(g); g.connect(k % 2 ? oR : oL);
  }
  // the bass runs through a gentle tape-like saturation
  G.drive = ac.createWaveShaper();
  G.drive.curve = curveOf(x => Math.tanh(x * 2.2) / Math.tanh(2.2), 1024);
  const dg = ac.createGain(); dg.gain.value = 0.8; G.drive.connect(dg); dg.connect(G.music);
  G.noise = makeNoise(ac, 2.5);
  return G;
}
// ---------------------------------------------------------------- helpers
function vca(G, t, dest, a, peak, d, r, hold = 0) {
  const g = G.ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (hold > 0) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.setTargetAtTime(0, t + a + hold, d / 4);
  g.connect(dest);
  return g;
}
function osc(G, t, type, f, dur) { const o = G.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur); return o; }
function nsrc(G, t, dur) { const s = G.ac.createBufferSource(); s.buffer = G.noise; s.loop = true; s.start(t, G.nr() * 2); s.stop(t + dur + 0.05); return s; }
// filter sweeps update once per render quantum (2.7 ms), not every sample: inaudible
// on these envelopes, and far fewer coefficient updates for the audio thread
function filt(G, type, f, q = 0.7) {
  const b = G.ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q;
  if (b.frequency.automationRate) b.frequency.automationRate = b.Q.automationRate = b.gain.automationRate = 'k-rate';
  return b;
}
function pan(G, dest, p) { if (!G.ac.createStereoPanner) return dest; const s = G.ac.createStereoPanner(); s.pan.value = p; s.connect(dest); return s; }
function send(G, node, rev = 0, dly = 0) {
  if (rev > 0) { const g = G.ac.createGain(); g.gain.value = rev; node.connect(g); g.connect(G.revIn); }
  if (dly > 0) { const g = G.ac.createGain(); g.gain.value = dly; node.connect(g); g.connect(G.dlyIn); }
}
// ------------------------------------------------------------------- drums
function kick(G, t, v = 1) {
  const o = osc(G, t, 'sine', 170, 0.4);
  o.frequency.exponentialRampToValueAtTime(62, t + 0.05); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
  const g = G.ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.72 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  // body knock that phone speakers can reproduce
  const kn = osc(G, t, 'triangle', 240, 0.08); kn.frequency.exponentialRampToValueAtTime(120, t + 0.05);
  const kg = vca(G, t, G.drums, 0.001, 0.22 * v, 0.04, 0.02); kn.connect(kg);
  o.connect(g); g.connect(G.drums);
  const n = nsrc(G, t, 0.03), f = filt(G, 'highpass', 2600), ng = vca(G, t, G.drums, 0.001, 0.2 * v, 0.02, 0.02);
  n.connect(f); f.connect(ng);
}
function clap(G, t, v = 1) {
  const f = filt(G, 'bandpass', 1300, 1.1), out = pan(G, G.drums, 0.05);
  f.connect(out); send(G, f, 0.35);
  for (let i = 0; i < 3; i++) { const n = nsrc(G, t + i * 0.011, 0.02); const g = vca(G, t + i * 0.011, f, 0.001, 0.7 * v, 0.012, 0.01); n.connect(g); }
  const n = nsrc(G, t + 0.03, 0.2); const g = vca(G, t + 0.03, f, 0.002, 0.4 * v, 0.14, 0.1); n.connect(g);
}
function snare(G, t, v = 1) {
  const n = nsrc(G, t, 0.2), f = filt(G, 'bandpass', 1900, 0.8), g = vca(G, t, G.drums, 0.001, 0.5 * v, 0.11, 0.08);
  n.connect(f); f.connect(g); send(G, g, 0.15);
  const o = osc(G, t, 'triangle', 200, 0.12); o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
  const og = vca(G, t, G.drums, 0.001, 0.3 * v, 0.06, 0.05); o.connect(og);
}
// noise for the air, six detuned squares (the drum machine way) for the metal; the hats
// alternate a little left and right on the sixteenths
function hat(G, t, v = 1, open = false) {
  const len = open ? 0.3 : 0.06, out = pan(G, G.drums, Math.round(t / (BEAT / 4)) % 2 ? 0.45 : 0.15);
  const n = nsrc(G, t, len), f = filt(G, 'highpass', 7200), g = vca(G, t, out, 0.001, 0.15 * v, open ? 0.22 : 0.035, 0.03);
  n.connect(f); f.connect(g);
  const bp = filt(G, 'bandpass', 10000, 1.1), hp2 = filt(G, 'highpass', 7500), mg = vca(G, t, out, 0.001, 0.06 * v, open ? 0.2 : 0.03, 0.03);
  for (const fr of [307.9, 456.6, 554.4, 784.1, 810, 1200]) osc(G, t, 'square', fr, len + 0.05).connect(bp);
  bp.connect(hp2); hp2.connect(mg);
}
function shaker(G, t, v = 1) {
  const n = nsrc(G, t, 0.08), f = filt(G, 'bandpass', 6400, 0.9), g = vca(G, t, pan(G, G.drums, -0.45), 0.012, 0.09 * v, 0.04, 0.03);
  n.connect(f); f.connect(g);
}
// two noise strands, one each side, so the cymbal opens the stereo field on the hits
function crash(G, t, v = 1) {
  [-0.6, 0.6].forEach(p => {
    const n = nsrc(G, t, 2.2), f = filt(G, 'highpass', 5200), g = vca(G, t, pan(G, G.drums, p), 0.002, 0.15 * v, 1.6, 0.5);
    n.connect(f); f.connect(g); send(G, g, 0.3);
  });
}
// ------------------------------------------------------------- instruments
function bass(G, t, m, dur, v = 1) {
  const f = mtof(m), o1 = osc(G, t, 'sine', f, dur + 0.3), o2 = osc(G, t, 'sawtooth', f, dur + 0.3);
  const lp = filt(G, 'lowpass', 900, 1.2); lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(600, t + 0.2);
  const g = vca(G, t, G.drive, 0.006, 0.3 * v, 0.28, 0.1, Math.max(0, dur - 0.06));
  const g2 = G.ac.createGain(); g2.gain.value = 0.32;
  o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
}
function sub(G, t, m, dur, v = 1) {
  const o = osc(G, t, 'sine', mtof(m), dur + 0.6), g = vca(G, t, G.music, 0.02, 0.17 * v, 0.6, 0.3, dur);
  o.connect(g);
}
function pluck(G, t, m, v = 1, p = 0, bright = 1) {
  const f = mtof(m), o1 = osc(G, t, 'sawtooth', f, 0.6), o2 = osc(G, t, 'square', f * 1.003, 0.6);
  const lp = filt(G, 'lowpass', 400, 2); lp.frequency.setValueAtTime(900 + 3200 * bright, t); lp.frequency.exponentialRampToValueAtTime(380, t + 0.22);
  const g = vca(G, t, pan(G, G.music, p), 0.002, 0.23 * v, 0.34, 0.1);
  const m2 = G.ac.createGain(); m2.gain.value = 0.5;
  o1.connect(lp); o2.connect(m2); m2.connect(lp); lp.connect(g); send(G, g, 0.2, 0.55);
}
// att and rel: a pad swells in and fades out; a chord that changes with the picture moves faster
function pad(G, t, notes, dur, v = 1, bright = 1, att = 0.45, rel = 0.9) {
  const hp = filt(G, 'highpass', 170, 0.5), sides = [-0.7, 0.7].map(p => pan(G, hp, p));
  const lp = filt(G, 'lowpass', 800 + 700 * bright, 0.5), hold = Math.max(att + 0.01, dur);
  lp.frequency.setValueAtTime(600 + 500 * bright, t); lp.frequency.linearRampToValueAtTime(900 + 900 * bright, t + dur * 0.6);
  const g = G.ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08 * v, t + att); g.gain.setValueAtTime(0.08 * v, t + hold); g.gain.linearRampToValueAtTime(0, t + hold + rel);
  lp.connect(g); g.connect(G.music); send(G, g, 0.7);
  for (const m of notes) [-8, 8].forEach((dt, k) => {
    const o = osc(G, t, 'sawtooth', mtof(m), hold + rel + 0.3); o.detune.value = dt;
    const og = G.ac.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(sides[k]);
  });
  hp.connect(lp);
}
// the tape runs back: a chord that swells in reverse and bends up, cut on the beat
function rewindPad(G, t, notes, dur, v = 1) {
  const lp = filt(G, 'lowpass', 500, 0.7), g = G.ac.createGain();
  lp.frequency.exponentialRampToValueAtTime(4500, t + dur);
  g.gain.setValueAtTime(0.02 * v, t); g.gain.exponentialRampToValueAtTime(0.085 * v, t + dur - 0.012); g.gain.linearRampToValueAtTime(0, t + dur);
  lp.connect(g); g.connect(G.music); send(G, g, 0.35);
  notes.forEach(m => [-9, 9].forEach(dt => {
    const o = osc(G, t, 'sawtooth', mtof(m), dur + 0.05); o.detune.setValueAtTime(dt, t); o.detune.linearRampToValueAtTime(dt + 400, t + dur);
    o.connect(pan(G, lp, dt > 0 ? 0.6 : -0.6));
  }));
}
function epiano(G, t, m, dur, v = 1, p = 0) {
  const f = mtof(m), car = osc(G, t, 'sine', f, dur + 1.5), mod = osc(G, t, 'sine', f, dur + 1.5), tine = osc(G, t, 'sine', f * 14, 0.3);
  const mg = G.ac.createGain(); mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.25, t + 0.9);
  const tg = G.ac.createGain(); tg.gain.setValueAtTime(f * 1.2, t); tg.gain.exponentialRampToValueAtTime(1, t + 0.08);
  mod.connect(mg); mg.connect(car.frequency); tine.connect(tg); tg.connect(car.frequency);
  const g = vca(G, t, pan(G, G.music, p), 0.004, 0.17 * v, 1.1, 0.4, Math.max(0, dur - 0.4));
  car.connect(g); send(G, g, 0.35);
}
function bell(G, t, m, v = 1, p = 0, dec = 1.4, dest = G.music) {
  const f = mtof(m), out = pan(G, dest, p);
  [[1, 1, dec], [2.76, 0.4, dec * 0.45], [5.4, 0.2, dec * 0.25], [8.9, 0.08, dec * 0.12]].forEach(([k, a, d]) => {
    const o = osc(G, t, 'sine', f * k, d + 0.2), g = vca(G, t, out, 0.002, 0.14 * v * a, d, 0.1); o.connect(g); send(G, g, 0.5, 0.25);
  });
}
function marimba(G, t, m, v = 1, p = 0) {
  const f = mtof(m), out = pan(G, G.sfx, p);
  const o = osc(G, t, 'sine', f, 0.5), o2 = osc(G, t, 'sine', f * 4, 0.1);
  const g = vca(G, t, out, 0.002, 0.34 * v, 0.28, 0.1), g2 = vca(G, t, out, 0.001, 0.08 * v, 0.04, 0.03);
  o.connect(g); o2.connect(g2); send(G, g, 0.25, 0.2);
}
// -------------------------------------------------------------------- foley
function thump(G, t, v = 1) {
  const o = osc(G, t, 'sine', 150, 0.2); o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  const g = vca(G, t, G.sfx, 0.002, 0.5 * v, 0.1, 0.05); o.connect(g);
  const n = nsrc(G, t, 0.05), f = filt(G, 'bandpass', 2200, 0.9), ng = vca(G, t, G.sfx, 0.001, 0.4 * v, 0.03, 0.02);
  n.connect(f); f.connect(ng); send(G, ng, 0.2);
}
function whoosh(G, t, dur, v = 1, f0 = 400, f1 = 3000, p0 = -0.6, p1 = 0.6) {
  const n = nsrc(G, t, dur), f = filt(G, 'bandpass', f0, 1.2);
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7); f.frequency.exponentialRampToValueAtTime(f0 * 1.5, t + dur);
  const g = G.ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 * v, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
  let dest = G.sfx;
  if (G.ac.createStereoPanner) { const sp = G.ac.createStereoPanner(); sp.pan.setValueAtTime(p0, t); sp.pan.linearRampToValueAtTime(p1, t + dur); sp.connect(G.sfx); dest = sp; }
  n.connect(f); f.connect(g); g.connect(dest); send(G, g, 0.25);
}
function scratch(G, t, dur, v = 1) {
  const n = nsrc(G, t, dur), f = filt(G, 'bandpass', 3400, 1.6), g = G.ac.createGain();
  g.gain.setValueAtTime(0, t);
  const r = rng(Math.floor(t * 1000));
  for (let u = 0; u < dur; u += 0.03) g.gain.linearRampToValueAtTime((0.06 + 0.12 * r()) * v, t + u);
  g.gain.linearRampToValueAtTime(0, t + dur);
  n.connect(f); f.connect(g); g.connect(pan(G, G.sfx, 0.1));
}
function click(G, t, v = 1, f0 = 2600) {
  const o = osc(G, t, 'sine', f0, 0.05); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + 0.02);
  const g = vca(G, t, G.sfx, 0.0008, 0.3 * v, 0.018, 0.01); o.connect(g);
  const n = nsrc(G, t, 0.02), f = filt(G, 'highpass', 4000), ng = vca(G, t, G.sfx, 0.0005, 0.25 * v, 0.008, 0.005);
  n.connect(f); f.connect(ng);
}
function tick(G, t, v = 1, f0 = 2400) { click(G, t, 0.5 * v, f0 * (0.95 + 0.1 * G.nr())); }
function clack(G, t, v = 1) {
  click(G, t, 0.8 * v, 1500);
  const o = osc(G, t, 'triangle', 700, 0.08); o.frequency.exponentialRampToValueAtTime(260, t + 0.05);
  const g = vca(G, t, G.sfx, 0.001, 0.45 * v, 0.05, 0.03); o.connect(g);
}
// a pump of air: a hiss and a rising rubbery chirp, tuned (MIDI m) when the score gives a note
function pump(G, t, v = 1, k = 0, m) {
  const n = nsrc(G, t, 0.2), f = filt(G, 'bandpass', 1100 + k * 160, 1.4), g = vca(G, t, G.sfx, 0.02, 0.35 * v, 0.1, 0.05);
  f.frequency.linearRampToValueAtTime(1900 + k * 160, t + 0.14); n.connect(f); f.connect(g);
  const f0 = m === undefined ? 420 + k * 55 : mtof(m), f1 = m === undefined ? 560 + k * 70 : mtof(m + 5);
  const o = osc(G, t + 0.02, 'triangle', f0, 0.16), vib = osc(G, t, 'sine', 24, 0.2), vg = G.ac.createGain(); vg.gain.value = 18;
  vib.connect(vg); vg.connect(o.frequency); o.frequency.linearRampToValueAtTime(f1, t + 0.16);
  const bp = filt(G, 'bandpass', 900, 3), og = vca(G, t + 0.02, G.sfx, 0.01, 0.12 * v, 0.1, 0.04);
  o.connect(bp); bp.connect(og);
}
function squeak(G, t, dur, v = 1) {
  const o = osc(G, t, 'sawtooth', 520, dur + 0.1), vib = osc(G, t, 'sine', 9, dur + 0.1), vg = G.ac.createGain();
  vg.gain.setValueAtTime(10, t); vg.gain.linearRampToValueAtTime(60, t + dur); vib.connect(vg); vg.connect(o.frequency);
  o.frequency.exponentialRampToValueAtTime(1250, t + dur);
  const bp = filt(G, 'bandpass', 1400, 6); bp.frequency.exponentialRampToValueAtTime(2600, t + dur);
  const g = G.ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1 * v, t + dur * 0.85); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(bp); bp.connect(g); g.connect(G.sfx);
}
function pop(G, t, v = 1) {
  const n = nsrc(G, t, 0.2), f = filt(G, 'highpass', 700), g = vca(G, t, G.sfx, 0.0005, 1.0 * v, 0.06, 0.04);
  n.connect(f); f.connect(g); send(G, g, 0.5);
  const o = osc(G, t, 'sine', 140, 0.5); o.frequency.exponentialRampToValueAtTime(36, t + 0.35);
  const og = vca(G, t, G.sfx, 0.002, 0.9 * v, 0.3, 0.1); o.connect(og);
  for (let i = 0; i < 9; i++) { const tt = t + 0.05 + G.nr() * 0.45; bellTiny(G, tt, 0.25 * v); }
}
function bellTiny(G, t, v) { const f = 2200 + G.nr() * 3000, o = osc(G, t, 'sine', f, 0.12), g = vca(G, t, pan(G, G.sfx, G.nr() * 1.6 - 0.8), 0.001, 0.12 * v, 0.06, 0.03); o.connect(g); send(G, g, 0.4); }
// a price cut: a falling tone that lands on the bass note m, so the cut moves the harmony
function bwomp(G, t, v = 1, m = 42) {
  const o = osc(G, t, 'sawtooth', mtof(m + 19), 0.4); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.3);
  const lp = filt(G, 'lowpass', 1400, 4); lp.frequency.exponentialRampToValueAtTime(260, t + 0.3);
  const g = vca(G, t, G.sfx, 0.005, 0.28 * v, 0.22, 0.08); o.connect(lp); lp.connect(g); send(G, g, 0.3);
}
function rewindFx(G, t, dur, v = 1) {
  const o = osc(G, t, 'square', 500, dur), lfo = osc(G, t, 'sawtooth', 13, dur), lg = G.ac.createGain();
  lg.gain.value = 260; lfo.connect(lg); lg.connect(o.frequency);
  o.frequency.exponentialRampToValueAtTime(2200, t + dur);
  lfo.frequency.linearRampToValueAtTime(26, t + dur);
  const bp = filt(G, 'bandpass', 1400, 2), g = G.ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07 * v, t + 0.05); g.gain.linearRampToValueAtTime(0.1 * v, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(bp); bp.connect(g); g.connect(G.sfx);
  // reverse swell into the drop
  const n = nsrc(G, t, dur), hp = filt(G, 'highpass', 3000), ng = G.ac.createGain();
  ng.gain.setValueAtTime(0, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.01); ng.gain.exponentialRampToValueAtTime(0.35 * v, t + dur - 0.01); ng.gain.linearRampToValueAtTime(0, t + dur);
  n.connect(hp); hp.connect(ng); ng.connect(G.sfx); send(G, ng, 0.3);
}
// the big hits: a low slam and a darkening bloom on the impacts' own bus
function impact(G, t, v = 1) {
  const o = osc(G, t, 'sine', 90, 1.4); o.frequency.exponentialRampToValueAtTime(38, t + 1.0);
  const g = vca(G, t, G.hits, 0.004, 0.42 * v, 0.9, 0.3); o.connect(g);
  const n = nsrc(G, t, 1.2), lp = filt(G, 'lowpass', 7000); lp.frequency.exponentialRampToValueAtTime(180, t + 0.9);
  const ng = vca(G, t, G.hits, 0.002, 0.45 * v, 0.7, 0.3); n.connect(lp); lp.connect(ng); send(G, ng, 0.5);
}
function riser(G, t, dur, v = 1) {
  const n = nsrc(G, t, dur), bp = filt(G, 'bandpass', 300, 1.5); bp.frequency.exponentialRampToValueAtTime(7000, t + dur);
  const g = G.ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
  n.connect(bp); bp.connect(g); g.connect(G.sfx); send(G, g, 0.3);
  const o = osc(G, t, 'sawtooth', 220, dur), lp = filt(G, 'lowpass', 600); o.frequency.exponentialRampToValueAtTime(880, t + dur); lp.frequency.exponentialRampToValueAtTime(4000, t + dur);
  const og = G.ac.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.05 * v, t + dur); og.gain.linearRampToValueAtTime(0, t + dur + 0.02);
  o.connect(lp); lp.connect(og); og.connect(G.music);
}
function paper(G, t, v = 1, p = 0) {
  const n = nsrc(G, t, 0.35), f = filt(G, 'bandpass', 2400, 0.7), g = G.ac.createGain();
  f.frequency.setValueAtTime(1600, t); f.frequency.linearRampToValueAtTime(3600, t + 0.2);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.28 * v, t + 0.07); g.gain.linearRampToValueAtTime(0, t + 0.3);
  n.connect(f); f.connect(g); g.connect(pan(G, G.sfx, p));
}
function stampFx(G, t, v = 1) {
  const o = osc(G, t, 'sine', 130, 0.25); o.frequency.exponentialRampToValueAtTime(48, t + 0.14);
  const g = vca(G, t, G.sfx, 0.001, 0.8 * v, 0.12, 0.05); o.connect(g);
  const n = nsrc(G, t, 0.12), f = filt(G, 'lowpass', 1800), ng = vca(G, t, G.sfx, 0.001, 0.5 * v, 0.06, 0.03);
  n.connect(f); f.connect(ng); send(G, ng, 0.2);
  click(G, t + 0.004, 0.4 * v, 1200);
}
function shutter(G, t, v = 1) {
  click(G, t, v, 3200);
  const n = nsrc(G, t + 0.012, 0.06), f = filt(G, 'bandpass', 3000, 1.2), g = vca(G, t + 0.012, G.sfx, 0.001, 0.5 * v, 0.03, 0.02); n.connect(f); f.connect(g);
  click(G, t + 0.07, 0.8 * v, 2400);
  const o = osc(G, t, 'sine', 6000, 0.5); o.frequency.exponentialRampToValueAtTime(2800, t + 0.4);
  const og = vca(G, t, G.sfx, 0.01, 0.025 * v, 0.3, 0.1); o.connect(og);
}
function ping(G, t, m, v = 1, p = 0) {
  [[m, 1], [m + 7, 0.6]].forEach(([mm, a], i) => {
    const f = mtof(mm), tt = t + i * 0.09, o = osc(G, tt, 'sine', f, 0.7), mod = osc(G, tt, 'sine', f * 2, 0.7), mg = G.ac.createGain();
    mg.gain.setValueAtTime(f * 0.8, tt); mg.gain.exponentialRampToValueAtTime(1, tt + 0.3); mod.connect(mg); mg.connect(o.frequency);
    const g = vca(G, tt, pan(G, G.sfx, p), 0.002, 0.16 * v * a, 0.4, 0.1); o.connect(g); send(G, g, 0.3, 0.2);
  });
}
function blip(G, t, m, v = 1) { const o = osc(G, t, 'sine', mtof(m), 0.12), g = vca(G, t, G.sfx, 0.002, 0.16 * v, 0.07, 0.03); o.connect(g); send(G, g, 0.2); }
function jingle(G, t, v = 1) {
  for (let i = 0; i < 14; i++) {
    const tt = t + G.nr() * 0.5 * (i < 7 ? 0.5 : 1), f = 3000 + G.nr() * 4200;
    [[1, 1], [1.5, 0.45]].forEach(([k, a]) => { const o = osc(G, tt, 'sine', f * k, 0.25), g = vca(G, tt, pan(G, G.sfx, 0.35 + G.nr() * 0.3), 0.001, 0.05 * v * a, 0.12, 0.05); o.connect(g); send(G, g, 0.35); });
  }
}
function rush(G, t, dur, v = 1) {
  const n = nsrc(G, t, dur), bp = filt(G, 'bandpass', 900, 0.45), lp = filt(G, 'lowpass', 3200), g = G.ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 * v, t + 0.6); g.gain.setValueAtTime(0.09 * v, t + dur - 0.6); g.gain.linearRampToValueAtTime(0, t + dur);
  n.connect(bp); bp.connect(lp); lp.connect(g); g.connect(pan(G, G.sfx, -0.3));
}
function swift(G, t, v = 1, p = 0) {
  for (let k = 0; k < 3; k++) {
    const tt = t + k * 0.09, o = osc(G, tt, 'sine', 4300 - k * 180, 0.14), fm = osc(G, tt, 'sine', 46, 0.14), fg = G.ac.createGain();
    fg.gain.value = 520; fm.connect(fg); fg.connect(o.frequency);
    const g = vca(G, tt, pan(G, G.sfx, p), 0.01, 0.045 * v, 0.07, 0.03); o.connect(g); send(G, g, 0.3);
  }
}
function clink(G, t, v = 1) {
  [[3150, 1], [4620, 0.7], [6980, 0.45], [2240, 0.5]].forEach(([f, a]) => { const o = osc(G, t, 'sine', f, 0.4), g = vca(G, t, pan(G, G.sfx, 0.4), 0.0008, 0.22 * v * a, 0.22, 0.05); o.connect(g); send(G, g, 0.35); });
  click(G, t, 0.5 * v, 5200);
}
function buzz(G, t, dur, v = 1) {
  const o = osc(G, t, 'square', 150, dur), lp = filt(G, 'lowpass', 400), trem = osc(G, t, 'square', 30, dur), tg = G.ac.createGain();
  tg.gain.value = 0.5; const g = G.ac.createGain(); g.gain.value = 0.5; trem.connect(tg); tg.connect(g.gain);
  const e = vca(G, t, G.sfx, 0.005, 0.12 * v, 0.05, 0.02, dur - 0.05);
  o.connect(lp); lp.connect(g); g.connect(e);
}
function motif(G, t, v = 1, oct = 0) {
  [[81, 0], [86, 0.3], [90, 0.6], [93, 0.9]].forEach(([m, dt], i) => { bell(G, t + dt, m + oct, v * (i === 3 ? 1.2 : 1), (i - 1.5) * 0.25, i === 3 ? 2.6 : 1.3); epiano(G, t + dt, m - 12 + oct, 0.5, 0.5 * v, (i - 1.5) * 0.2); });
}
function sparkle(G, t, dur, v = 1) { for (let i = 0; i < 12; i++) bellTiny(G, t + G.nr() * dur, 0.6 * v); }


// ------------------------------------------------------------------ score
// Chords per bar (bar = 2.4 s). Voicings in MIDI numbers.
const CH = {
  Bm: { root: 35, pad: [59, 62, 66, 71], arp: [71, 74, 78, 83] },
  G: { root: 31, pad: [55, 59, 62, 67], arp: [67, 71, 74, 79] },
  Em: { root: 28, pad: [55, 59, 64, 67], arp: [67, 71, 76, 79] },
  Fs: { root: 30, pad: [54, 58, 61, 66], arp: [66, 70, 73, 78] },
  D: { root: 38, pad: [57, 62, 66, 69], arp: [69, 74, 78, 81] },
  A: { root: 33, pad: [57, 61, 64, 69], arp: [69, 73, 76, 81] },
  Asus: { root: 33, pad: [57, 62, 64, 69], arp: [69, 74, 76, 81] },
  BmA: { root: 33, pad: [57, 62, 66, 69], arp: [69, 74, 78, 81] },
};
// when the chart's clock passes each month, when each price cut lands, and when the
// months run back during the rewind: the picture's own timings, so the ticks and the
// cuts land on it
const crossing = (k, a, b, up) => { let lo = a, hi = b; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (up ? monthsAt(mid) < k : monthsAt(mid) > k) lo = mid; else hi = mid; } return hi; };
function monthTimes() { const out = []; for (let k = 1; k <= 12; k++) out.push(crossing(k, T.months0, T.months1, true)); return out; }
function cutTimes() { return STEPS.slice(1).map(([mm]) => crossing(mm, T.months0, T.months1, true)); }
function rewindTimes() { const out = []; for (let k = 11; k >= 0; k--) out.push(crossing(k, T.rewind, T.noino, false)); return out; }
function buildScore() {
  const ev = [], at = (t, fn) => ev.push([t, fn]);
  const b = BEAT, s16 = BEAT / 4, s32 = BEAT / 8;
  // One stretch of the band from t0, written like a drum machine: one character per
  // sixteenth, '.' a rest. The rests are where the sound effects speak.
  //   kick  X hard, x, o soft · clap x, o soft · hat x closed, o open, h soft · shk shaker
  //   bass  x root, o octave, 5 fifth, '-' holds the note before
  //   arp   a b c d the chord's arpeggio, A B C D an octave up · keys x an e-piano chord,
  //         held to the next one
  // The pad holds the chord for the whole stretch: the rhythm rests, the harmony never stops.
  // cresc: [from, to] grows the band's velocity across the stretch, for the builds.
  const band = (t0, chord, p) => {
    const c = CH[chord], n = p.steps || 16, br = p.bright === undefined ? 0.6 : p.bright;
    const vel = i => (p.v || 1) * (p.cresc ? p.cresc[0] + (p.cresc[1] - p.cresc[0]) * i / Math.max(1, n - 1) : 1);
    const each = (s, fn) => { if (s) for (let i = 0; i < s.length; i++) if (s[i] !== '.' && s[i] !== '-') fn(i, s[i], t0 + i * s16, vel(i)); };
    const held = (s, i, sym) => { let j = i + 1; while (j < s.length && s[j] === sym) j++; return (j - i) * s16; };
    // a bass note fills the rest after it (two sixteenths at most, and never past the end of
    // the stretch) unless '-' holds it longer
    const blen = (s, i) => { const d = held(s, i, '-'); return d > s16 ? d : (i + 1 < s.length && s[i + 1] !== '.') || i + 1 >= n ? s16 : 2 * s16; };
    each(p.kick, (i, ch, tt, V) => at(tt, (G, w) => kick(G, w, V * (ch === 'X' ? 1.1 : ch === 'o' ? 0.6 : 0.95))));
    each(p.clap, (i, ch, tt, V) => at(tt, (G, w) => clap(G, w, V * (ch === 'o' ? 0.5 : 0.8))));
    each(p.snr, (i, ch, tt, V) => at(tt, (G, w) => snare(G, w, V * (ch === 'o' ? 0.3 : 0.5))));
    each(p.hat, (i, ch, tt, V) => at(tt, (G, w) => hat(G, w, V * (ch === 'h' ? 0.5 : 0.8), ch === 'o')));
    each(p.shk, (i, ch, tt, V) => at(tt, (G, w) => shaker(G, w, V * (i % 2 ? 0.7 : 1))));
    each(p.bass, (i, ch, tt, V) => {
      const m = c.root + (ch === 'o' ? 12 : ch === '5' ? 7 : 0), d = blen(p.bass, i);
      at(tt, (G, w) => bass(G, w, m, d > 2 * s16 ? d - 0.06 : d * 0.88, V * (ch === 'o' ? 0.7 : 0.9)));
    });
    each(p.arp, (i, ch, tt, V) => {
      const m = c.arp['abcd'.indexOf(ch.toLowerCase())] + (ch < 'a' ? 12 : 0);
      at(tt, (G, w) => pluck(G, w, m, V * (p.av || 1) * (i % 4 ? 0.7 : 1), ((i % 2) - 0.5) * 0.9, br));
    });
    each(p.keys, (i, ch, tt, V) => {
      const d = held(p.keys, i, '.') * 0.92;
      at(tt, (G, w) => c.pad.forEach((m, j) => epiano(G, w + j * 0.012, m, d, 0.7 * V * (p.kv || 1), (j - 1.5) * 0.3)));
    });
    if (p.pad !== false) at(t0, (G, w) => pad(G, w, c.pad, n * s16 - 0.1, p.pv || 1, p.bright === undefined ? 0.7 : p.bright, p.patt));
  };
  const stab = (t, notes, v) => at(t, (G, w) => notes.forEach((m, j) => pluck(G, w + j * 0.006, m, v, (j - 1.5) * 0.4, 0.9)));
  const roll = (t0, n, st, v0, v1) => { for (let k = 0; k < n; k++) at(t0 + k * st, (G, w) => snare(G, w, v0 + (v1 - v0) * k / Math.max(1, n - 1))); };

  // ---------------------------------------------------------- A · hook 0–3.6
  // "Hai casa a Tivoli?": the band speaks the three words with the thumps
  at(0, (G, w) => { kick(G, w, 1.1); thump(G, w, 1.1); crash(G, w, 0.45); sub(G, w, 35, 1.8, 0.8); whoosh(G, w, 0.3, 0.5, 600, 3000, -0.9, -0.2); });
  stab(0, [59, 62, 66, 71], 1);
  at(T.casa, (G, w) => { kick(G, w, 0.75); thump(G, w, 0.9); });
  stab(T.casa, [62, 66, 71, 74], 0.8);
  at(T.tivoli, (G, w) => { kick(G, w, 1); thump(G, w, 1.1); bell(G, w, 83, 0.8, 0.2, 1.4); });
  stab(T.tivoli, [66, 71, 74, 78], 1);
  at(0.2, (G, w) => scratch(G, w, 1.0, 1));                         // the pen draws the house
  // the punch and the question land on the kick; the bass walks under the drawing
  band(0, 'Bm', { pv: 1.1, bright: 0.5, kick: '........o...x...', bass: '......x.o.x.o.x.' });
  at(T.punch, (G, w) => clack(G, w, 0.9));
  at(T.punch + 0.04, (G, w) => whoosh(G, w, 0.35, 0.5, 900, 2600, 0, 0.1));
  at(T.q2, (G, w) => thump(G, w, 0.9));
  stab(T.q2, [62, 66, 71, 74], 0.9);
  // "Sai quanto vale davvero?": the reels spin, and their ticks are the hi-hats; the band
  // goes half-time under them and climbs to the promise
  for (let tt = T.q2 + 0.1; tt < T.promise - 0.05; tt += s32) { const k = (tt - T.q2) / (T.promise - T.q2); at(tt, (G, w) => tick(G, w, 1.1 + 0.6 * k, 2200 + 800 * k)); }
  stab(2.4, [67, 71, 74, 79], 1);
  at(2.4, (G, w) => { sub(G, w, 31, 1.1, 0.7); riser(G, w, 1.2, 0.6); });
  band(2.4, 'G', { steps: 8, pv: 0.9, kick: 'o...o...', bass: 'x.o.x.o.' });

  // ---------------------------------------------------------- B · the trap
  // "Ti hanno promesso di più?": every promise pumps the tag, and the pumps are the pulse,
  // a bass note and a kick on each, so the band speeds up with them; each pump's chirp
  // sings the bass note two octaves up
  at(T.promise, (G, w) => { clack(G, w, 1); kick(G, w, 0.9); bass(G, w, 28, 0.3, 0.8); });
  stab(T.promise, [64, 67, 71, 76], 0.7);
  band(T.promise, 'Em', { steps: 8, pv: 0.8, bright: 0.2, patt: 0.12 });
  const pumpM = [40, 42, 43, 42, 46, 49, 52, 54];
  T.pumps.forEach((tp, k) => at(tp - 0.05, (G, w) => {
    pump(G, w, 0.9, k, pumpM[k] + 24); bass(G, w + 0.05, pumpM[k], 0.2, 0.7);
    if (tp !== T.gonfiata) kick(G, w + 0.05, 0.4 + 0.05 * k);
  }));
  at(T.gonfiata, (G, w) => { kick(G, w, 0.9); thump(G, w, 0.8); });
  band(T.gonfiata, 'Fs', { steps: 8, pv: 0.8, bright: 0.25, patt: 0.12 });
  // after the last pump the band holds its breath on F♯ while the rubber stretches
  at(5.1, (G, w) => squeak(G, w, 0.88, 1));
  at(5.2, (G, w) => riser(G, w, 0.8, 0.5));
  at(T.pop, (G, w) => { pop(G, w, 0.85); impact(G, w, 0.7); });
  // the chart: a heartbeat under "Mesi di attesa…", the clock ticking the months. Each
  // price cut steps the harmony down (B, A, G, E, F♯), its falling tone landing on the new
  // bass note an octave up, and the heartbeat takes the cuts' faster pace
  const cuts = cutTimes(), lam = [[T.chart, 'Bm'], [cuts[0], 'BmA'], [cuts[1], 'G'], [cuts[2], 'Em'], [cuts[3], 'Fs']];
  lam.forEach(([tt, ch], i) => {
    const end = i < 4 ? lam[i + 1][0] : T.rewind, first = i === 0, last = i === 4;
    // legato: each bass note holds until the cut that moves it
    at(tt, (G, w) => { pad(G, w, CH[ch].pad, end - tt, 0.75, 0.3, first ? 0.3 : 0.03, last ? 0.6 : 0.25); bass(G, w, CH[ch].root, end - tt + (last ? 0.25 : -0.01), 0.8); });
  });
  cuts.forEach((tt, i) => at(tt, (G, w) => { bwomp(G, w, 1.2, CH[lam[i + 1][1]].root + 12); kick(G, w, 0.55); }));
  [T.chart, T.chart + b, 8.7].forEach(tt => { at(tt, (G, w) => kick(G, w, 0.6)); at(tt + 0.16, (G, w) => kick(G, w, 0.35)); });
  monthTimes().forEach((tt, i) => at(tt, (G, w) => tick(G, w, 1, i % 2 ? 1500 : 2100)));
  // the rewind: the months run back, the tape with them; F♯ swells in reverse into "Noi no."
  // (both stop a few milliseconds short of the downbeat, so the hit lands on a clean attack)
  at(T.rewind, (G, w) => { rewindFx(G, w, T.noino - T.rewind - 0.03, 1); rewindPad(G, w, CH.Fs.pad, T.noino - T.rewind - 0.015, 1.6); });
  rewindTimes().forEach((tt, i) => at(tt, (G, w) => tick(G, w, 0.5 + 0.04 * i, i % 2 ? 1500 : 2100)));

  // ---------------------------------------------------------- C · Noi no. and the method
  at(T.noino, (G, w) => { impact(G, w, 1); crash(G, w, 0.9); kick(G, w, 1); sub(G, w, 38, 1.0, 0.9); CH.D.pad.forEach((m, j) => epiano(G, w + j * 0.015, m, 1.0, 0.8, (j - 1.5) * 0.3)); });
  at(T.noino + s16, (G, w) => { kick(G, w, 0.8); bass(G, w, 38, 0.4, 0.9); });           // no.
  band(T.noino, 'D', { steps: 8, pv: 1.1, bright: 0.8 });
  at(T.noino + b, (G, w) => bass(G, w, 38, 0.3, 0.8));
  at(T.data - 2 * s16, (G, w) => { bass(G, w, 50, 0.26, 0.7); kick(G, w + s16, 0.5); });          // pickup into the data
  at(10.2, (G, w) => riser(G, w, 0.6, 0.35));
  // "Partiamo dai dati reali di Tivoli.": the data points play the melody, a wooden note
  // each; the band keeps to kick and bass, and a shaker doubles the pace with the points
  const dotM = [74, 76, 78, 81, 83, 86, 88, 90, 93];
  T.dots.forEach((tt, i) => at(tt, (G, w) => { marimba(G, w, dotM[i], 0.9, (DOTS[i][0] - CX) / 600); blip(G, w, dotM[i] + 12, 0.35); }));
  band(T.data, 'D', { steps: 8, pv: 0.9, bright: 0.45, kick: 'x...x...', bass: 'x.o.x.o.', shk: '....xxxx' });
  // the crosshair weighs them: the band stops for the sweep and the lock, lands with it on
  // "Prezzo giusto." and answers "Da subito."; the arpeggio comes in
  band(12.0, 'A', {
    kick: 'x...x...X..ox...',
    clap: '............x...',
    hat: '..........x...x.',
    shk: 'xxxx............',
    bass: 'x.o.x---x.o.x.o.',
    arp: '........acbdacbd',
    keys: '........x.......' });
  at(T.lock - 0.62, (G, w) => whoosh(G, w, 0.6, 0.45, 500, 2400, -0.7, 0.2));
  at(T.lock, (G, w) => { clack(G, w, 1.25); click(G, w + 0.06, 0.45, 1800); });
  at(T.giusto, (G, w) => { crash(G, w, 0.5); bell(G, w, 88, 0.9, 0, 1.2); bell(G, w + 0.1, 95, 0.7, 0.2, 1.4); thump(G, w, 0.7); });
  stab(T.giusto, [69, 73, 76, 81], 0.9);
  stab(13.65, [73, 76, 81, 85], 0.8);
  // house → window → staging: the props land in eighths and play the arpeggio on their
  // wooden notes, the kick hits with each one; the drums rest for the flash, the bass holds
  band(T.house, 'Bm', { kick: 'x...x.x.x.x...o.', bass: 'x.o.x.o.x.o---o.' });
  at(T.house + 0.3, (G, w) => whoosh(G, w, 0.45, 0.6, 400, 5000, 0, 0));
  T.props.forEach((tt, i) => at(tt, (G, w) => { thump(G, w, 0.55); marimba(G, w + 0.02, [62, 66, 69, 74][i], 0.6, 0); }));
  at(T.props[1] + 0.25, (G, w) => click(G, w, 0.6, 1600));
  at(T.flash, (G, w) => shutter(G, w, 1));
  // "Mutuo, notaio, pratiche?": the three stamps are the backbeat, kick and bass on each;
  // the pen writes between them over the held bass; "Ci pensiamo noi." lands on the second
  band(T.docs, 'G', { bright: 0.65, kick: 'x...x...X...x...', bass: 'x---x---x---x.o.', hat: '.............hxx', keys: 'x.......x.......' });
  DOCS.forEach((d, i) => { at(T.docs + i * 0.09, (G, w) => paper(G, w, 0.9, (d.x - CX) / 500)); at(T.stamps[i] - 0.42, (G, w) => scratch(G, w, 0.32, 0.9)); at(T.stamps[i], (G, w) => stampFx(G, w, 1)); });
  // "Sui migliori portali.": the notifications ring on beats 2, 3 and 4 and are the melody;
  // the hi-hats answer them on the off-beats
  band(T.phone, 'D', { v: 0.95, bright: 0.7, kick: 'x...x...x...x...', hat: '..x...x...x...x.', bass: 'x.o.x.o.x.o.x.o.' });
  at(T.phone, (G, w) => whoosh(G, w, 0.4, 0.55, 300, 2400, 0, 0));
  T.pings.forEach((tt, i) => at(tt, (G, w) => ping(G, w, [81, 85, 88][i], 1, [-0.4, 0.4, -0.4][i])));
  // "Report costanti.": the figures run up in blips over kick and bass. "Trasparenza totale.":
  // the band builds; under the buzz of the accepted offer only the hi-hats run on, doubling,
  // and a snare roll throws it into SOLD
  band(T.report, 'A', { steps: 8, bright: 0.8, kick: 'x...x...', hat: '..x...x.', bass: 'x.o.x.o.' });
  band(T.trasp, 'A', { steps: 4, bright: 0.95, cresc: [0.85, 1.25], pad: false, kick: 'x.x.', snr: 'oooo', hat: 'xxxx', bass: 'xoxo', arp: 'acbd' });
  at(T.report, (G, w) => whoosh(G, w, 0.3, 0.4, 900, 3200, 0.6, -0.6));
  [0, 1, 2, 3, 4, 5].forEach(i => at(T.report + 0.3 + i * 0.11, (G, w) => blip(G, w, 74 + [0, 2, 4, 7, 9, 12][i], 1.2)));
  at(T.trasp, (G, w) => riser(G, w, 1.15, 1));
  at(T.accepted, (G, w) => { pad(G, w, CH.Asus.pad.map(m => m + 12), 0.5, 0.8, 0.9, 0.1); buzz(G, w, 0.3, 1.4); bell(G, w, 86, 0.8, -0.2, 1); bell(G, w + 0.08, 90, 0.8, 0, 1); bell(G, w + 0.16, 93, 0.9, 0.2, 1.4); });
  for (let k = 0; k < 4; k++) at(T.accepted + k * s32, (G, w) => hat(G, w, 0.8 + 0.1 * k));
  roll(T.accepted + 0.3, 4, s32, 0.8, 1.1);

  // ---------------------------------------------------------- D · sold, Tivoli, the office
  // SOLD: the band's full groove; the keys jingle in a gap of the hi-hats, and the
  // arpeggio comes in as the camera pulls back over Tivoli
  at(T.sold, (G, w) => { impact(G, w, 1.1); crash(G, w, 1); kick(G, w, 1); sub(G, w, 38, 2.2, 0.9); sparkle(G, w + 0.05, 1.2, 1); });
  stab(T.sold, [66, 69, 74, 78], 1);
  at(T.sold + 0.1, (G, w) => stampFx(G, w, 0.9));
  at(T.keys + 0.24, (G, w) => { clink(G, w, 1); jingle(G, w + 0.04, 0.9); });
  band(T.sold, 'D', {
    bright: 0.9,
    kick: '....x...x...x...',
    clap: '....x.......x...',
    hat: '..x.......x...o.',
    shk: '........xxxxxxxx',
    bass: 'x.o.x.o.x.o.x.o.',
    arp: '........acbdACBD',
    keys: 'x.......x.......' });
  at(T.pull, (G, w) => whoosh(G, w, 1.2, 0.7, 200, 1800, 0.5, -0.5));
  at(T.pull + 0.3, (G, w) => rush(G, w, T.office + 0.5 - T.pull - 0.3, 0.9));
  [25.8, 26.25, 26.9, 27.35, 27.85, 28.3].forEach((tt, i) => at(tt, (G, w) => swift(G, w, 1, [-0.6, 0.5, -0.2, 0.7, -0.5, 0.3][i])));
  // the view and the stats: each counter rolls on a beat and rings a bell after it; the
  // arpeggio leaves room for the bells, the hats for the counters
  band(26.4, 'G', {
    bright: 0.85,
    kick: 'x...x...x...x...',
    clap: '....x.......x...',
    hat: '............x.o.',
    shk: '............xxxx',
    bass: 'x.o.x.o.x.o.x.o.',
    arp: 'acb.acb.acb.acbd',
    keys: 'x...............' });
  T.stats.forEach((tt, i) => { for (let k = 0; k < 6; k++) at(tt + k * 0.06, (G, w) => tick(G, w, 0.8, 2600)); at(tt + 0.38, (G, w) => bell(G, w, [86, 90, 93][i], 0.8, (i - 1) * 0.4, 1, G.sfx)); });
  // the street and the office, close and warm: the band halves its pace, and the shop bell
  // rings as the door opens, in a rest of the arpeggio
  band(T.office, 'Em', { steps: 8, bright: 0.6, av: 0.7, kick: 'x.......', bass: 'x-------', arp: 'a.c.b...', keys: 'x.......' });
  band(30.0, 'Asus', { steps: 8, bright: 0.7, av: 0.7, kick: 'x.......', bass: 'x-------', arp: '..c.b.d.', keys: 'x.......' });
  at(T.office, (G, w) => whoosh(G, w, 0.8, 0.5, 250, 1500, 0, 0));
  at(T.office + 0.85, (G, w) => { bell(G, w, 93, 0.5, 0.3, 1.8, G.sfx); bell(G, w + 0.22, 88, 0.5, 0.3, 2, G.sfx); });
  at(T.office + 0.9, (G, w) => whoosh(G, w, 0.4, 0.45, 500, 3000, -0.3, 0.3));
  at(T.push, (G, w) => whoosh(G, w, 0.9, 0.6, 200, 4000, 0, 0));

  // ---------------------------------------------------------- E · the call to action
  // "Quanto vale la tua casa?": the reels spin again and their ticks are the hats; the band
  // starts half-time, doubles, and rolls into GRATIS
  at(T.cta, (G, w) => { sub(G, w, 31, 2.2, 0.8); whoosh(G, w, 0.5, 0.5, 400, 2000, 0, 0); });
  for (let tt = T.cta + 0.35; tt < T.gratis - 0.05; tt += s32) { const k = (tt - T.cta) / (T.gratis - T.cta); at(tt, (G, w) => tick(G, w, 0.8 + 0.6 * k, 2200 + 900 * k)); }
  band(T.cta, 'G', { bright: 0.5, kick: 'x.......x...x...', bass: 'x.o.x.o.x.o.x.o.', keys: 'x.......x.......' });
  at(32.4, (G, w) => riser(G, w, T.gratis - 32.4 - 0.03, 0.8));
  roll(33.0, 8, s32, 0.25, 0.85);
  // GRATIS: the reels land, the bells ring the price, then the full groove; a hit on
  // "Senza impegno.", a rest for the tap, and a pickup into the logo
  at(T.gratis, (G, w) => { impact(G, w, 0.8); crash(G, w, 0.8); for (let i = 0; i < 6; i++) clack(G, w + i * 0.07, 0.9); [86, 90, 93, 98].forEach((m, i) => bell(G, w + 0.45 + i * 0.07, m, 0.7, (i - 1.5) * 0.3, 1.2)); sparkle(G, w + 0.45, 0.8, 0.8); });
  stab(T.gratis, [69, 73, 76, 81], 1);
  band(T.gratis, 'A', {
    bright: 0.9,
    kick: 'X...x...X.......',
    clap: '....x...........',
    hat: '..x...x...x.....',
    shk: '....xxxxxxxx....',
    bass: 'x.o.x.o.x.o---o.',
    arp: '.....bcd.acb....',
    keys: 'x.......x.......' });
  at(T.senza, (G, w) => { thump(G, w, 0.6); blip(G, w, 86, 0.6); });
  at(T.tap, (G, w) => { click(G, w, 0.9, 1300); marimba(G, w + 0.02, 81, 0.7, 0.3); });
  roll(T.tap + s32, 7, s32, 0.3, 0.9);
  // the logo: the last chord and the sonic logo, the name writing itself; a long ring out
  at(T.logo, (G, w) => {
    impact(G, w, 0.9); crash(G, w, 0.9); kick(G, w, 1);
    pad(G, w, CH.D.pad.concat([74]), 3.2, 1.1, 0.8); sub(G, w, 38, 3.0, 0.9); bass(G, w, 38, 2.4, 0.8);
    CH.D.pad.forEach((m, j) => epiano(G, w + j * 0.02, m, 3.0, 0.8, (j - 1.5) * 0.3));
    motif(G, w, 1.1);
  });
  at(T.logo + 0.36, (G, w) => scratch(G, w, 0.7, 0.9));
  at(T.logo + 1.95, (G, w) => sparkle(G, w, 0.8, 0.6));
  at(38.4, (G, w) => bell(G, w, 93, 0.35, 0.3, 2.4));
  ev.sort((p, q) => p[0] - q[0]);
  return ev;
}


// review and export hooks (export-mp4.js renders every frame and the score through these)
window.__renderAt = t => { render(t); };
window.__fx = FXQ;
window.__dur = DUR;
// offline score: film time `from` lands AUDIO_LEAD seconds into the buffer; setup
// events (the string section, which plays the whole film) run wherever it starts
const AUDIO_LEAD = 0.05;
window.__audioLead = AUDIO_LEAD;
window.__renderAudio = async (from = 0, to = DUR, sr = 44100) => {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const len = to - from + 0.5, ac = new OAC(2, Math.ceil(sr * len), sr);
  const G = audioGraph(ac, AUDIO_LEAD - from), ev = buildScore().filter(e => (e[2] || e[0] >= from - 0.01) && e[0] < to);
  let i = 0;
  const feed = until => { while (i < ev.length && ev[i][0] - from + AUDIO_LEAD < until) { const [t, fn] = ev[i++]; fn(G, Math.max(ac.currentTime + 0.003, t - from + AUDIO_LEAD)); } };
  feed(1);
  for (let tt = 0.5; tt < len - 0.1; tt += 0.5) ac.suspend(tt).then(() => { feed(tt + 1); ac.resume(); });
  return ac.startRendering();
};
