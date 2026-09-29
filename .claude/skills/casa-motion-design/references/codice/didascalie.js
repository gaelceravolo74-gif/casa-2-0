// Estratto da masterpiece/index.html: le didascalie a tempo (CAPS, slam/rise, parole chiave).

// =============================================================== captions
// Short lines, big type, on the beat. {braces} mark the key words.
const THEME = {
  dark: { col: C.white, hi: C.white, hiText: C.cobalt, box: C.white },
  night: { col: C.white, hi: C.onDark, hiText: [17, 33, 51], box: C.onDark },
  paper: { col: C.ink, hi: C.primary, hiText: C.white, box: C.primary },
};
const CAPS = [
  { t0: 0, t1: 1.74, y: 420, size: 128, w: 17, lines: ['Hai casa', 'a {Tivoli?}'], at: [0, 0.3, 0.6, 0.6], fx: 'slam', hs: 'under', th: 'dark' },
  { t0: 1.8, t1: 3.5, y: 410, size: 108, w: 16, lines: ['Sai quanto vale', '{davvero?}'], at: [1.8, 1.87, 1.94, 2.1], fx: 'rise', hs: 'box', th: 'dark' },
  { t0: 3.6, t1: 4.72, y: 410, size: 100, w: 16, lines: ['Ti hanno promesso', '{di più?}'], fx: 'rise', hs: 'box', th: 'dark' },
  { t0: 4.8, t1: 5.95, y: 420, size: 138, w: 18, lines: ['Stima', '{gonfiata.}'], at: [4.8, 5.0], fx: 'slam', hs: 'inflate', th: 'night' },
  { t0: 6.32, t1: 7.72, y: 410, size: 104, w: 16, lines: ['Mesi di attesa…'], fx: 'rise', th: 'night' },
  { t0: 7.8, t1: 8.98, y: 410, size: 116, w: 17, lines: ['Poi, {ribassi.}'], at: [7.8, 8.0], fx: 'slam', hs: 'box', th: 'night' },
  { t0: 9.6, t1: 10.62, y: 1100, size: 250, w: 19, lines: ['Noi no.'], at: [9.6, 9.76], fx: 'slam', th: 'paper' },
  { t0: 10.75, t1: 13.02, y: 410, size: 96, w: 16, lines: ['Partiamo dai', 'dati {reali} di Tivoli.'], fx: 'rise', hs: 'box', th: 'paper' },
  { t0: 13.2, t1: 14.36, y: 410, size: 112, w: 17, lines: ['Prezzo {giusto.}', 'Da subito.'], at: [13.2, 13.3, 13.62, 13.72], fx: 'slam', hs: 'box', th: 'paper' },
  { t0: 14.55, t1: 16.1, y: 400, size: 100, w: 16, lines: ['Home staging', 'e {foto professionali.}'], at: [14.55, 14.63, 15.6, 15.68, 15.76], fx: 'rise', hs: 'box', th: 'paper', bg: 1 },
  { t0: 16.8, t1: 17.95, y: 410, size: 104, w: 16, lines: ['Mutuo, notaio,', 'pratiche?'], fx: 'rise', th: 'paper' },
  { t0: 18.0, t1: 19.1, y: 420, size: 116, w: 17, lines: ['Ci pensiamo', '{noi.}'], at: [18.0, 18.08, 18.3], fx: 'slam', hs: 'box', th: 'paper' },
  { t0: 19.2, t1: 21.5, y: 420, size: 112, w: 17, lines: ['Sui migliori', '{portali.}'], at: [19.2, 19.28, 19.45], fx: 'rise', hs: 'box', th: 'paper' },
  { t0: 21.6, t1: 23.9, y: 410, size: 104, w: 16, lines: ['Report {costanti.}', 'Trasparenza totale.'], at: [21.6, 21.7, 22.8, 22.9], fx: 'rise', hs: 'box', th: 'paper' },
  { t0: 24.05, t1: 25.28, y: 410, size: 112, w: 17, lines: ['Al {prezzo giusto.}', 'Senza stress.'], at: [24.05, 24.12, 24.2, 24.45, 24.53], fx: 'slam', hs: 'box', th: 'paper' },
  { t0: 25.36, t1: 26.32, y: 410, size: 128, w: 17, lines: ['Dal 1994', 'a {Tivoli.}'], at: [25.36, 25.44, 25.62, 25.7], fx: 'rise', hs: 'box', th: 'paper', bg: 1 },
  { t0: 29.42, t1: 30.4, y: 420, size: 112, w: 17, lines: ['Vieni a {trovarci.}'], at: [29.42, 29.5, 29.6], fx: 'rise', hs: 'box', th: 'paper' },
  { t0: 31.3, t1: 33.5, y: 410, size: 118, w: 17, lines: ['Quanto vale', '{la tua casa?}'], at: [31.3, 31.38, 31.6, 31.68, 31.76], fx: 'rise', hs: 'box', th: 'dark' },
  { t0: 33.6, t1: 34.72, y: 400, size: 98, w: 16, lines: ['Valutazione gratuita', 'in {24 ore.}'], at: [33.62, 33.72, 33.95, 34.03, 34.1], fx: 'slam', hs: 'box', th: 'dark' },
  { t0: 34.8, t1: 35.95, y: 420, size: 118, w: 17, lines: ['Senza {impegno.}'], at: [34.8, 34.92], fx: 'slam', hs: 'box', th: 'dark' },
];
function parseCap(cap) {
  if (cap.parsed) return cap.parsed;
  if (!cap.fitted) {
    cap.fitted = true;
    const widest = Math.max(...cap.lines.map(l => measure(l.replace(/[{}]/g, ''), cap.size, cap.w) + 27 * cap.size / 100 * (l.split(' ').length - 1) * 0));
    if (widest > 920) cap.size = Math.floor(cap.size * 920 / widest);
  }
  const lines = [];
  let hi = false, wi = 0;
  for (const ln of cap.lines) {
    const words = [];
    for (let tok of ln.split(' ')) {
      let open = false, close = false;
      if (tok.startsWith('{')) { open = true; tok = tok.slice(1); }
      if (tok.endsWith('}')) { close = true; tok = tok.slice(0, -1); }
      if (open) hi = true;
      const L = layoutText(tok, cap.w, 0);
      words.push({ text: tok, hi, L, w: L.width * cap.size / 100, idx: wi++ });
      if (close) hi = false;
    }
    const sp = 27 * cap.size / 100, total = words.reduce((s, w) => s + w.w, 0) + sp * (words.length - 1);
    let x = CX - total / 2;
    for (const w of words) { w.x = x; x += w.w + sp; }
    lines.push({ words, total });
  }
  cap.parsed = { lines, n: wi };
  return cap.parsed;
}
function drawCaption(c, cap, t) {
  if (t < cap.t0 - 0.01 || t > cap.t1 + 0.01) return;
  const P = parseCap(cap), th = THEME[cap.th || 'dark'], size = cap.size, lh = size * (cap.hs === 'box' ? 1.38 : 1.3);
  const outU = inv(cap.t1 - 0.2, cap.t1, t);
  if (cap.bg) {
    const ba = clamp((t - cap.t0) / 0.2) * (1 - outU);
    const wmax = Math.max(...P.lines.map(l => l.total)), hh = lh * P.lines.length;
    c.save(); c.globalAlpha = ba * 0.88; c.shadowColor = rgba(C.paper, 1); c.shadowBlur = 60 * K;
    fillRR(c, CX - wmax / 2 - 40, cap.y - size - 36, wmax + 80, hh + 30, 40, C.paper, 1); c.restore();
  }
  P.lines.forEach((ln, li) => {
    const y = cap.y + li * lh;
    for (const w of ln.words) {
      const ta = cap.at ? (cap.at[w.idx] !== undefined ? cap.at[w.idx] : cap.at[cap.at.length - 1] + 0.07 * (w.idx - cap.at.length + 1)) : cap.t0 + w.idx * 0.075;
      const u = t - ta;
      if (u < 0) continue;
      const out = E.inCubic(clamp(outU * 1.25 - w.idx * 0.04));
      let a = clamp(u / 0.07 + (ta === 0 ? 0.7 : 0)) * (1 - out), sc = 1, dy = -out * 46, clipRise = 0;
      if (cap.fx === 'slam') sc = 1 + 0.62 * Math.min(1, 140 / size) * (1 - E.outBackS(clamp(u / 0.22)));
      else if (cap.fx === 'pop') sc = E.outBack(clamp(u / 0.3));
      else { clipRise = 1 - E.outQuint(clamp(u / 0.45)); }
      if (a <= 0.003) continue;
      const cxw = w.x + w.w / 2;
      c.save();
      if (clipRise > 0) { c.beginPath(); c.rect(0, y - size * 1.25 + dy, W, size * 1.62); c.clip(); dy += clipRise * size * 1.1; }
      let col = w.hi ? th.hi : th.col;
      if (w.hi && cap.hs === 'box') {
        const bu = E.outQuint(clamp((u - 0.05) / 0.28)), pad = size * 0.16;
        c.globalAlpha = a;
        fillRR(c, w.x - pad, y - size - pad * 0.95 + dy, (w.w + 2 * pad) * bu, size + pad * 1.9 + (/[gpqy,]/.test(w.text) ? size * 0.13 : 0), size * 0.14, th.box);
        col = th.hiText;
        c.globalAlpha = 1;
      }
      if (w.hi && cap.hs === 'under') {
        const bu = E.outQuint(clamp((u - 0.12) / 0.3));
        c.globalAlpha = a; c.fillStyle = rgba(C.onDark); c.fillRect(w.x, y + size * 0.16 + dy, w.w * bu, size * 0.085); c.globalAlpha = 1;
        col = C.onDark;
      }
      // motion ghosts on the slam
      if (cap.fx === 'slam' && u < 0.12) {
        for (let g = 1; g <= 2; g++) {
          const gs = sc + g * 0.18 * (1 - u / 0.12);
          c.save(); c.translate(cxw, y - size / 2 + dy); c.scale(gs, gs); c.translate(-cxw, -(y - size / 2 + dy));
          drawText(c, w.text, cxw, y + dy, { size, w: cap.w, color: col, alpha: a * 0.18 / g, layout: w.L });
          c.restore();
        }
      }
      const inflate = w.hi && cap.hs === 'inflate';
      c.translate(cxw, y - size / 2 + dy); c.scale(sc, sc); c.translate(-cxw, -(y - size / 2 + dy));
      drawText(c, w.text, cxw, y + dy, {
        size, w: cap.w, color: col, alpha: a, layout: w.L,
        each: inflate ? (i, n) => {
          const k = clamp((t - ta - i * 0.03) / 0.5);
          const puff = 1 + 0.16 * E.outElastic(k) + 0.05 * Math.sin((t - ta) * 26 + i * 1.7) * clamp((t - ta - 0.3) * 2);
          return { s: puff, dy: -Math.sin(i / Math.max(1, n - 1) * Math.PI) * 10 * k };
        } : null,
      });
      c.restore();
    }
  });
}
function drawCaptions(c, t) { for (const cap of CAPS) drawCaption(c, cap, t); }
