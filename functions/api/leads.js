/* ==========================================================
   /api/leads — area riservata (solo con ADMIN_TOKEN)
   GET   /api/leads?form=valuta&status=nuovo&format=csv
   PATCH /api/leads   { id, status }
   Header richiesto: Authorization: Bearer <ADMIN_TOKEN>
   ========================================================== */

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

function authorized(request, env) {
  const token = env.ADMIN_TOKEN;
  if (!token || token.length < 16) return false;             // senza un token robusto l'area resta chiusa
  const got = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (got.length !== token.length) return false;
  let diff = 0;                                               // confronto a tempo costante
  for (let i = 0; i < token.length; i++) diff |= got.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

const COLS = ['id', 'created_at', 'form', 'status', 'nome', 'cognome', 'email', 'telefono', 'messaggio', 'newsletter',
  'indirizzo', 'tipologia', 'mq', 'anno', 'locali', 'piano', 'stato', 'pagina'];

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return json({ ok: false, error: 'Non autorizzato.' }, 401);
  if (!env.DB) return json({ ok: false, error: 'Database non configurato.' }, 503);
  const url = new URL(request.url);
  const where = [], args = [];
  const form = url.searchParams.get('form');
  const status = url.searchParams.get('status');
  if (form === 'contatti' || form === 'valuta') { where.push(`form = ?${args.length + 1}`); args.push(form); }
  if (['nuovo', 'in_lavorazione', 'chiuso'].includes(status)) { where.push(`status = ?${args.length + 1}`); args.push(status); }
  const sql = `SELECT ${COLS.join(', ')} FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 1000`;
  const { results } = await env.DB.prepare(sql).bind(...args).all();

  if (url.searchParams.get('format') === 'csv') {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '﻿' + [COLS.join(';'), ...results.map((r) => COLS.map((c) => q(r[c])).join(';'))].join('\r\n');
    return new Response(csv, { headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="richieste-casa2-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    } });
  }
  return json({ ok: true, leads: results });
}

export async function onRequestPatch({ request, env }) {
  if (!authorized(request, env)) return json({ ok: false, error: 'Non autorizzato.' }, 401);
  let d; try { d = await request.json(); } catch { return json({ ok: false, error: 'Richiesta non valida.' }, 400); }
  const id = parseInt(d.id, 10);
  if (!id || !['nuovo', 'in_lavorazione', 'chiuso'].includes(d.status)) return json({ ok: false, error: 'Dati non validi.' }, 422);
  await env.DB.prepare('UPDATE leads SET status = ?1 WHERE id = ?2').bind(d.status, id).run();
  return json({ ok: true });
}
