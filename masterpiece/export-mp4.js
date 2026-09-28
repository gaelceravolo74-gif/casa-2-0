#!/usr/bin/env node
/* Export "The Casa 2.0 Social Media Masterpiece" as a frame-exact MP4.

     node masterpiece/export-mp4.js [out.mp4] [--crf 16] [--grain]

   Renders every frame of index.html at 1080 × 1920 and 60 fps in headless
   Chromium, renders the score offline at 48 kHz, and encodes H.264 High 4.2
   plus AAC-LC 256 kb/s with ffmpeg (BT.709, moov first for fast start). The
   picture and the sound come from the same timeline, so sync is sample-exact.
   The audio gets a -1 dBTP ceiling and a 0.25 s tail fade for the platforms.

   Needs Node 18+, Playwright with Chromium (npm i -D playwright, then
   npx playwright install chromium) and ffmpeg 6+ on PATH, or FFMPEG=/path.
   CHROMIUM=/path/to/chrome picks a specific browser binary.

   Film grain is off by default: it is most of the bitrate (about 150 MB
   instead of 27 MB) and TikTok/Reels re-encode it into blocks. --grain keeps it. */
'use strict';
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const { spawn, spawnSync, execSync } = require('child_process');

const W = 1080, H = 1920, FPS = 60, SR = 48000, FRAME_BYTES = W * H * 4;
const args = process.argv.slice(2);
const option = (name, def) => { const i = args.indexOf(name); return i >= 0 ? (args.splice(i, 2)[1] || def) : def; };
const flag = name => { const i = args.indexOf(name); return i >= 0 ? (args.splice(i, 1), true) : false; };
const CRF = option('--crf', '16'), GRAIN = flag('--grain');
const OUT = path.resolve(args[0] || 'casa-2-0-social-masterpiece-60fps.mp4');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

function playwright() {
  try { return require('playwright'); } catch (e) { /* try a global install */ }
  try { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } catch (e) { /* not found */ }
  throw new Error('Playwright not found: npm i -D playwright && npx playwright install chromium');
}

// 32-bit float stereo WAV from the page's planar channels, trimmed to film time
function floatWav(body, n, skip, len) {
  const f = new Float32Array(body.buffer.slice(body.byteOffset, body.byteOffset + body.length));
  const out = Buffer.alloc(44 + len * 8);
  out.write('RIFF', 0); out.writeUInt32LE(36 + len * 8, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16);
  out.writeUInt16LE(3, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 8, 28);
  out.writeUInt16LE(8, 32); out.writeUInt16LE(32, 34); out.write('data', 36); out.writeUInt32LE(len * 8, 40);
  for (let i = 0, j = skip; i < len; i++, j++) {
    out.writeFloatLE(j < n ? f[j] : 0, 44 + i * 8);
    out.writeFloatLE(j < n ? f[n + j] : 0, 48 + i * 8);
  }
  return out;
}

// the page posts raw frames and the score back over loopback
let onFrame = null, audio = null;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST') {
    const parts = [];
    req.on('data', d => parts.push(d));
    req.on('end', () => {
      const body = Buffer.concat(parts);
      const done = err => { res.writeHead(err ? 500 : 200); res.end(err ? String(err) : 'ok'); };
      if (url.pathname === '/frame') onFrame(body, done);
      else if (url.pathname === '/audio') { audio = body; done(); }
      else done('unknown endpoint');
    });
    return;
  }
  if (url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  } else { res.writeHead(204); res.end(); }
});

(async () => {
  const started = Date.now(), errors = [];
  const wav = path.join(os.tmpdir(), `casa-2-0-score-${process.pid}.wav`);
  let browser = null, ff = null;
  try {
    if (spawnSync(FFMPEG, ['-hide_banner', '-version']).status !== 0) throw new Error(`ffmpeg not found (${FFMPEG}): install ffmpeg 6+ or set FFMPEG=/path/to/ffmpeg`);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const { chromium } = playwright();
    browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
    const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?t=0`);
    const film = await page.evaluate(grain => {
      window.__fx.grain = grain ? 1 : 0;
      const cv = document.getElementById('film');
      return { w: cv.width, h: cv.height, dur: window.__dur, lead: window.__audioLead };
    }, GRAIN);
    if (film.w !== W || film.h !== H) throw new Error(`canvas is ${film.w}×${film.h}, expected ${W}×${H}`);
    const frames = Math.round(film.dur * FPS);

    // 1 · the score, offline, with film t = 0 on sample 0
    process.stdout.write('score… ');
    const n = await page.evaluate(async ([dur, sr]) => {
      const b = await window.__renderAudio(0, dur, sr);
      await fetch('/audio', { method: 'POST', body: new Blob([b.getChannelData(0), b.getChannelData(1)]) });
      return b.length;
    }, [film.dur, SR]);
    fs.writeFileSync(wav, floatWav(audio, n, Math.round(film.lead * SR), Math.round(film.dur * SR)));
    console.log('done');

    // 2 · every frame, straight into the encoder
    let stderr = '', sent = 0;
    ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-nostats', '-y',
      '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-framerate', String(FPS), '-i', 'pipe:0', '-i', wav,
      '-map', '0:v:0', '-map', '1:a:0',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-profile:v', 'high', '-level:v', '4.2',
      '-maxrate', '30M', '-bufsize', '45M', '-g', String(FPS * 2),
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-af', `aresample=192000,alimiter=limit=0.87:attack=0.5:release=40:level=disabled:latency=1,aresample=${SR},afade=t=out:st=${film.dur - 0.25}:d=0.25`,
      '-c:a', 'aac', '-b:a', '256k', '-ar', String(SR), '-ac', '2',
      '-movflags', '+faststart', '-video_track_timescale', String(FPS * 1000),
      '-metadata', 'title=The Casa 2.0 Social Media Masterpiece', OUT], { stdio: ['pipe', 'ignore', 'pipe'] });
    ff.stderr.on('data', d => { stderr += d; });
    ff.stdin.on('error', () => { /* reported through the exit code */ });
    // if ffmpeg stops early, fail the pending frame so the page stops too
    let stopped = false, waiting = null;
    const closed = new Promise(r => {
      const end = code => { stopped = true; if (waiting) { const w = waiting; waiting = null; w('ffmpeg stopped'); } r(code); };
      ff.on('close', end); ff.on('error', e => { stderr += e.message; end(-1); });
    });
    onFrame = (body, done) => {
      if (body.length !== FRAME_BYTES) return done(`frame is ${body.length} bytes`);
      if (stopped) return done('ffmpeg stopped');
      sent++;
      if (ff.stdin.write(body)) return done();
      waiting = done;
      ff.stdin.once('drain', () => { if (waiting === done) { waiting = null; done(); } });
    };
    const tick = setInterval(() => process.stdout.write(`\rframes ${sent}/${frames}`), 1000);
    try {
      await page.evaluate(async ([count, fps]) => {
        const cv = document.getElementById('film'), c = cv.getContext('2d');
        for (let i = 0; i < count; i++) {
          window.__renderAt(i / fps);
          // a Blob body uploads about ten times faster than the typed array itself
          const r = await fetch('/frame', { method: 'POST', body: new Blob([c.getImageData(0, 0, cv.width, cv.height).data]) });
          if (!r.ok) throw new Error(`frame ${i}: ${await r.text()}`);
        }
      }, [frames, FPS]);
    } catch (e) {
      if (stopped) throw new Error(`ffmpeg stopped early\n${stderr}`);
      throw e;
    } finally { clearInterval(tick); }
    console.log(`\rframes ${sent}/${frames}, encoding…`);
    ff.stdin.end();
    const code = await closed;
    if (code !== 0) throw new Error(`ffmpeg exited with ${code}\n${stderr}`);
    if (sent !== frames) throw new Error(`sent ${sent} of ${frames} frames`);
    if (errors.length) throw new Error('page errors:\n' + errors.join('\n'));
    const mb = (fs.statSync(OUT).size / 1e6).toFixed(1), s = Math.round((Date.now() - started) / 1000);
    console.log(`${OUT}\n${frames} frames, ${W}×${H} at ${FPS} fps, ${film.dur} s, ${mb} MB, in ${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`);
  } catch (e) {
    if (ff && ff.exitCode === null) ff.kill();
    console.error('\nexport failed: ' + (e && e.message ? e.message : e));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
    fs.rmSync(wav, { force: true });
  }
})();
