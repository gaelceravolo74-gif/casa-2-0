/* =====================================================================
   Casa 2.0 — Foglio "Richieste" + email automatiche
   Da incollare in: Foglio Google → Estensioni → Apps Script → Code.gs
   Poi: Esegui › setup (una volta, per autorizzare), quindi
        Distribuisci › Nuova distribuzione › App web
          - Esegui come: Me
          - Chi ha accesso: Chiunque
   L'URL che ottieni va in Cloudflare come GOOGLE_SHEET_WEBHOOK.
   La parola segreta qui sotto va in Cloudflare come GOOGLE_SHEET_SECRET.
   ===================================================================== */

const SECRET = 'CAMBIA-QUESTA-PAROLA-SEGRETA';       // uguale a GOOGLE_SHEET_SECRET
const SHEET_NAME = 'Richieste';
const NOTIFY_TO_DEFAULT = 'info@casaduepuntozero.net'; // usata se Cloudflare non invia LEAD_TO

const COLUMNS = [
  ['id', 'N.'], ['created_at', 'Data'], ['form', 'Modulo'], ['stato_pratica', 'Stato'],
  ['nome', 'Nome'], ['cognome', 'Cognome'], ['email', 'Email'], ['telefono', 'Telefono'],
  ['indirizzo', 'Indirizzo immobile'], ['tipologia', 'Tipologia'], ['mq', 'Mq'], ['anno', 'Anno'],
  ['locali', 'Locali'], ['piano', 'Piano'], ['stato', 'Stato immobile'],
  ['messaggio', 'Messaggio / note'], ['newsletter', 'Newsletter'], ['pagina', 'Pagina'],
];

function setup() {
  sheet_();                                   // crea il foglio con le intestazioni
  MailApp.getRemainingDailyQuota();           // chiede subito il permesso di inviare email
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out_({ ok: false, error: 'unauthorized' });
    const lead = d.lead || {};

    const sh = sheet_();
    const row = COLUMNS.map(([k]) => {
      if (k === 'created_at') return lead.created_at ? new Date(lead.created_at) : new Date();
      if (k === 'form') return lead.form === 'valuta' ? 'Valutazione' : 'Contatto';
      if (k === 'stato_pratica') return 'Nuovo';
      if (k === 'newsletter') return lead.newsletter ? 'Sì' : 'No';
      return safe_(lead[k]);
    });
    sh.appendRow(row);

    if (d.send_mail && d.mail) {
      const to = d.notify_to || NOTIFY_TO_DEFAULT;
      MailApp.sendEmail({ to: to, replyTo: lead.email, name: 'Sito Casa 2.0',
        subject: d.mail.agency.subject, htmlBody: d.mail.agency.html });
      if (lead.email) {
        MailApp.sendEmail({ to: lead.email, replyTo: to, name: 'Casa 2.0 Tivoli',
          subject: d.mail.client.subject, htmlBody: d.mail.client.html });
      }
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS.map(([, label]) => label));
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#2C4F66').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('B:B').setNumberFormat('dd/mm/yyyy hh:mm');
    const stato = SpreadsheetApp.newDataValidation().requireValueInList(['Nuovo', 'In lavorazione', 'Chiuso'], true).build();
    sh.getRange(2, 4, 1000, 1).setDataValidation(stato);
  }
  return sh;
}

// un valore che inizia con = + - @ verrebbe letto come formula: lo rendiamo testo
function safe_(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
