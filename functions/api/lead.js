/* ==========================================================
   POST /api/lead — riceve i moduli "contatti" e "valuta"
   1. controlla i dati (e un campo trappola anti-spam)
   2. limita gli invii ripetuti dallo stesso indirizzo
   3. salva la richiesta nel database D1 (binding DB)
   4. avvisa l'agenzia via email (Resend) e/o webhook, se configurati
   Segreti opzionali (Cloudflare → Pages → Impostazioni → Variabili):
     RESEND_API_KEY, RESEND_FROM   → email di notifica
     LEAD_WEBHOOK_URL              → copia verso Make / n8n / Zapier
     IP_SALT                       → sale per l'hash dell'IP
   ========================================================== */

const MAX = { nome: 60, cognome: 60, email: 120, telefono: 30, messaggio: 3000, indirizzo: 200, tipologia: 40, piano: 60, stato: 40, pagina: 200 };
const TIPOLOGIE = ['Appartamento', 'Villa', 'Villetta a schiera', 'Rustico/casale', 'Commerciale'];
const STATI = ['Ottimo', 'Buono', 'Da rinfrescare', 'Da ristrutturare'];

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const int = (v, min, max) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
const yes = (v) => v === true || v === 'on' || v === 'true' || v === '1' || v === 'Sì';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  const fd = await request.formData();
  return Object.fromEntries(fd.entries());
}

function validate(d) {
  const form = d.form === 'valuta' ? 'valuta' : d.form === 'contatti' ? 'contatti' : null;
  if (!form) return { error: 'Modulo non riconosciuto.' };
  const lead = {
    form,
    nome: clean(d.nome, MAX.nome),
    cognome: clean(d.cognome, MAX.cognome),
    email: clean(d.email, MAX.email).toLowerCase(),
    telefono: clean(d.telefono, MAX.telefono),
    messaggio: clean(d.messaggio ?? d.note, MAX.messaggio),
    newsletter: yes(d.newsletter) ? 1 : 0,
    indirizzo: clean(d.indirizzo, MAX.indirizzo),
    tipologia: TIPOLOGIE.includes(d.tipologia) ? d.tipologia : null,
    mq: int(d.mq, 10, 5000),
    anno: int(d.anno, 1500, new Date().getFullYear() + 2),
    locali: int(d.locali, 1, 50),
    piano: clean(d.piano, MAX.piano),
    stato: STATI.includes(d.stato) ? d.stato : null,
    pagina: clean(d.pagina, MAX.pagina),
  };
  if (!lead.nome || !lead.cognome) return { error: 'Inserisci nome e cognome.', field: 'nome' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return { error: 'Inserisci un’email valida.', field: 'email' };
  if (lead.telefono && !/^[+\d][\d\s./-]{5,}$/.test(lead.telefono)) return { error: 'Numero di telefono non valido.', field: 'telefono' };
  if (form === 'valuta') {
    if (!lead.indirizzo) return { error: 'Inserisci l’indirizzo dell’immobile.', field: 'indirizzo' };
    if (!lead.telefono) return { error: 'Inserisci un numero di telefono.', field: 'telefono' };
  }
  if (!yes(d.privacy)) return { error: 'Per inviare la richiesta serve il consenso alla privacy.', field: 'privacy' };
  return { lead };
}

function summary(l) {
  const rows = [
    ['Modulo', l.form === 'valuta' ? 'Valutazione immobile' : 'Contatti'],
    ['Nome', `${l.nome} ${l.cognome}`], ['Email', l.email], ['Telefono', l.telefono],
    ['Indirizzo immobile', l.indirizzo], ['Tipologia', l.tipologia], ['Superficie (mq)', l.mq],
    ['Anno', l.anno], ['Locali', l.locali], ['Piano', l.piano], ['Stato', l.stato],
    ['Messaggio / note', l.messaggio], ['Newsletter', l.newsletter ? 'Sì' : 'No'], ['Pagina', l.pagina],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');
  return rows;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function notify(env, lead, id) {
  const rows = summary(lead);
  const subject = lead.form === 'valuta'
    ? `Nuova richiesta di valutazione — ${lead.nome} ${lead.cognome} — ${lead.indirizzo}`
    : `Nuovo contatto dal sito — ${lead.nome} ${lead.cognome}`;
  const jobs = [];
  if (env.RESEND_API_KEY && env.LEAD_TO) {
    const html = `<h2 style="font-family:Georgia,serif;color:#2C4F66">${esc(subject)}</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="color:#6B7280;border-bottom:1px solid #eee">${esc(k)}</td><td style="border-bottom:1px solid #eee"><b>${esc(v)}</b></td></tr>`).join('')}
      </table><p style="font-family:Arial,sans-serif;font-size:12px;color:#6B7280">Richiesta n. ${id} — salvata nel database.</p>`;
    jobs.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.RESEND_FROM || 'Sito Casa 2.0 <sito@casaduepuntozero.net>', to: [env.LEAD_TO], reply_to: lead.email, subject, html }),
    }));
  }
  if (env.LEAD_WEBHOOK_URL) {
    jobs.push(fetch(env.LEAD_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...lead, created_at: new Date().toISOString() }),
    }));
  }
  const res = await Promise.allSettled(jobs);
  return res.every((r) => r.status === 'fulfilled' && r.value.ok);
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB) return json({ ok: false, error: 'Database non configurato.' }, 503);

  let data;
  try { data = await readBody(request); } catch { return json({ ok: false, error: 'Richiesta non valida.' }, 400); }

  // Campo trappola: le persone non lo vedono, i bot lo compilano. Rispondiamo "ok" senza salvare.
  if (data.website) return json({ ok: true });

  const { lead, error, field } = validate(data);
  if (error) return json({ ok: false, error, field }, 422);

  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const ipHash = await sha256(`${env.IP_SALT || 'casa2-tivoli'}|${ip}`);

  // Massimo 5 richieste ogni 10 minuti dallo stesso indirizzo
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','-10 minutes')"
  ).bind(ipHash).first();
  if (recent && recent.n >= 5) return json({ ok: false, error: 'Troppe richieste in poco tempo. Riprova tra qualche minuto o chiamaci.' }, 429);

  const now = new Date().toISOString();
  const r = await env.DB.prepare(
    `INSERT INTO leads (form, nome, cognome, email, telefono, messaggio, newsletter, indirizzo, tipologia, mq, anno, locali, piano, stato, pagina, ip_hash, user_agent, consenso_privacy_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`
  ).bind(
    lead.form, lead.nome, lead.cognome, lead.email, lead.telefono || null, lead.messaggio || null, lead.newsletter,
    lead.indirizzo || null, lead.tipologia, lead.mq, lead.anno, lead.locali, lead.piano || null, lead.stato,
    lead.pagina || null, ipHash, clean(request.headers.get('User-Agent'), 300), now
  ).run();

  const id = r.meta && r.meta.last_row_id;
  // la notifica non fa aspettare l'utente
  if (waitUntil) waitUntil(notify(env, lead, id).catch(() => false));
  else notify(env, lead, id).catch(() => false);

  return json({ ok: true, id });
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  return json({ ok: false, error: 'Metodo non consentito.' }, 405);
}
