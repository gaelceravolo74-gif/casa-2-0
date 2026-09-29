// Estratto da masterpiece/index.html (commit 78c592f): l'ufficio in 3D, la vetrina e la camera.
// Dipende dagli helper di base (rgba, mix, fillRR, drawText, drawLogo, glow, shadowed, ss, inv, E, T, C).

// =================================================================== S8
// Down to the street: the shopfront in Via Colsereno, through the glass door,
// into the office — cobalt wall, white logo, pine floor — and into the wall.
function stoneWall(c, x, y, w, h) {
  c.fillStyle = rgba([226, 214, 196]); c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(150,126,100,0.28)'; c.lineWidth = 2;
  c.beginPath();
  for (let yy = y, r = 0; yy < y + h; yy += 64, r++) {
    c.moveTo(x, yy); c.lineTo(x + w, yy);
    for (let xx = x + (r % 2) * 70; xx < x + w; xx += 140) { c.moveTo(xx, yy); c.lineTo(xx, yy + 64); }
  }
  c.stroke();
}
const SF_Y = 250;
function shopfront(c, t) {
  stoneWall(c, -100, 0, W + 200, 1920);
  c.save(); c.translate(0, SF_Y);
  // sign: the cobalt of the office wall with the white mark
  shadowed(c, 30, 14, 0.25, () => fillRR(c, 200, 330, 680, 250, 14, C.cobalt));
  drawLogo(c, 540 - 138 * 1.9, 360, 1.9, { roof: C.white, ink: C.white });
  // arch
  const ax = 150, aw = 780, ay = 700, ah = 1060, ar = aw / 2;
  c.fillStyle = rgba([206, 190, 168]);
  c.beginPath(); c.moveTo(ax - 40, ay + ah); c.lineTo(ax - 40, ay + ar); c.arc(ax + ar, ay + ar, ar + 40, Math.PI, 0); c.lineTo(ax + aw + 40, ay + ah); c.closePath(); c.fill();
  c.fillStyle = rgba([36, 60, 84]);
  c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + ar); c.arc(ax + ar, ay + ar, ar, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.closePath(); c.fill();
  // warm interior glimpsed through the glass: the cobalt wall inside
  const ig = c.createLinearGradient(0, ay, 0, ay + ah);
  ig.addColorStop(0, rgba([62, 104, 150])); ig.addColorStop(1, rgba([40, 72, 108]));
  c.fillStyle = ig;
  c.beginPath(); c.moveTo(ax + 14, ay + ah); c.lineTo(ax + 14, ay + ar); c.arc(ax + ar, ay + ar, ar - 14, Math.PI, 0); c.lineTo(ax + aw - 14, ay + ah); c.closePath(); c.fill();
  glow(c, 540, 1100, 520, [255, 240, 214], 0.28);
  // frames: door in the middle, windows at the sides with listing cards
  c.strokeStyle = rgba([196, 200, 204]); c.lineWidth = 12;
  c.beginPath(); c.moveTo(380, ay + ah); c.lineTo(380, 930); c.moveTo(700, ay + ah); c.lineTo(700, 930); c.moveTo(ax + 14, 930); c.lineTo(ax + aw - 14, 930); c.stroke();
  for (const [x0, x1] of [[190, 360], [720, 890]]) {
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) {
      const cx = x0 + 18 + k * 80, cy = 990 + r * 150;
      fillRR(c, cx, cy, 64, 120, 6, C.white, 0.95);
      c.fillStyle = rgba(C.soft); c.fillRect(cx + 6, cy + 8, 52, 40);
      c.fillStyle = rgba(C.roof); c.beginPath(); c.moveTo(cx + 12, cy + 34); c.lineTo(cx + 32, cy + 18); c.lineTo(cx + 52, cy + 34); c.closePath(); c.fill();
      fillRR(c, cx + 8, cy + 60, 48, 7, 3, C.ink, 0.7); fillRR(c, cx + 8, cy + 76, 30, 7, 3, C.muted, 0.5);
    }
  }
  // glass door with its white lettering, as in the real office
  c.fillStyle = 'rgba(234,244,249,0.1)'; c.fillRect(392, 942, 296, ay + ah - 942);
  const lines = ['I NOSTRI SERVIZI', 'Vendita e locazione', 'Consulenza mutui', 'Valutazioni gratuite', 'Gestione affitti', 'Pratiche notarili'];
  lines.forEach((s, i) => drawText(c, s, 540, 1010 + i * 40, { size: i ? 17 : 19, w: i ? 9 : 11, color: C.white, alpha: 0.9, track: i ? 0 : 12 }));
  c.fillStyle = rgba([200, 204, 208]); c.fillRect(662, 1310, 10, 90);
  // address plate
  fillRR(c, 770, 740, 170, 96, 8, [238, 232, 222]);
  c.strokeStyle = rgba([180, 170, 156]); c.lineWidth = 3; c.beginPath(); rrect(c, 776, 746, 158, 84, 6); c.stroke();
  drawText(c, 'VIA COLSERENO', 855, 782, { size: 17, w: 9, track: 8, color: C.ink });
  drawText(c, '45', 855, 818, { size: 30, w: 13, color: C.ink });
  // cobblestones
  c.fillStyle = rgba([150, 140, 130]); c.fillRect(-100, ay + ah, W + 200, 400);
  c.strokeStyle = 'rgba(90,80,72,0.5)'; c.lineWidth = 3;
  c.beginPath();
  for (let r = 0; r < 8; r++) { const y = ay + ah + 8 + r * (18 + r * 6); c.moveTo(-100, y); c.lineTo(W + 100, y); const st = 40 + r * 14; for (let x = -100 + (r % 2) * st / 2; x < W + 100; x += st) { c.moveTo(x, y); c.lineTo(x, y + 18 + r * 6); } }
  c.stroke();
  // potted plant by the door
  c.fillStyle = rgba([196, 176, 150]); c.beginPath(); c.moveTo(80, 1640); c.lineTo(190, 1640); c.lineTo(175, 1760); c.lineTo(95, 1760); c.closePath(); c.fill();
  for (let i = 0; i < 9; i++) { c.save(); c.translate(135, 1640); c.rotate(-1.2 + i * 0.3); c.fillStyle = rgba(i % 2 ? C.leaf : C.leafL); c.beginPath(); c.ellipse(0, -80, 22, 70, 0, 0, TAU); c.fill(); c.restore(); }
  c.restore();
}
// The office itself, rebuilt from assets/casa-ufficio.jpg as a small 3D room in
// metres, seen from the doorway with the eye at 1.5 m: pine planks, white walls
// and ceiling spots, the cobalt feature wall with the white mark and the black
// printer in front of it, the two divider panels with the slate mark, the
// wardrobe and a desk on the left, the second desk and the blue velvet chair,
// the rubber plant, the striped settee behind the open glass door and the door's
// white lettering. A real camera, so the push into the wall has parallax.
const OF = { f: 1000, vx: 540, vy: 820, L: -2.3, R: 2.1, Fl: 1.5, Ce: -1.4, B: 6.0, cob: -0.15 };
const oP = (m, X, Y, Z) => { const z = Z - m.z; return [OF.vx + OF.f * (X - m.x) / z, OF.vy + OF.f * (Y - m.y) / z, z]; };
// a polygon in metres, clipped at the camera's near plane so that nothing behind
// the lens is folded back into the picture as the camera walks through the room
function oPoly(c, m, pts, fill) {
  const zn = m.z + 0.05, q = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ina = a[2] >= zn;
    if (ina) q.push(a);
    if (ina !== (b[2] >= zn)) { const k = (zn - a[2]) / (b[2] - a[2]); q.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, zn]); }
  }
  if (q.length < 3) return;
  c.beginPath();
  q.forEach((p, i) => { const s = oP(m, p[0], p[1], p[2]); if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); });
  c.closePath(); c.fillStyle = fill; c.fill();
}
// an axis-aligned box: the faces that look at the camera
function oBox(c, m, x0, x1, y0, y1, z0, z1, front, side, top) {
  if (z1 < m.z + 0.05) return;
  if (m.x < x0) oPoly(c, m, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], side);
  if (m.x > x1) oPoly(c, m, [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], side);
  if (m.y < y0 && top) oPoly(c, m, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], top);
  if (m.z < z0) oPoly(c, m, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], front);
}
const floorShadow = (c, m, x0, x1, z0, z1, a) => oPoly(c, m, [[x0, OF.Fl - 0.002, z0], [x1, OF.Fl - 0.002, z0], [x1, OF.Fl - 0.002, z1], [x0, OF.Fl - 0.002, z1]], `rgba(60,36,18,${a})`);
// the blue velvet chair of the photo, in profile: it faces the second desk (+x),
// its padded back on the far side, four chrome legs
function velvetChair(c, m, cx, cz) {
  const Fl = OF.Fl, sy = Fl - 0.47, V = [36, 76, 92];
  const top = rgba(mix(V, [140, 186, 200], 0.28)), face = rgba(V), dark = rgba(mix(V, [0, 0, 0], 0.32)), chrome = rgba([204, 208, 214]), chromeD = rgba([150, 154, 160]);
  floorShadow(c, m, cx - 0.26, cx + 0.26, cz - 0.25, cz + 0.25, 0.16);
  for (const [dx, dz] of [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]]) {
    const x = cx + dx * 1.08, z = cz + dz * 1.08;
    oBox(c, m, x - 0.011, x + 0.011, sy + 0.06, Fl, z - 0.011, z + 0.011, chrome, chromeD);
  }
  const back = () => oBox(c, m, cx - 0.27, cx - 0.2, sy - 0.44, sy + 0.03, cz - 0.215, cz + 0.215, dark, face, top);
  const seat = () => oBox(c, m, cx - 0.22, cx + 0.23, sy, sy + 0.07, cz - 0.225, cz + 0.225, face, dark, top);
  if (m.x > cx - 0.2) { back(); seat(); } else { seat(); back(); }
}
// the black office chair at the first desk: it faces the desk (+z), so the camera
// sees its back; blue seat, gas column, five-star base
function taskChair(c, m, cx, cz) {
  const Fl = OF.Fl, sy = Fl - 0.48, blk = rgba([30, 30, 32]), blkD = rgba([16, 16, 18]), blkT = rgba([58, 58, 62]), metal = rgba([126, 128, 132]);
  floorShadow(c, m, cx - 0.3, cx + 0.3, cz - 0.3, cz + 0.3, 0.14);
  for (let k = 0; k < 5; k++) {
    const a = k * TAU / 5 + 0.3, ux = Math.cos(a), uz = Math.sin(a), px = -uz * 0.02, pz = ux * 0.02, y = Fl - 0.05;
    oPoly(c, m, [[cx + px, y, cz + pz], [cx + ux * 0.3 + px, y, cz + uz * 0.3 + pz], [cx + ux * 0.3 - px, y, cz + uz * 0.3 - pz], [cx - px, y, cz - pz]], blkT);
  }
  oBox(c, m, cx - 0.024, cx + 0.024, sy + 0.08, Fl - 0.06, cz - 0.024, cz + 0.024, metal, metal);
  oBox(c, m, cx - 0.24, cx + 0.24, sy, sy + 0.08, cz - 0.21, cz + 0.25, rgba([40, 58, 80]), rgba([28, 42, 60]), rgba([58, 80, 108]));
  oBox(c, m, cx - 0.23, cx + 0.23, sy - 0.5, sy - 0.04, cz - 0.27, cz - 0.21, blk, blkD, blkT);
  oBox(c, m, cx - 0.03, cx + 0.03, sy - 0.06, sy + 0.02, cz - 0.24, cz - 0.2, metal, metal);
}
// the Louis settee behind the glass: along the right side, facing into the room,
// striped upholstery on a carved walnut frame
function settee(c, m) {
  const Fl = OF.Fl, x0 = 1.38, x1 = 1.96, z0 = 1.95, z1 = 3.15, sy = Fl - 0.44, bx = x1 - 0.08, N = 34;
  if (z1 < m.z + 0.05) return;
  const wood = rgba([96, 62, 38]), woodD = rgba([62, 38, 22]), woodT = rgba([128, 88, 56]);
  const stripe = (i, k = 0) => rgba(mix(O_STRIPES[i % O_STRIPES.length], [0, 0, 0], k));
  const zs = i => z0 + 0.05 + (z1 - z0 - 0.1) * i / N, topY = z => sy - 0.43 - 0.09 * Math.sin(Math.PI * (z - z0) / (z1 - z0));
  floorShadow(c, m, x0 - 0.04, x1, z0, z1, 0.18);
  for (const [x, z] of [[x1 - 0.05, z1 - 0.05], [x1 - 0.05, z0 + 0.05], [x0 + 0.03, z1 - 0.05], [x0 + 0.03, z0 + 0.05]]) oBox(c, m, x - 0.022, x + 0.022, sy + 0.14, Fl, z - 0.022, z + 0.022, wood, woodD);
  // the back: upright stripes under a carved rail that rises in the middle
  for (let i = 0; i < N; i++) { const za = zs(i), zb = zs(i + 1); oPoly(c, m, [[bx, topY(za), za], [bx, topY(zb), zb], [bx, sy, zb], [bx, sy, za]], stripe(i)); }
  for (let i = 0; i < N; i++) { const za = zs(i), zb = zs(i + 1); oPoly(c, m, [[bx - 0.004, topY(za) - 0.035, za], [bx - 0.004, topY(zb) - 0.035, zb], [bx - 0.004, topY(zb) + 0.012, zb], [bx - 0.004, topY(za) + 0.012, za]], wood); }
  const arm = z => {
    oBox(c, m, x0 + 0.02, x0 + 0.07, sy - 0.22, sy, z - 0.03, z + 0.03, wood, woodD, woodT);
    oBox(c, m, x0, bx, sy - 0.26, sy - 0.2, z - 0.045, z + 0.045, wood, woodD, woodT);
    oBox(c, m, x0 + 0.08, bx, sy - 0.2, sy, z - 0.035, z + 0.035, stripe(3, 0.1), stripe(3, 0.3), stripe(3));
  };
  arm(z1 - 0.05);
  // the seat cushion: stripes running front to back, the front edge in shade
  for (let i = 0; i < N; i++) {
    const za = zs(i), zb = zs(i + 1);
    if (m.y < sy) oPoly(c, m, [[x0, sy, za], [bx, sy, za], [bx, sy, zb], [x0, sy, zb]], stripe(i));
    oPoly(c, m, [[x0, sy, za], [x0, sy, zb], [x0, sy + 0.1, zb], [x0, sy + 0.1, za]], stripe(i, 0.28));
  }
  oPoly(c, m, [[x0, sy, z0 + 0.05], [bx, sy, z0 + 0.05], [bx, sy + 0.1, z0 + 0.05], [x0, sy + 0.1, z0 + 0.05]], stripe(5, 0.35));
  oBox(c, m, x0 - 0.02, x0 + 0.02, sy + 0.1, sy + 0.15, z0, z1, wood, woodD, woodT);
  arm(z0 + 0.05);
}
// draw something flat facing the camera, in metres, at a point of the room
function oAt(c, m, X, Y, Z, draw) {
  const [sx, sy, z] = oP(m, X, Y, Z);
  if (z < 0.15) return;
  const s = OF.f / z;
  c.save(); c.translate(sx, sy); c.scale(s, s); draw(s); c.restore();
}
const OFFICE = (() => {
  const r = rng(45), planks = [];
  for (let x = OF.L; x < OF.R - 0.01; x += 0.19) {
    const joints = []; let z = -r() * 1.6;
    while (z < OF.B) { z += 1.1 + r() * 1.4; if (z < OF.B) joints.push(z); }
    const grain = [0.2 + r() * 0.2, 0.5 + r() * 0.15, 0.78 + r() * 0.12];
    const knots = []; for (let k = 0; k < 2; k++) if (r() < 0.5) knots.push([x + 0.03 + r() * 0.13, 0.4 + r() * 5.4]);
    planks.push({ x, tone: r(), joints, grain, knots });
  }
  return { planks };
})();
const O_STRIPES = [[28, 46, 74], [226, 220, 204], [46, 116, 128], [250, 250, 246], [116, 166, 196], [84, 96, 110], [236, 230, 214], [30, 70, 96], [200, 172, 116], [150, 188, 206], [248, 246, 240], [38, 92, 104]];
function officeRoom(c, t, m, door) {
  const { L, R, Fl, Ce, B, cob } = OF, nz = m.z + 0.06;
  // the shell: ceiling, walls, back wall
  let g = c.createLinearGradient(0, 0, 0, OF.vy);
  g.addColorStop(0, rgba([214, 210, 205])); g.addColorStop(1, rgba([236, 233, 229]));
  oPoly(c, m, [[L, Ce, nz], [R, Ce, nz], [R, Ce, B], [L, Ce, B]], g);
  g = c.createLinearGradient(0, 0, OF.vx, 0); g.addColorStop(0, rgba([224, 222, 220])); g.addColorStop(1, rgba([214, 211, 208]));
  oPoly(c, m, [[L, Ce, nz], [L, Ce, B], [L, Fl, B], [L, Fl, nz]], g);
  g = c.createLinearGradient(OF.vx, 0, W, 0); g.addColorStop(0, rgba([208, 205, 202])); g.addColorStop(1, rgba([220, 218, 216]));
  oPoly(c, m, [[R, Ce, nz], [R, Ce, B], [R, Fl, B], [R, Fl, nz]], g);
  oPoly(c, m, [[L, Ce, B], [cob, Ce, B], [cob, Fl, B], [L, Fl, B]], rgba([224, 220, 216]));
  // the cobalt feature wall, lit from the spots above, and its white mark in relief
  const [bx0, by0] = oP(m, cob, Ce, B), [bx1, by1] = oP(m, R, Fl, B);
  g = c.createRadialGradient((bx0 + bx1) / 2, by0 + (by1 - by0) * 0.25, 10, (bx0 + bx1) / 2, by0 + (by1 - by0) * 0.4, (bx1 - bx0) * 1.1);
  g.addColorStop(0, rgba([48, 104, 164])); g.addColorStop(0.6, rgba([36, 84, 138])); g.addColorStop(1, rgba([26, 64, 108]));
  c.fillStyle = g; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(bx0 - (bx1 - bx0) * 0.008, by0, (bx1 - bx0) * 0.012, by1 - by0);
  const sb = OF.f / (B - m.z), lw = 1.5 * sb, ls = lw / 276, [lx, ly] = oP(m, 0.98 - 0.75, -0.95, B);
  drawLogo(c, lx + 0.025 * sb, ly + 0.03 * sb, ls, { roof: [18, 46, 80], ink: [18, 46, 80], under: 1 });
  drawLogo(c, lx, ly, ls, { roof: [232, 234, 236], ink: [232, 234, 236], under: 1 });
  // cable trunking and a switch on the white part, skirting all round
  oPoly(c, m, [[L, 0.22, B - 0.001], [cob, 0.22, B - 0.001], [cob, 0.26, B - 0.001], [L, 0.26, B - 0.001]], rgba([240, 238, 236]));
  oPoly(c, m, [[-1.25, 0.02, B - 0.002], [-1.16, 0.02, B - 0.002], [-1.16, 0.11, B - 0.002], [-1.25, 0.11, B - 0.002]], rgba([246, 245, 243]));
  oPoly(c, m, [[L, Fl - 0.08, B - 0.001], [cob, Fl - 0.08, B - 0.001], [cob, Fl, B - 0.001], [L, Fl, B - 0.001]], rgba([238, 236, 232]));
  oPoly(c, m, [[L + 0.001, Fl - 0.08, nz], [L + 0.001, Fl - 0.08, B], [L + 0.001, Fl, B], [L + 0.001, Fl, nz]], rgba([236, 234, 230]));
  oPoly(c, m, [[R - 0.001, Fl - 0.08, nz], [R - 0.001, Fl - 0.08, B], [R - 0.001, Fl, B], [R - 0.001, Fl, nz]], rgba([226, 224, 220]));
  // pine floor: planks toward the back wall, butt joints, grain, knots, the spots' reflections
  oPoly(c, m, [[L, Fl, nz], [R, Fl, nz], [R, Fl, B], [L, Fl, B]], rgba([196, 156, 116]));
  for (const p of OFFICE.planks) {
    const col = mix([206, 164, 120], [176, 132, 94], p.tone);
    oPoly(c, m, [[p.x + 0.004, Fl, nz], [p.x + 0.186, Fl, nz], [p.x + 0.186, Fl, B], [p.x + 0.004, Fl, B]], rgba(col));
  }
  c.strokeStyle = 'rgba(96,64,40,0.5)'; c.lineWidth = 1.4; c.beginPath();
  for (const p of OFFICE.planks) {
    const a = oP(m, p.x, Fl, nz), b = oP(m, p.x, Fl, B); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
    for (const z of p.joints) { if (z < nz) continue; const u = oP(m, p.x, Fl, z), v = oP(m, p.x + 0.19, Fl, z); c.moveTo(u[0], u[1]); c.lineTo(v[0], v[1]); }
  }
  c.stroke();
  c.strokeStyle = 'rgba(120,80,48,0.22)'; c.lineWidth = 1; c.beginPath();
  for (const p of OFFICE.planks) for (const k of p.grain) { const a = oP(m, p.x + 0.19 * k, Fl, nz), b = oP(m, p.x + 0.19 * k, Fl, B); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  c.fillStyle = 'rgba(96,58,32,0.45)'; c.beginPath();
  for (const p of OFFICE.planks) for (const [kx, kz] of p.knots) { if (kz < nz + 0.2) continue; const [x, y, z] = oP(m, kx, Fl, kz), rr = 0.022 * OF.f / z; c.moveTo(x + rr, y); c.ellipse(x, y, rr, rr * (Fl - m.y) / z * 0.9, 0, 0, TAU); }
  c.fill();
  for (const [x, z] of [[-0.6, 4.4], [0.7, 4.6], [0.1, 5.5], [-0.8, 2.6], [0.8, 2.8]]) { if (z < nz + 0.3) continue; const [sx, sy, zz] = oP(m, x, Fl, z); glow(c, sx, sy, 0.7 * OF.f / zz, [255, 244, 224], 0.2); }
  // recessed spots in the ceiling
  for (const [x, z] of [[-0.9, 2.2], [0.8, 2.3], [-0.7, 4.1], [0.9, 4.3], [0.1, 5.5]]) {
    if (z < nz + 0.3) continue;
    const [sx, sy, zz] = oP(m, x, Ce, z), rr = 0.085 * OF.f / zz;
    glow(c, sx, sy + rr, rr * 7, [255, 246, 228], 0.5);
    c.fillStyle = rgba([196, 194, 190]); c.beginPath(); c.ellipse(sx, sy, rr * 1.3, rr * 1.3 * Math.abs(Ce - m.y) / zz, 0, 0, TAU); c.fill();
    c.fillStyle = rgba([255, 253, 246]); c.beginPath(); c.ellipse(sx, sy, rr, rr * Math.abs(Ce - m.y) / zz, 0, 0, TAU); c.fill();
  }
  // ---- furniture, far to near
  // the black multifunction printer in front of the cobalt wall's left edge
  oBox(c, m, -0.45, 0.15, 0.5, Fl, 5.35, 5.95, rgba([34, 34, 36]), rgba([24, 24, 26]), rgba([56, 56, 60]));
  if (5.35 > m.z + 0.12) {
    oPoly(c, m, [[-0.42, 0.58, 5.349], [0.12, 0.58, 5.349], [0.12, 0.64, 5.349], [-0.42, 0.64, 5.349]], rgba([70, 70, 74]));
    oPoly(c, m, [[-0.2, 0.52, 5.349], [-0.02, 0.52, 5.349], [-0.02, 0.56, 5.349], [-0.2, 0.56, 5.349]], rgba([96, 150, 190]));
    c.strokeStyle = 'rgba(90,90,96,0.8)'; c.lineWidth = 1.2; c.beginPath();
    for (const y of [0.78, 0.95, 1.12, 1.29]) { const a = oP(m, -0.42, y, 5.349), b = oP(m, 0.12, y, 5.349); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  // second desk, cream laminate, with its monitor and a pen pot
  oBox(c, m, 0.7, 2.1, 0.72, 0.76, 4.55, 5.35, rgba([214, 206, 190]), rgba([200, 192, 176]), rgba([236, 230, 218]));
  oBox(c, m, 0.72, 2.08, 0.76, 1.38, 4.9, 4.93, rgba([206, 198, 182]), rgba([190, 182, 166]));
  oBox(c, m, 0.74, 0.8, 0.76, Fl, 4.6, 5.3, rgba([150, 152, 156]), rgba([130, 132, 136]));
  oBox(c, m, 1.2, 1.78, 0.2, 0.66, 5.1, 5.13, rgba([30, 30, 32]), rgba([20, 20, 22]));
  oBox(c, m, 1.45, 1.53, 0.66, 0.72, 5.12, 5.2, rgba([40, 40, 44]), rgba([30, 30, 32]));
  oBox(c, m, 0.95, 1.02, 0.6, 0.72, 4.75, 4.82, rgba([60, 64, 70]), rgba([44, 46, 50]), rgba([90, 94, 100]));
  // the two divider panels with the slate mark, on aluminium feet
  for (const [x0, x1] of [[-2.0, -1.38], [-1.28, -0.66]]) {
    if (4.4 < m.z + 0.12) break;
    oBox(c, m, x0, x1, -0.35, 1.44, 4.4, 4.42, rgba([242, 240, 236]), rgba([222, 220, 216]));
    oBox(c, m, x0 - 0.025, x0 + 0.005, -0.37, 1.46, 4.39, 4.43, rgba([172, 168, 164]), rgba([150, 146, 142]));
    oBox(c, m, x1 - 0.005, x1 + 0.025, -0.37, 1.46, 4.39, 4.43, rgba([172, 168, 164]), rgba([150, 146, 142]));
    for (const fx of [x0 - 0.01, x1 + 0.01]) oBox(c, m, fx - 0.02, fx + 0.02, 1.47, Fl, 4.2, 4.62, rgba([160, 156, 152]), rgba([140, 136, 132]), rgba([176, 172, 168]));
    const [px0, py0] = oP(m, x0 + 0.08, -0.22, 4.4), lsp = (x1 - x0 - 0.16) * OF.f / (4.4 - m.z) / 276;
    drawLogo(c, px0, py0, lsp, { roof: [67, 93, 109], ink: [67, 93, 109] });
  }
  // the blue velvet chair, in profile toward the second desk
  velvetChair(c, m, 0.32, 4.25);
  // the wardrobe against the left wall: two laminate doors, steel handles
  if (3.4 > m.z + 0.12) {
    oPoly(c, m, [[-1.72, -0.62, 3.4], [-1.72, -0.62, 4.6], [-1.72, Fl, 4.6], [-1.72, Fl, 3.4]], rgba([214, 204, 186]));
    oPoly(c, m, [[L, -0.62, 3.4], [-1.72, -0.62, 3.4], [-1.72, Fl, 3.4], [L, Fl, 3.4]], rgba([196, 186, 170]));
    c.strokeStyle = 'rgba(120,108,92,0.6)'; c.lineWidth = 1.6; c.beginPath();
    let a = oP(m, -1.72, -0.6, 4.0), b = oP(m, -1.72, 1.48, 4.0); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.strokeStyle = rgba([150, 152, 156]); c.lineWidth = 3; c.beginPath();
    a = oP(m, -1.72, 0.3, 3.93); b = oP(m, -1.72, 0.55, 3.93); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
    a = oP(m, -1.72, 0.3, 4.07); b = oP(m, -1.72, 0.55, 4.07); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  }
  // first desk with the black monitor, papers, and the black office chair
  oBox(c, m, L, -1.0, 0.72, 0.76, 2.85, 3.75, rgba([226, 222, 216]), rgba([210, 206, 200]), rgba([240, 238, 234]));
  oBox(c, m, -1.07, -1.02, 0.76, Fl, 2.9, 3.7, rgba([150, 152, 156]), rgba([130, 132, 136]));
  oBox(c, m, -1.9, -1.35, 0.22, 0.66, 3.5, 3.53, rgba([28, 28, 30]), rgba([18, 18, 20]));
  oBox(c, m, -1.66, -1.59, 0.66, 0.72, 3.52, 3.6, rgba([40, 40, 44]), rgba([30, 30, 32]));
  oBox(c, m, -1.95, -1.5, 0.715, 0.72, 3.0, 3.25, rgba([246, 246, 244]), rgba([230, 230, 228]), rgba([250, 250, 248]));
  // the black chair pulled up to it, seen from behind
  taskChair(c, m, -1.2, 2.72);
  // a framed blue print on the right wall
  if (4.2 > m.z + 0.12) {
    oPoly(c, m, [[R - 0.01, -0.75, 4.2], [R - 0.01, -0.75, 4.95], [R - 0.01, 0.35, 4.95], [R - 0.01, 0.35, 4.2]], rgba([200, 204, 208]));
    oPoly(c, m, [[R - 0.012, -0.7, 4.25], [R - 0.012, -0.7, 4.9], [R - 0.012, 0.3, 4.9], [R - 0.012, 0.3, 4.25]], rgba([64, 104, 150]));
    oPoly(c, m, [[R - 0.013, -0.45, 4.35], [R - 0.013, -0.3, 4.8], [R - 0.013, 0.1, 4.7], [R - 0.013, -0.05, 4.3]], 'rgba(220,232,242,0.6)');
  }
  // the striped settee behind the glass, along the right side
  settee(c, m);
  // the rubber plant in the foreground on the left
  oAt(c, m, -0.72, Fl, 1.25, s => {
    const leaves = [[-0.3, -0.62, -0.9, 0.3], [-0.12, -0.8, -0.4, 0.28], [0.1, -0.7, 0.5, 0.3], [0.28, -0.52, 1.0, 0.27], [-0.34, -0.38, -1.2, 0.26], [0.02, -1.02, 0.1, 0.26], [-0.2, -1.2, -0.6, 0.24], [0.22, -1.12, 0.7, 0.25], [0.36, -0.86, 1.2, 0.24], [-0.4, -0.95, -1.3, 0.24], [0.0, -1.38, -0.2, 0.22], [0.14, -0.38, 0.8, 0.26], [-0.18, -0.46, -0.5, 0.28], [0.3, -1.3, 0.9, 0.2], [-0.36, -1.2, -1.0, 0.21], [0.08, -1.5, 0.3, 0.18], [-0.08, -0.3, -0.2, 0.3]];
    c.strokeStyle = rgba([70, 58, 44]); c.lineWidth = 0.02; c.beginPath(); c.moveTo(0, 0); c.lineTo(-0.05, -1.3); c.moveTo(-0.03, -0.4); c.lineTo(-0.28, -0.55); c.moveTo(-0.04, -0.7); c.lineTo(0.25, -0.95); c.stroke();
    leaves.forEach(([x, y, a, l], i) => {
      c.save(); c.translate(x, y); c.rotate(a + Math.sin(t * 1.6 + i) * 0.02);
      const w2 = l * 0.3, dark = i % 4 === 1 ? [48, 34, 30] : [24, 42, 28], mid = i % 4 === 1 ? [84, 52, 44] : [44, 72, 44];
      const leaf = () => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-w2 * 1.2, -l * 0.18, -w2 * 1.1, -l * 0.78, 0, -l); c.bezierCurveTo(w2 * 1.1, -l * 0.78, w2 * 1.2, -l * 0.18, 0, 0); c.closePath(); };
      leaf(); c.fillStyle = rgba(dark); c.fill();
      c.save(); leaf(); c.clip(); c.fillStyle = rgba(mid); c.fillRect(-w2 * 1.3, -l, w2 * 1.3, l); c.restore();
      c.strokeStyle = rgba(i % 4 === 1 ? [170, 96, 80] : [150, 168, 120], 0.6); c.lineWidth = 0.006; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -l * 0.96); c.stroke();
      c.fillStyle = 'rgba(226,240,220,0.24)'; c.beginPath(); c.ellipse(-w2 * 0.42, -l * 0.55, w2 * 0.16, l * 0.26, 0.12, 0, TAU); c.fill();
      c.restore();
    });
    c.fillStyle = rgba([236, 234, 230]); c.beginPath(); c.moveTo(-0.2, -0.28); c.lineTo(0.2, -0.28); c.lineTo(0.16, 0); c.lineTo(-0.16, 0); c.closePath(); c.fill();
  });
  // the glass door: it swings inward as the camera comes in. An aluminium frame
  // round the glass, the lever, and the white vinyl lettering set word by word in
  // the plane of the door, so it keeps its perspective; it fades as the door turns
  // edge-on
  const ang = door, hx = 1.11, hz = 1.5, DW = 1.0, top = -0.75;
  const ex = Math.cos(ang), ez = -Math.sin(ang), fx = hx - ex * DW, fz = hz - ez * DW;
  const dp = (u, v) => [fx + ex * u, v, fz + ez * u];
  const quad = (u0, u1, v0, v1, fill) => oPoly(c, m, [dp(u0, v0), dp(u1, v0), dp(u1, v1), dp(u0, v1)], fill);
  if (Math.max(fz, hz) > m.z + 0.05) {
    quad(0, DW, top, Fl, 'rgba(214,232,240,0.13)');
    oPoly(c, m, [dp(0.3, top), dp(0.5, top), dp(0.2, Fl), dp(0.02, Fl)], 'rgba(255,255,255,0.06)');
    const al = rgba([200, 204, 208]), alD = rgba([154, 158, 164]);
    quad(0, 0.035, top, Fl, al); quad(DW - 0.035, DW, top, Fl, alD);
    quad(0, DW, top, top + 0.045, al); quad(0, DW, Fl - 0.1, Fl, alD);
    quad(0.045, 0.085, 0.44, 0.515, rgba([210, 212, 216]));
    quad(0.05, 0.19, 0.465, 0.49, rgba([228, 230, 234]));
    const la = 0.92 * (1 - ss(0.55, 1.05, ang));
    if (la > 0.01) {
      const lines = [['I NOSTRI SERVIZI', 0.22, 0.052], ['Vendita e locazione di Immobili', 0.36, 0.04], ['Consulenza Mutui', 0.48, 0.04], ['Valutazioni Gratuite', 0.6, 0.04], ['Residenziale Commerciale', 0.72, 0.04], ['Gestione Affitti e Contratti', 0.92, 0.04], ['Pratiche Notarili', 1.05, 0.04], ['I NOSTRI CONTATTI', 1.3, 0.05]];
      for (const [s, y, sz0] of lines) {
        const wt = sz0 > 0.05 ? 16 : 13, words = s.split(' ');
        const w0 = words.reduce((a, wd) => a + measure(wd, sz0, wt), 0) + sz0 * 0.3 * (words.length - 1);
        const size = sz0 * Math.min(1, (DW - 0.22) / w0), gap = size * 0.3;
        let u = 0.13;
        for (const wd of words) {
          const ww = measure(wd, size, wt), A = oP(m, ...dp(u, top + y)), Bw = oP(m, ...dp(u + ww, top + y)), Cw = oP(m, ...dp(u, top + y + size));
          if (A[2] > 0.1 && Bw[2] > 0.1 && Cw[2] > 0.1) {
            c.save();
            c.transform((Bw[0] - A[0]) / ww, (Bw[1] - A[1]) / ww, (Cw[0] - A[0]) / size, (Cw[1] - A[1]) / size, A[0], A[1]);
            c.transform(1, 0, -0.18, 1, 0, 0);
            drawText(c, wd, 0, 0, { size, w: wt, align: 'left', color: C.white, alpha: la });
            c.restore();
          }
          u += ww + gap;
        }
      }
    }
  }
}
function sceneOffice(c, t) {
  if (t < T.office - 0.02 || t > T.cta + 0.05) return;
  const pan = E.inOutCubic(inv(T.office, T.office + 0.8, t));
  const du = inv(T.office + 0.85, T.office + 1.25, t);   // through the door
  const pu = E.inOutCubic(inv(T.push, T.cta, t));       // into the cobalt wall
  if (du < 1) {
    c.save();
    c.translate(0, (1 - pan) * 1920);
    const dz = 1 + 7 * E.inQuart(du), dc = [540, 1250 + SF_Y];
    c.translate(dc[0], dc[1]); c.scale(dz, dz); c.translate(-dc[0], -dc[1]);
    shopfront(c, t);
    c.restore();
  }
  if (du > 0) {
    // the office seen through the opening door, growing to fill the frame
    const dz = 1 + 7 * E.inQuart(du), dc = [540, 1250 + SF_Y];
    const x0 = dc[0] + (392 - dc[0]) * dz, x1 = dc[0] + (688 - dc[0]) * dz, y0 = dc[1] + (942 + SF_Y - dc[1]) * dz, y1 = dc[1] + (1760 + SF_Y - dc[1]) * dz;
    c.save();
    if (du < 1) { c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); }
    const si = lerp(0.42, 1, E.inQuart(du));
    c.translate(dc[0] + (CX - dc[0]) * E.inQuart(du), dc[1] + (1000 - dc[1]) * E.inQuart(du));
    c.scale(si, si); c.translate(-CX, -1000);
    // a step inside while the caption reads, then the camera walks up to the cobalt wall
    const creep = 0.28 * ss(T.office + 1.0, T.push + 0.3, t);
    const cam = { x: 0.98 * pu, y: -0.3 * pu, z: creep + (5.1 - creep) * pu };
    officeRoom(c, t, cam, 0.2 + 1.25 * ss(T.office + 1.2, T.push + 0.3, t));
    c.restore();
  }
  // the wall becomes the field of the call to action
  if (pu > 0.7) { c.save(); c.globalAlpha = ss(0.7, 1, pu); cobaltField(c, 1); c.restore(); }
}

