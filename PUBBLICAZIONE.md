# Pubblicare il sito Casa 2.0

Il sito è pronto: pagine, moduli, database, foglio Google ed email automatiche sono già scritti e provati.
Servono due account gratuiti: **Cloudflare** (ospita il sito e il database) e **Google** (foglio + invio email).
Tempo richiesto: circa 30 minuti.

---

## 1. Il foglio Google (dove arrivano le richieste + le email)

1. Crea un nuovo Foglio Google, chiamalo per esempio `Casa 2.0 — Richieste dal sito`.
2. Menu **Estensioni → Apps Script**.
3. Cancella tutto quello che c'è in `Code.gs` e incolla il contenuto del file `google-apps-script/Code.gs` di questo repository.
4. Alla riga `const SECRET = 'CAMBIA-QUESTA-PAROLA-SEGRETA';` scrivi una parola segreta lunga a tua scelta (es. `tivoli-colsereno-2026-xk93`). **Annotala.**
5. Salva (icona del dischetto), scegli la funzione **setup** in alto e premi **Esegui**. Google chiede i permessi: accetta
   (serve per scrivere nel foglio e inviare le email dalla tua casella).
6. **Distribuisci → Nuova distribuzione → tipo "App web"**
   - Esegui come: **Me**
   - Chi ha accesso: **Chiunque**
7. Premi **Distribuisci** e copia l'**URL dell'app web** (finisce con `/exec`). **Annotalo.**

Da questo momento ogni richiesta dal sito diventa una riga nel foglio `Richieste`, con la colonna *Stato* (Nuovo / In lavorazione / Chiuso) da aggiornare a mano.

> Se in futuro modifichi lo script: **Distribuisci → Gestisci distribuzioni → modifica → Nuova versione**, l'URL resta lo stesso.

---

## 2. Cloudflare: il sito

1. Crea un account su <https://dash.cloudflare.com>.
2. **Workers e Pages → Crea → Pages → Connetti a Git** → scegli il repository `casa-2-0` (branch `main`, dopo aver unito la pull request).
3. Impostazioni di build:
   - Framework: **Nessuno**
   - Comando di build: *(lascia vuoto)*
   - Cartella di output: `.` *(un punto)*
4. Premi **Salva e distribuisci**. Dopo un minuto il sito è online su un indirizzo `….pages.dev`.

## 3. Cloudflare: il database

1. **Workers e Pages → D1 → Crea database** → nome `casa2-leads`.
2. Apri il database → scheda **Console** → incolla il contenuto del file `db/schema.sql` → **Esegui**.
3. Copia l'**ID del database** e incollalo in `wrangler.toml` al posto di `INSERISCI-QUI-L-ID-DEL-DATABASE`
   (oppure chiedimelo e lo faccio io).
4. Nel progetto Pages → **Impostazioni → Associazioni (Bindings) → Aggiungi → Database D1**:
   nome variabile `DB`, database `casa2-leads`.

## 4. Cloudflare: le variabili

Progetto Pages → **Impostazioni → Variabili e segreti** (per l'ambiente *Produzione*):

| Nome | Valore | Tipo |
|---|---|---|
| `LEAD_TO` | `info@casaduepuntozero.net` (chi riceve le richieste) | testo |
| `GOOGLE_SHEET_WEBHOOK` | l'URL `/exec` del punto 1.7 | segreto |
| `GOOGLE_SHEET_SECRET` | la parola segreta del punto 1.4 | segreto |
| `ADMIN_TOKEN` | una password lunga almeno 16 caratteri, per l'area riservata | segreto |
| `IP_SALT` | una qualsiasi frase casuale | segreto |

Poi **Deployments → Riprova la distribuzione** perché il sito legga le nuove variabili.

*Facoltativo:* se vuoi che le email partano dall'indirizzo del sito invece che dal Gmail del foglio,
crea un account su <https://resend.com>, verifica il dominio `casaduepuntozero.net` e aggiungi
`RESEND_API_KEY` (segreto) e `RESEND_FROM` = `Casa 2.0 <sito@casaduepuntozero.net>`.
Con Resend attivo il foglio continua a ricevere le righe ma non manda più le email (niente doppioni).

## 5. Il dominio

Progetto Pages → **Domini personalizzati → Configura** → `www.casaduepuntozero.net` (e `casaduepuntozero.net`).
Cloudflare indica i record DNS da inserire presso il registrar del dominio (o li imposta da solo se il dominio è già su Cloudflare).

## 6. Prova finale (5 minuti)

- [ ] Apri il sito dal telefono e dal computer: tutte le pagine si aprono dall'alto.
- [ ] **Valuta** (`/valuta`): invia una richiesta con la tua email → compare la conferma animata.
- [ ] **Contattaci**: invia un messaggio → compare "Richiesta ricevuta".
- [ ] Nel foglio Google compaiono 2 righe nuove.
- [ ] Ricevi 2 email da agenzia (con "rispondi a" il cliente) e 2 email di conferma all'indirizzo di prova.
- [ ] Apri `/admin`, inserisci `ADMIN_TOKEN`: vedi le due richieste, puoi cambiarne lo stato e scaricare il file Excel (CSV).
- [ ] Contattaci → "Mostra la mappa" carica Google Maps.
- [ ] Cancella le righe di prova dal foglio.

## Cosa manca ancora (contenuti, non codice)

- Foto vere di Gael e del team (ora ci sono segnaposto "Foto da fornire").
- Link reali di Instagram, Facebook, LinkedIn nel footer (ora puntano a `#`).
- P.IVA / dati societari nel footer e nella privacy, se vuoi mostrarli.
- Eventuale Google Analytics / Clarity: il codice è già predisposto e si attiva solo dopo il consenso ai cookie.

## Come funziona, in breve

```
Modulo sul sito ──► /api/lead (Cloudflare)
                      ├─► database D1  ──► area riservata /admin (+ export CSV)
                      ├─► Foglio Google (riga nuova)
                      └─► email: agenzia + conferma al cliente  (Gmail del foglio, oppure Resend)
Se il server non risponde, il sito apre l'email del visitatore con il messaggio già pronto:
nessuna richiesta va persa.
```
