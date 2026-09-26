/* ==========================================================
   POST /api/lead — riceve i moduli "contatti" e "valuta"
   1. controlla i dati (e un campo trappola anti-spam)
   2. limita gli invii ripetuti dallo stesso indirizzo
   3. salva la richiesta nel database D1 (binding DB)
   4. copia la richiesta sul foglio Google e manda le email:
      - all'agenzia (con "rispondi a" = email del cliente)
      - al cliente, come conferma di ricezione
   Le email partono da UN solo canale:
      RESEND_API_KEY impostata  → Resend (dal dominio del sito)
      altrimenti                → Google Apps Script (dalla casella Gmail del foglio)
   Variabili (Cloudflare → Pages → Impostazioni → Variabili e segreti):
     LEAD_TO                    email dell'agenzia che riceve le richieste
     GOOGLE_SHEET_WEBHOOK       URL dell'app web di Apps Script (vedi google-apps-script/Code.gs)
     GOOGLE_SHEET_SECRET        la stessa parola segreta scritta nello script
     RESEND_API_KEY, RESEND_FROM  (facoltativi) invio email con Resend
     LEAD_WEBHOOK_URL           (facoltativo) copia verso Make / n8n / Zapier
     IP_SALT                    sale per l'hash dell'IP
   ========================================================== */

const MAX = { nome: 60, cognome: 60, email: 120, telefono: 30, messaggio: 3000, indirizzo: 200, tipologia: 40, piano: 60, stato: 40, pagina: 200 };
const TIPOLOGIE = ['Appartamento', 'Villa', 'Villetta a schiera', 'Rustico/casale', 'Commerciale'];
const STATI = ['Ottimo', 'Buono', 'Da rinfrescare', 'Da ristrutturare'];
const PHONE = '+39 338 844 9030';
const SITE = 'https://www.casaduepuntozero.net';

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

function rows(l) {
  return [
    ['Modulo', l.form === 'valuta' ? 'Valutazione immobile' : 'Contatti'],
    ['Nome', `${l.nome} ${l.cognome}`], ['Email', l.email], ['Telefono', l.telefono],
    ['Indirizzo immobile', l.indirizzo], ['Tipologia', l.tipologia], ['Superficie (mq)', l.mq],
    ['Anno', l.anno], ['Locali', l.locali], ['Piano', l.piano], ['Stato', l.stato],
    ['Messaggio / note', l.messaggio], ['Newsletter', l.newsletter ? 'Sì' : 'No'], ['Pagina', l.pagina],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- testi delle email (un solo posto, usati da Resend e da Apps Script) ---------- */
function frame(title, body) {
  return `<div style="background:#F7F1EB;padding:28px 12px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:6px;border-top:4px solid #2B789C;padding:28px 28px 22px">
    <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#2B789C;font-weight:bold;margin-bottom:10px">Casa 2.0 · Tivoli</div>
    <h2 style="font-family:Georgia,serif;color:#2C4F66;font-size:22px;line-height:1.25;margin:0 0 16px">${title}</h2>
    ${body}
  </div>
  <p style="max-width:560px;margin:14px auto 0;font-size:11.5px;color:#5E6872;text-align:center">Casa 2.0 — Via Colsereno 45, 00019 Tivoli (RM) · ${PHONE}</p>
</div>`;
}
function table(l) {
  return `<table cellpadding="7" style="border-collapse:collapse;width:100%;font-size:14px;color:#1C1C1E">${rows(l).map(([k, v]) =>
    `<tr><td style="color:#5E6872;border-bottom:1px solid #EFE4DA;width:38%;vertical-align:top">${esc(k)}</td><td style="border-bottom:1px solid #EFE4DA"><b>${esc(v)}</b></td></tr>`).join('')}</table>`;
}
function emails(lead, id) {
  const who = `${lead.nome} ${lead.cognome}`;
  const agencySubject = lead.form === 'valuta'
    ? `Nuova richiesta di valutazione — ${who} — ${lead.indirizzo}`
    : `Nuovo contatto dal sito — ${who}`;
  const agencyHtml = frame(esc(agencySubject), `${table(lead)}
    <p style="font-size:13px;color:#5E6872;margin:16px 0 0">Richiesta n. ${id ?? '—'}. Rispondi a questa email per scrivere direttamente a ${esc(lead.nome)}.</p>`);
  const clientSubject = lead.form === 'valuta'
    ? 'Abbiamo ricevuto la tua richiesta di valutazione'
    : 'Abbiamo ricevuto il tuo messaggio';
  const clientHtml = frame(`Grazie ${esc(lead.nome)}, abbiamo ricevuto la tua richiesta.`, `
    <p style="font-size:15px;line-height:1.6;color:#1C1C1E;margin:0 0 14px">${lead.form === 'valuta'
      ? 'Entro 24 ore lavorative ti chiamiamo per fissare il sopralluogo. Dopo la visita ricevi una stima chiara, basata sulle vendite reali della zona. Nessun impegno e nessun costo.'
      : 'Ti rispondiamo entro 24 ore lavorative. Se è urgente puoi chiamarci o scriverci su WhatsApp.'}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 18px"><a href="tel:+393388449030" style="color:#2B789C">${PHONE}</a> · <a href="https://wa.me/393388449030" style="color:#2B789C">WhatsApp</a></p>
    <p style="font-size:13px;color:#5E6872;margin:0 0 8px">Il riepilogo di quello che ci hai inviato:</p>
    ${table(lead)}
    <p style="font-size:12px;color:#5E6872;margin:16px 0 0">Hai ricevuto questa email perché hai compilato un modulo su <a href="${SITE}" style="color:#2B789C">casaduepuntozero.net</a>. Se non sei stato tu, ignorala.</p>`);
  return { agency: { subject: agencySubject, html: agencyHtml }, client: { subject: clientSubject, html: clientHtml } };
}

async function viaResend(env, lead, mail) {
  const base = env.RESEND_API_BASE || 'https://api.resend.com';
  const from = env.RESEND_FROM || 'Casa 2.0 <sito@casaduepuntozero.net>';
  const send = (payload) => fetch(`${base}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, ...payload }),
  });
  return Promise.all([
    send({ to: [env.LEAD_TO], reply_to: lead.email, subject: mail.agency.subject, html: mail.agency.html }),
    send({ to: [lead.email], reply_to: env.LEAD_TO, subject: mail.client.subject, html: mail.client.html }),
  ]);
}

async function notify(env, lead, id, createdAt) {
  const mail = emails(lead, id);
  const useResend = !!(env.RESEND_API_KEY && env.LEAD_TO);
  const jobs = [];
  if (useResend) jobs.push(viaResend(env, lead, mail));
  if (env.GOOGLE_SHEET_WEBHOOK) {
    jobs.push(fetch(env.GOOGLE_SHEET_WEBHOOK, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // Apps Script legge il JSON come testo semplice
      body: JSON.stringify({
        secret: env.GOOGLE_SHEET_SECRET || '',
        lead: { id, created_at: createdAt, ...lead },
        send_mail: !useResend,                                   // senza Resend, le email le manda il foglio
        notify_to: env.LEAD_TO || '',
        mail,
      }),
    }));
  }
  if (env.LEAD_WEBHOOK_URL) {
    jobs.push(fetch(env.LEAD_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, created_at: createdAt, ...lead }),
    }));
  }
  const res = await Promise.allSettled(jobs);
  return res.every((r) => r.status === 'fulfilled');
}

export async function onRequestPost({ request, env, waitUntil }) {
  const channels = env.DB || env.GOOGLE_SHEET_WEBHOOK || env.LEAD_WEBHOOK_URL || env.RESEND_API_KEY;
  if (!channels) return json({ ok: false, error: 'Servizio non configurato.' }, 503);

  let data;
  try { data = await readBody(request); } catch { return json({ ok: false, error: 'Richiesta non valida.' }, 400); }

  // Campo trappola: le persone non lo vedono, i bot lo compilano. Rispondiamo "ok" senza salvare.
  if (data.website) return json({ ok: true });

  const { lead, error, field } = validate(data);
  if (error) return json({ ok: false, error, field }, 422);

  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const ipHash = await sha256(`${env.IP_SALT || 'casa2-tivoli'}|${ip}`);
  const now = new Date().toISOString();
  let id = null;

  if (env.DB) {
    // Massimo 5 richieste ogni 10 minuti dallo stesso indirizzo
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','-10 minutes')"
    ).bind(ipHash).first();
    if (recent && recent.n >= 5) return json({ ok: false, error: 'Troppe richieste in poco tempo. Riprova tra qualche minuto o chiamaci.' }, 429);

    const r = await env.DB.prepare(
      `INSERT INTO leads (form, nome, cognome, email, telefono, messaggio, newsletter, indirizzo, tipologia, mq, anno, locali, piano, stato, pagina, ip_hash, user_agent, consenso_privacy_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`
    ).bind(
      lead.form, lead.nome, lead.cognome, lead.email, lead.telefono || null, lead.messaggio || null, lead.newsletter,
      lead.indirizzo || null, lead.tipologia, lead.mq, lead.anno, lead.locali, lead.piano || null, lead.stato,
      lead.pagina || null, ipHash, clean(request.headers.get('User-Agent'), 300), now
    ).run();
    id = r.meta && r.meta.last_row_id;
  }

  // foglio Google ed email partono in background: la persona non aspetta
  const job = notify(env, lead, id, now).catch(() => false);
  if (waitUntil) waitUntil(job); else await job;

  return json({ ok: true, id });
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  return json({ ok: false, error: 'Metodo non consentito.' }, 405);
}
