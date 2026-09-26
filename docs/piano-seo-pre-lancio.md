# Casa 2.0: piano di ottimizzazione pre-lancio

Dominio: `casaduepuntozero.net` · Stack: HTML statico su Cloudflare Pages · Audit del codice nel branch `claude/casa-2-seo-launch-plan-3cvf93` (settembre 2026)

---

## 0. Bloccanti emersi dall'audit (da risolvere prima di tutto)

| # | Problema trovato nel codice | Dove | Rischio | Azione |
|---|---|---|---|---|
| 1 | **Annunci senza classe energetica / IPE** | `properties.html` (8 card con prezzo) | Sanzione da 500 a 3.000 € per annuncio (D.Lgs. 192/2005, art. 6 c. 8 e art. 15 c. 9) | Aggiungere classe + EPgl,nren (kWh/m²·anno) su ogni card |
| 2 | **Footer senza P.IVA, REA, dati d'impresa** | Tutte le pagine | Violazione art. 35 DPR 633/72 e art. 7 D.Lgs. 70/2003 | Footer legale completo (vedi Fase 4) |
| 3 | **Indirizzo "da confermare"** | `contattaci.html` | NAP incoerente, blocca la verifica GBP | Confermare l'indirizzo e togliere la dicitura |
| 4 | **Pannello "Tweaks" di sviluppo in produzione** | `index.html:730-830` | UX, contenuto duplicato, H1 che cambia via JS | Rimuovere `<aside class="tweaks">` e il relativo script |
| 5 | **Card del team "Foto da fornire"** | `chi-siamo.html` | Crollo di EEAT e di fiducia | Foto vere, oppure nascondere la sezione finché non ci sono |
| 6 | **Form in modalità fallback `mailto:`** (`WEB3FORMS_KEY = ''`) | `valuta.html:226`, contatti | Lead persi: il mailto fallisce su molti device | Attivare la key e fare un test end-to-end |
| 7 | **Canonical e sitemap puntano a `*.html`** | Tutte le pagine + `sitemap.xml` | Cloudflare Pages fa 308 da `/pagina.html` a `/pagina`, quindi il canonical punta a un URL che redirige | Uniformare a URL senza estensione (vedi Fase 3) |
| 8 | **Redirect `https://www.casa2.it/*` nel `_redirects`** | `_redirects:1` | Cloudflare Pages **non supporta** redirect di dominio in `_redirects`, quindi la regola viene ignorata | Usare Bulk Redirects o una Redirect Rule sulla zona `casa2.it` |
| 9 | **iframe Google Maps bloccato dalla CSP** (`frame-src` non dichiarato, quindi eredita `default-src 'self'`) e caricato prima del consenso | `contattaci.html:556`, `_headers` | Mappa vuota + cookie di terze parti senza consenso | Facade click-to-load + `frame-src https://www.google.com` |
| 10 | **Cartella `assets/` assente nel repo** (CSS, JS, font, immagini) | root | Se il deploy parte da questo repo, il sito esce senza stile né immagini | Verificare che il deploy usi la cartella `src/` locale completa, oppure fare commit degli asset |
| 11 | **Cookie Policy non veritiera**: cita Google Fonts (i font invece sono self-hosted), omette GA4, Clarity e Maps | `cookie.html` | Informativa non conforme (Garante, linee guida 10/06/2021) | Riscriverla (vedi Fase 4) |

---

## FASE 1: Strategia SEO avanzata e keyword

### 1.1 Cluster geografico

- **Core:** Tivoli (Centro storico, Villa Adriana, Tivoli Terme, Campolimpido, Empolitana, Braschi, Trevio, Stazione/Viale Trieste)
- **Primo anello:** Guidonia Montecelio (Villalba, Villanova, Setteville, Marco Simone), Castel Madama
- **Secondo anello (long tail a bassa concorrenza):** San Polo dei Cavalieri, Marcellina, Vicovaro, Palombara Sabina, Roma Est / Tiburtina

> I volumi vanno validati con Google Keyword Planner e con GSC dopo 60-90 giorni. La priorità qui sotto si basa su intento e valore del lead, non su volumi stimati.

### 1.2 Mappatura keyword per intento

#### Transazionale (lead: chi vende e chi compra)

| Keyword | Priorità | Pagina target | Stato |
|---|---|---|---|
| agenzia immobiliare tivoli | ★★★ | Home `/` | esiste |
| agenzie immobiliari tivoli | ★★★ | Home `/` | esiste |
| valutazione casa tivoli / valutazione immobile tivoli gratuita | ★★★ | `/valuta` | esiste |
| vendere casa tivoli | ★★★ | **`/vendere-casa-tivoli`** (landing seller) | **da creare** |
| case in vendita tivoli / appartamenti in vendita tivoli | ★★★ | `/immobili` + schede singole | parziale |
| appartamento affitto tivoli | ★★ | `/immobili?tipo=affitto` → meglio **`/affitto-tivoli`** | da creare |
| agenzia immobiliare guidonia / villalba | ★★ | **`/zone/guidonia-villalba`** | da creare |
| agenzia immobiliare castel madama | ★★ | **`/zone/castel-madama`** | da creare |
| case in vendita villa adriana / tivoli terme | ★★ | `/zone/villa-adriana`, `/zone/tivoli-terme` | da creare |
| gestione affitti tivoli / affitto con agenzia tivoli | ★ | `/servizi/affitti` | da creare (oggi è un'ancora) |
| buy house tivoli italy / property for sale tivoli | ★ | `/investors` (EN) | esiste |

#### Informazionale (top funnel, EEAT, link interni verso `/valuta`)

| Keyword / domanda | Formato | URL proposto | CTA interna |
|---|---|---|---|
| prezzi case tivoli al mq / quotazioni immobiliari tivoli | Osservatorio con dati OMI + transazioni proprie, aggiornato ogni trimestre | `/quotazioni-immobiliari-tivoli` | valutazione |
| come vendere casa a tivoli | Guida step-by-step (8-10 H2) | `/guide/come-vendere-casa-tivoli` | valutazione |
| quanto costa vendere casa (tasse, provvigione, notaio) | Guida + tabella costi | `/guide/costi-vendita-casa` | valutazione |
| documenti per vendere casa (APE, conformità urbanistica e catastale) | Checklist scaricabile (lead magnet) | `/guide/documenti-vendita-casa` | download con email |
| vivere a tivoli: quartieri | Guida quartieri, 1 H2 per zona | `/guide/quartieri-tivoli` | ricerca su misura |
| mutuo prima casa under 36 / agevolazioni | Guida aggiornata | `/guide/mutuo-prima-casa` | contatto |
| cedolare secca / contratto 3+2 canone concordato tivoli | Guida per proprietari | `/guide/affittare-casa-tivoli` | gestione affitti |
| provvigione agenzia immobiliare quanto si paga | FAQ approfondita | `/guide/provvigione-agenzia` | contatto |

Ritmo editoriale consigliato: 2 contenuti al mese, firmati da **Gael Ceravolo** con box autore (foto, "agente immobiliare dal 1994", numero REA). È questo il segnale EEAT principale del settore YMYL-adjacent.

#### Navigazionale (difesa del brand)

| Keyword | Pagina | Azione |
|---|---|---|
| casa 2.0 tivoli / casa due punto zero | Home | Title col brand in testa, GBP verificato, sitelinks |
| casa 2.0 immobiliare / casa 2.0 via colsereno | Home, `/contattaci` | NAP identico ovunque |
| gael ceravolo | `/chi-siamo` | Schema `Person` + profilo LinkedIn in `sameAs` |
| casa 2.0 recensioni | GBP | Strategia recensioni (Fase 2) |
| casa 2.0 immobiliare.it | `/immobili` | Link al profilo portale già presente |

> Rischio di brand: "Casa 2.0" è un nome generico condiviso da altre attività in Italia. La disambiguazione passa da GBP, dal nome completo nei title ("Casa 2.0 Tivoli") e da `sameAs` coerente.

### 1.3 Architettura URL target

```
/                               Home (agenzia immobiliare tivoli)
/chi-siamo
/servizi                        hub
  /vendere-casa-tivoli          seller landing (keyword di maggior valore)
  /comprare-casa-tivoli
  /affitto-tivoli
/valuta                         lead magnet
/immobili                       elenco (oggi properties.html → rinominare + 301)
  /immobili/appartamento-vendita-tivoli-via-empolitana-110mq
/zone/villa-adriana | /zone/tivoli-terme | /zone/guidonia-villalba | /zone/castel-madama
/quotazioni-immobiliari-tivoli
/guide/...
/investors                      EN
/contattaci  /privacy  /cookie
```

Regole: minuscolo, trattini, niente `.html`, niente stop word inutili, keyword + località. `properties.html` → `/immobili` (URL in italiano, coerente con la lingua della pagina) con 301.

### 1.4 Tag on-page per le pagine fondamentali

Limiti operativi: Title ≤ 60 caratteri (circa 580 px), Meta description 140-155 caratteri, un solo H1, H2 che rispondono a sotto-intenti.

#### Home

| Tag | Attuale | Proposta |
|---|---|---|
| URL | `/` | `/` |
| Title | Casa 2.0 — Agenzia Immobiliare a Tivoli dal 1994 | **Agenzia Immobiliare a Tivoli dal 1994 · Casa 2.0** (keyword in testa; OK anche l'attuale) |
| Meta | ok | *Agenzia immobiliare a Tivoli dal 1994: vendita, acquisto e affitto a Tivoli, Villa Adriana, Guidonia e Castel Madama. Valutazione gratuita in 24 ore.* |
| H1 | "Vendi casa a Tivoli, al giusto prezzo…" | Mantenere, ma rendere **statico nell'HTML** (oggi il pannello Tweaks lo riscrive via JS) |
| H2 | Metodo / Città | H2 tematici: "Vendere casa a Tivoli con il Metodo Casa 2.0", "Immobili in vendita e affitto a Tivoli", "Le zone in cui operiamo" (con link alle pagine zona), "Recensioni dei clienti", "Valutazione gratuita del tuo immobile" |

Mancano in home: un blocco **immobili in evidenza** (3 card con link alle schede), un blocco **zone** con link interni e un blocco **recensioni** (embed o citazioni verificate).

#### Chi siamo

| Tag | Proposta |
|---|---|
| URL | `/chi-siamo` |
| Title | **Chi siamo · Gael Ceravolo e il team · Casa 2.0 Tivoli** |
| Meta | *Dal 1994 a Tivoli: conosci Gael Ceravolo e il team di Casa 2.0. Agenti immobiliari iscritti al REA di Roma, esperienza locale e metodo trasparente.* |
| H1 | Oggi l'H1 è "NON È SOLO LAVORO." (senza keyword, testo animato). Proposta: **"Casa 2.0: agenti immobiliari a Tivoli dal 1994"**; la frase emozionale resta visivamente, ma come `<p>` |
| H2 | "Gael Ceravolo, Founder & Broker", "Il team", "La nostra storia a Tivoli (1994-oggi)", "I nostri numeri", "Iscrizioni e garanzie" (REA, polizza RC, associazione di categoria se presente) |

#### Servizi (hub + landing dedicate)

| Tag | Hub `/servizi` | `/vendere-casa-tivoli` |
|---|---|---|
| Title | Servizi immobiliari a Tivoli: vendita, acquisto, affitto · Casa 2.0 | **Vendere Casa a Tivoli: Valutazione e Vendita · Casa 2.0** |
| Meta | *Vendita, acquisto e affitto a Tivoli con un unico referente: valutazione, marketing, mutuo, notaio. Dal 1994, senza costi anticipati.* | *Vuoi vendere casa a Tivoli? Valutazione gratuita su dati reali, foto professionali, portali e report settimanali. Paghi solo a vendita conclusa.* |
| H1 | I servizi immobiliari di Casa 2.0 a Tivoli | Vendere casa a Tivoli, al giusto prezzo |
| H2 | Per chi vende · Per chi compra · Per chi affitta · Domande frequenti | Quanto vale la tua casa · Il nostro metodo in 5 fasi · Tempi medi di vendita a Tivoli · Costi e provvigione · Documenti necessari · Casi reali · FAQ |

Oggi i tre servizi sono ancore (`#vende`) nella stessa pagina: un'ancora non può posizionarsi su "vendere casa tivoli". Serve una pagina per intento.

#### Singolo immobile (template da creare)

| Tag | Pattern |
|---|---|
| URL | `/immobili/{contratto}-{tipologia}-{comune}-{zona/via}-{mq}mq` → es. `/immobili/vendita-appartamento-tivoli-empolitana-110mq` |
| Title | `{Tipologia} in {vendita/affitto} a {Comune}, {Zona} · {mq} m² · Casa 2.0` |
| Meta | `{Tipologia} di {mq} m² a {Zona}, {Comune}: {n} camere, {n} bagni, {plus}. Classe {X}. Prezzo {€}. Visita con Casa 2.0.` |
| H1 | `{Tipologia} {mq} m² in {vendita} a {Comune} – {Zona}` |
| H2 | Descrizione · Caratteristiche · **Efficienza energetica** (classe + IPE, obbligatorio) · Planimetria · Posizione e servizi in zona · Richiedi una visita |
| Extra | Gallery con `alt` descrittivi, form "Richiedi visita" precompilato con il codice immobile, link "Immobili simili" e "Zona {X}" |
| Contenuto | Descrizione **originale**, non copiata da Immobiliare.it: se è identica, Google la considera duplicata e premia il portale |
| Venduto | Pagina lasciata online con badge "Venduto" per 6-12 mesi (prova sociale); poi 301 alla pagina zona. Mai 404 |

Oggi `properties.html` rimanda tutto a Immobiliare.it: il sito regala al portale il traffico long-tail ("appartamento vendita tivoli viale trieste"). Le schede interne sono l'investimento SEO con il ritorno più alto dopo la landing seller.

### 1.5 Dati strutturati (Schema.org)

Stato attuale: `RealEstateAgent` + `WebSite` in home, `FAQPage` in servizi. La base è buona; di seguito le correzioni.

**A. `RealEstateAgent` (home, o sitewide tramite `@id`)**, versione corretta:

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.casaduepuntozero.net/#agency",
  "name": "Casa 2.0",
  "alternateName": "Casa 2.0 Tivoli",
  "legalName": "<RAGIONE SOCIALE ESATTA DA VISURA>",
  "vatID": "IT<PARTITA IVA>",
  "taxID": "<CODICE FISCALE>",
  "url": "https://www.casaduepuntozero.net/",
  "logo": "https://www.casaduepuntozero.net/assets/logo.png",
  "image": ["https://www.casaduepuntozero.net/assets/ufficio-esterno.jpg"],
  "telephone": "+393388449030",
  "email": "info@casaduepuntozero.net",
  "priceRange": "€€",
  "foundingDate": "1994",
  "founder": { "@id": "https://www.casaduepuntozero.net/chi-siamo#gael" },
  "address": { "@type": "PostalAddress", "streetAddress": "Via Colsereno 45", "addressLocality": "Tivoli", "addressRegion": "RM", "postalCode": "00019", "addressCountry": "IT" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0.0, "longitude": 0.0 },
  "hasMap": "https://maps.google.com/?cid=<CID DEL GBP>",
  "openingHoursSpecification": [ "…invariato…" ],
  "areaServed": [ "…invariato; aggiungere San Polo dei Cavalieri, Marcellina, Vicovaro se servite…" ],
  "sameAs": [
    "https://maps.google.com/?cid=<CID>",
    "https://www.immobiliare.it/agenzie-immobiliari/385414/casa-2-0-tivoli/",
    "https://www.idealista.it/pro/<slug>/",
    "https://www.facebook.com/<pagina>",
    "https://www.instagram.com/<profilo>"
  ],
  "makesOffer": [
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Valutazione immobiliare gratuita", "url": "https://www.casaduepuntozero.net/valuta" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Intermediazione vendita immobili", "url": "https://www.casaduepuntozero.net/vendere-casa-tivoli" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Gestione affitti", "url": "https://www.casaduepuntozero.net/affitto-tivoli" } }
  ]
}
```

Correzioni specifiche:
- `geo`: le coordinate attuali (41.9626, 12.7958) sono generiche su Tivoli. Vanno sostituite con quelle **esatte del pin GBP** di Via Colsereno 45.
- `legalName`: oggi è "Casa 2.0 — Gael Ceravolo". Deve essere la denominazione esatta della visura camerale.
- Rimuovere `potentialAction: ReserveAction` (semantica errata: non è una prenotazione).
- **Non** inserire `aggregateRating` con recensioni raccolte sul proprio sito: per LocalBusiness Google le considera *self-serving* e non mostra le stelle.

**B. `Person`** per Gael Ceravolo in `/chi-siamo` (`@id` `#gael`): `jobTitle` "Agente immobiliare", `worksFor` → `#agency`, `knowsAbout`, `sameAs` LinkedIn. Riutilizzarlo come `author` di ogni guida.

**C. `BreadcrumbList`** su tutte le pagine interne.

**D. Scheda immobile**: `RealEstateListing` (con `datePosted`) che contiene come `mainEntity` il bene: `Apartment` / `SingleFamilyResidence` con `floorSize` (QuantitativeValue, `unitCode` "MTK"), `numberOfRooms`, `numberOfBathroomsTotal`, `address`, `geo`; più un `offers` → `Offer` con `price`, `priceCurrency` "EUR", `availability`, `businessFunction` (Sell / LeaseOut) e `offeredBy` → `#agency`. Google non ha un rich result dedicato agli immobili, ma lo schema rafforza la comprensione dell'entità e serve alle AI Overview.

**E. `FAQPage`**: può restare, ma dal 2023 Google mostra il rich result FAQ solo per siti governativi e sanitari. Non aspettarti stelline o espansioni in SERP.

**F. `Article`** sulle guide, con `author` → `#gael`, `datePublished` e `dateModified`.

Validazione: Rich Results Test + Schema Markup Validator su ogni template prima del lancio.

---

## FASE 2: Conversione (CRO) e visibilità locale

### 2.1 Lead generation: valutazione gratuita (`/valuta`)

Il form attuale (indirizzo → tipologia → caratteristiche → contatti) è ben impostato. Interventi:

1. **Multi-step a 3 passaggi con barra di avanzamento.** Si parte con l'impegno minimo, i dati personali arrivano per ultimi:
   - Step 1: *Indirizzo* + *Tipologia* (1 schermo, CTA "Continua")
   - Step 2: mq, locali, piano, stato, **"Quando pensi di vendere?"** (entro 3 mesi / 3-6 mesi / oltre 6 mesi / voglio solo sapere il valore) e **"Devi anche comprare?"** (sì/no). Questi due campi sono il **lead scoring**: chi risponde "entro 3 mesi" va richiamato in giornata.
   - Step 3: Nome, Telefono (obbligatorio), Email, fascia oraria preferita, consenso privacy.
   - Cognome facoltativo: ogni campo obbligatorio in più costa conversioni.
2. **Campi nascosti**: `source_page`, `utm_source/medium/campaign`, `gclid`, codice immobile (se arriva da una scheda).
3. **Pagina `/grazie-valutazione`** dedicata (noindex), con cosa succede ora, foto di Gael, link WhatsApp e 2 guide. Serve anche per tracciare la conversione in modo pulito (GA4 `generate_lead`, Google Ads).
4. **Risposta automatica immediata** via email e WhatsApp Business, con nome dell'agente che richiamerà.
5. **Anti-spam senza attrito**: honeypot + Cloudflare Turnstile (aggiornare la CSP con `challenges.cloudflare.com`). Niente reCAPTCHA v2.
6. **Micro-copy di fiducia accanto al pulsante**: "Nessun obbligo · Risposta entro 24h · Dati mai ceduti a terzi".
7. **Promessa verificabile**: "in 24 ore" solo se è davvero sostenibile. Se il sopralluogo avviene dopo, scrivere "ti richiamiamo entro 24 ore".

### 2.2 Call to Action

| Posizione | CTA | Destinazione |
|---|---|---|
| Header (sempre) | **Valutazione gratuita** (colore accento) | `/valuta` |
| Hero home | primaria "Scopri quanto vale la tua casa", secondaria "Cerco casa" | `/valuta`, `/immobili` |
| Fine di ogni sezione servizi e guide | contestuale ("Vuoi sapere il valore di casa tua in zona Villa Adriana?") | `/valuta?zona=villa-adriana` |
| Scheda immobile | "Prenota una visita" + "Scrivi su WhatsApp" con testo precompilato col codice | form inline / `wa.me` |
| Mobile | FAB già presente (tenere) + **barra sticky in basso**: Chiama · WhatsApp · Valuta | tel / wa / valuta |
| Exit intent | già presente. Offrire un contenuto (es. "Report prezzi Tivoli 2026 in PDF"), non ripetere la stessa CTA | lead magnet |

Lead magnet secondari (per chi non è pronto): **Report prezzi al m² per quartiere** (PDF trimestrale), **Checklist documenti per vendere**, **Alert nuovi immobili** (via email o WhatsApp) per i compratori, con i campi zona, budget e tipologia. Quest'ultimo intercetta anche gli immobili "venduti prima di essere pubblicati" che il sito già promette.

### 2.3 Tracking (senza questo non si ottimizza nulla)

- GA4 con **Consent Mode v2** (obbligatorio nel SEE per usare Ads e remarketing), attivato solo dopo il consenso.
- Eventi: `generate_lead` (valuta, contatto, visita), `click_whatsapp`, `click_tel`, `click_email`, `click_immobiliare` (uscita verso il portale), `form_start` e `form_step_2` (per misurare l'abbandono per step).
- Microsoft Clarity **solo con consenso** (registra le sessioni).
- Google Search Console + Bing Webmaster Tools verificati **prima** del lancio.

### 2.4 Local SEO

#### Google Business Profile
- **Nome**: esattamente "Casa 2.0" (o "Casa 2.0 Immobiliare" **solo se** è l'insegna reale). Aggiungere "Tivoli" o altre keyword al nome è contrario alle linee guida e porta alla sospensione.
- **Categoria principale**: *Agenzia immobiliare*. **Secondarie**: *Agente immobiliare*, *Agenzia di locazione immobili* (se l'affitto è un servizio attivo), *Consulente immobiliare*.
- **Zona servita**: Tivoli, Guidonia Montecelio, Castel Madama, più i comuni del secondo anello (max 20).
- **Servizi** con descrizione di 300-750 caratteri ciascuno: Valutazione gratuita, Vendita, Acquisto, Affitti, Assistenza mutuo, Pratiche urbanistiche.
- **Link**: sito con UTM (`?utm_source=google&utm_medium=organic&utm_campaign=gbp`) per distinguere il traffico GBP in GA4; link appuntamenti → `/valuta`.
- **Foto**: minimo 15 al lancio (esterno con insegna leggibile, interno, team, Gael, immobili). Poi 2-4 al mese.
- **Post**: 1 a settimana (nuovo immobile, venduto, dato di mercato del mese).
- **Orari**: identici a sito e schema (Lun-Ven 09:00-19:30, Sab 09:30-13:00), più orari festivi.
- **Messaggi** attivi solo se qualcuno risponde entro 1 ora; altrimenti peggiorano il profilo.

#### NAP consistency
Stringa canonica unica, da copiare identica ovunque:

```
Casa 2.0
Via Colsereno 45, 00019 Tivoli (RM)
+39 338 844 9030
```

Da allineare: sito (footer, contatti, schema, privacy), GBP, Immobiliare.it, Idealista, Casa.it, Subito, Wikicasa, Facebook, Instagram, Apple Business Connect, Bing Places, PagineGialle, Registro Imprese (per coerenza della sede). Valutare un **numero fisso** dedicato all'ufficio: un fisso con prefisso 0774 è un segnale locale e rende il GBP più credibile di un cellulare.

#### Recensioni
- **Obiettivo**: più di 30 recensioni Google nei primi 6 mesi, con risposta a ciascuna entro 48 ore.
- **Processo**: richiesta al **rogito o alla consegna chiavi** (momento di massima soddisfazione), via WhatsApp con link diretto `g.page/r/<ID>/review`; biglietto con QR in ufficio; sollecito una sola volta dopo 7 giorni.
- **Recupero dello storico**: contattare i clienti degli ultimi 3-5 anni (30 anni di attività sono un patrimonio di recensioni non ancora raccolte).
- Chiedere di menzionare **zona e tipo di servizio** ("abbiamo venduto a Villa Adriana"): è un segnale di rilevanza locale. Non va imposto un testo.
- **Vietato**: incentivi, sconti in cambio di recensioni, recensioni di familiari o dipendenti, *review gating* (chiedere solo ai clienti soddisfatti). Violano le norme Google e le regole sulle pratiche commerciali scorrette (D.Lgs. 26/2023 "Omnibus").
- Sul sito: mostrare le recensioni Google (widget o citazioni con link alla fonte) e dichiarare come sono raccolte (obbligo Omnibus se si pubblicano recensioni).

#### Segnali locali on-site
- Pagine zona con contenuto reale: prezzi medi al m² della zona, servizi (scuole, stazione, bus Cotral), immobili attivi in zona, 1-2 casi venduti.
- Mappa della sede nel footer (statica, cliccabile, senza iframe prima del consenso).
- Link verso e da realtà locali: associazioni, sponsorizzazioni sportive a Tivoli, articoli sulla stampa locale (Tiburno, Tivoli Notizie), partner (notai, geometri) con pagina "partner".

---

## FASE 3: Checklist SEO tecnica pre-lancio

### Indicizzazione e crawling
- [ ] `robots.txt`: ok. Rimuovere `Disallow: /audit/` e `/uploads/` se le cartelle non esistono (rivelano struttura senza motivo).
- [ ] **Nessun `noindex` residuo** sulle pagine pubbliche; `noindex` solo su 404, grazie, privacy e cookie (già presente su privacy e cookie).
- [ ] **URL canonici senza `.html`**: canonical, `og:url`, sitemap, link interni e hreflang devono puntare a `/chi-siamo`, non a `/chi-siamo.html`. Verificare con `curl -I https://www.casaduepuntozero.net/chi-siamo.html` che risponda 308 verso `/chi-siamo`.
- [ ] **Una sola versione del dominio**: `http://` → `https://`, apex → `www` (o viceversa) con **301 in un solo hop**. Redirect Rule a livello di zona Cloudflare.
- [ ] `sitemap.xml`: URL senza `.html`, `lastmod` reale (non fisso a 2026-06-01), niente pagine noindex, inclusione delle schede immobili. `changefreq` e `priority` sono ignorati da Google: si possono togliere.
- [ ] Invio della sitemap a GSC e Bing, più ping IndexNow (Cloudflare Crawler Hints lo fa in automatico).
- [ ] Canonical self-referencing su ogni pagina, **presente anche in `valuta.html`** (c'è), con `og:url` e `og:type` (mancano su valuta).
- [ ] **hreflang**: oggi la home IT è collegata a `investors.html` EN, ma le due pagine non sono equivalenti. Rimuovere la coppia oppure creare una vera home EN; su `/investors` tenere solo `hreflang="en"` self e `x-default`.

### Redirect (il sito sostituisce il vecchio `casa2.it`)
- [ ] Esportare **tutti** gli URL indicizzati del vecchio sito (GSC vecchia proprietà, `site:casa2.it`, Screaming Frog, Wayback Machine).
- [ ] Mappa 1:1 in un foglio: vecchio URL → nuovo URL più pertinente (non tutto in home).
- [ ] Implementarla con **Cloudflare Bulk Redirects** (il `_redirects` di Pages non gestisce domini esterni).
- [ ] Tenere attivi i redirect almeno 12 mesi e usare lo strumento "Cambio di indirizzo" in GSC.
- [ ] Aggiornare i backlink principali (Immobiliare.it, directory, social) al nuovo dominio.

### Performance e Core Web Vitals
Obiettivo sul 75° percentile mobile: **LCP < 2,5 s · INP < 200 ms · CLS < 0,1**.

- [ ] Immagini hero in **AVIF/WebP**, `width`/`height` espliciti, `fetchpriority="high"` sull'immagine LCP, `loading="lazy"` su tutto il resto.
- [ ] Video drone di `chi-siamo` (`hero-story-web.mp4`): `preload="none"`, `poster` ottimizzato, sotto i 3 MB, `muted playsinline`; su mobile valutare solo il poster.
- [ ] **Effetti pesanti** (canvas a particelle del logo, cursore custom, tessere su scroll, MacBook scroll): disattivarli con `prefers-reduced-motion` e su `pointer: coarse` (il cursore custom su touch è inutile); verificare che non blocchino il main thread (INP).
- [ ] Font: `preload` già presente. Aggiungere `font-display: swap` e subset latin.
- [ ] Rimuovere lo script "Tweaks" (JS inutile in produzione).
- [ ] Lighthouse mobile ≥ 90 su Home, Valuta, Immobili; test su un Android economico reale via 4G.

### On-page tecnico
- [ ] Un H1 per pagina, **testuale e nell'HTML iniziale** (non generato da JS). Correggere home e chi-siamo.
- [ ] `alt` descrittivo su tutte le immagini (es. "Vista di Tivoli e Villa d'Este dal drone", non "tivoli-06").
- [ ] Open Graph e Twitter Card completi su ogni pagina, immagine OG 1200×630.
- [ ] `lang="it"` (ok) e `lang="en"` su investors (ok).
- [ ] Nessun link rotto (Screaming Frog o `linkinator`) e nessuna risorsa 404 (in particolare `assets/`).
- [ ] 404 personalizzata: c'è, ed è `noindex`.
- [ ] Anno nel footer: oggi "© 2025". Renderlo dinamico o aggiornarlo.

### Sicurezza e header
- [ ] HTTPS con HSTS: già presente. Attenzione a `preload` e `includeSubDomains`: vanno confermati solo se **tutti** i sottodomini sono in HTTPS.
- [ ] CSP: aggiungere `frame-src https://www.google.com https://challenges.cloudflare.com`, i domini GA4 region1 (`https://*.google-analytics.com`, `https://*.googletagmanager.com`) in `connect-src`, e `wa.me` non serve (è un link).
- [ ] Test del form da mobile, desktop e con JS disabilitato; verificare che il lead arrivi in casella **e** nel CRM/foglio.

### Dopo il lancio (prime 72 ore)
- [ ] GSC: controllo copertura, "Controllo URL" e richiesta di indicizzazione per Home, Valuta, Vendere casa, Immobili.
- [ ] Monitoraggio 404 in GSC e nei log Cloudflare, con aggiunta dei redirect mancanti.
- [ ] Verifica che gli eventi GA4 arrivino (DebugView).

---

## FASE 4: Compliance legale (Italia)

### 4.1 Obblighi di identificazione (footer di **ogni** pagina)

- **Denominazione / ragione sociale** esatta e forma giuridica (ditta individuale, srl, ecc.): art. 7 D.Lgs. 70/2003; art. 2250 c.c. per le società.
- **Sede legale** (e operativa se diversa).
- **Partita IVA**: obbligatoria nella home page del sito (art. 35 DPR 633/1972; sanzione da 258 a 2.065 €).
- **Codice fiscale**, se diverso dalla P.IVA.
- **Numero REA** e CCIAA di Roma: art. 7 D.Lgs. 70/2003 e, per le società, art. 2250 c.c.
- **Iscrizione come agente d'affari in mediazione**: il vecchio "Ruolo agenti" è stato **soppresso** (D.Lgs. 59/2010, DM 26/10/2011). Oggi si indica l'iscrizione al **Registro Imprese / REA di Roma, sezione mediatori – agenti immobiliari**. Formula: *"Agente d'affari in mediazione – sezione agenti immobiliari – iscritto al REA di Roma n. RM-XXXXXX"*. Se ci sono collaboratori che fanno mediazione, anche la loro iscrizione va indicata.
- Per le società: **capitale sociale** versato e, se unipersonale, l'indicazione "socio unico" (art. 2250 c.c.).
- **PEC** (consigliata; obbligatoria per l'impresa verso la PA).
- **Polizza RC professionale**: obbligatoria per i mediatori (art. 3 c. 5-bis L. 39/1989). Compagnia, numero di polizza e massimale vanno resi disponibili al cliente (art. 26 D.Lgs. 59/2010). Consigliato indicarli in footer o in una pagina "Note legali".
- Associazione di categoria (FIAIP / FIMAA / Anama), se iscritti: è anche un segnale di fiducia.

Footer suggerito:

```
Casa 2.0 di <Ragione sociale> – Via Colsereno 45, 00019 Tivoli (RM)
P.IVA <…> · C.F. <…> · REA Roma RM-<…> · PEC <…>
Agente d'affari in mediazione – sezione agenti immobiliari, iscr. REA Roma n. <…>
Polizza RC professionale <Compagnia> n. <…>, massimale € <…>
Privacy · Cookie · Preferenze cookie · Note legali
```

### 4.2 Annunci immobiliari

- **Classe energetica + indice di prestazione energetica globale non rinnovabile (EPgl,nren)** in **ogni** annuncio di vendita o locazione, compresi sito, social e cartelli: art. 6 c. 8 D.Lgs. 192/2005. Sanzione da 500 a 3.000 € per il responsabile dell'annuncio (art. 15 c. 9). Oggi le 8 card di `properties.html` **non li riportano**. Usare la formula standard (etichetta colorata A4…G) e, se l'APE è in corso, scrivere "APE in fase di rilascio". Diciture come "classe G" di default o "esente" senza un titolo giuridico non sono ammesse.
- **Prezzo chiaro e aggiornato.** Se si indicano spese condominiali, vanno indicate correttamente. "Trattativa riservata" è ammessa, ma penalizza sia i portali sia le conversioni.
- **Veridicità di foto, metrature e descrizioni** (Codice del Consumo, artt. 20-23, pratiche commerciali ingannevoli). Render e home staging virtuale vanno dichiarati come tali ("immagine con arredo virtuale").
- **Immobili venduti o affittati**: rimuoverli o marcarli come tali. Tenere annunci non più disponibili per attirare contatti è pubblicità ingannevole.
- **Mandato di vendita e moduli**: i formulari usati dal mediatore devono essere depositati alla CCIAA (art. 5 L. 39/1989). Se sul sito si pubblica un fac-simile, deve essere quello depositato.
- Provvigione: nelle FAQ si dice "concordata". Non va indicata una percentuale "fissa" se poi varia.

### 4.3 Privacy (GDPR, Reg. UE 2016/679, e D.Lgs. 196/2003 modificato dal D.Lgs. 101/2018)

La privacy policy attuale è un buon inizio ma **incompleta**. Deve contenere (art. 13 GDPR):
- [ ] Titolare con dati completi (ragione sociale, P.IVA, PEC).
- [ ] **Trattamenti separati per finalità**, ciascuno con la sua base giuridica:
  - risposta a richieste di contatto e valutazione: art. 6.1.b (misure precontrattuali);
  - newsletter e marketing: art. 6.1.a (consenso, **checkbox separata e non preselezionata**, già presente nel form contatti; manca nel form di valutazione);
  - obblighi di legge, **antiriciclaggio** (D.Lgs. 231/2007: i mediatori sono soggetti obbligati, con adeguata verifica e conservazione per 10 anni): art. 6.1.c;
  - statistiche e analytics: consenso.
- [ ] **Categorie di dati**, compresi quelli dell'immobile (indirizzo) collegati all'interessato.
- [ ] **Destinatari e responsabili del trattamento** (art. 28): hosting Cloudflare, Web3Forms/Make (gestione form), Google (Analytics, Maps), Microsoft (Clarity), provider email, CRM. Per ciascuno serve un DPA firmato.
- [ ] **Trasferimenti extra-UE**: Cloudflare, Google, Microsoft e Web3Forms trattano dati negli USA. Indicare la base (EU-US Data Privacy Framework e/o Clausole contrattuali standard).
- [ ] **Tempi di conservazione** distinti: lead non convertiti 24 mesi (ok); clienti per durata del rapporto + 10 anni (civilistico e antiriciclaggio); newsletter fino a revoca.
- [ ] Diritti degli interessati (artt. 15-22), revoca del consenso e **diritto di reclamo al Garante Privacy** (manca).
- [ ] Natura obbligatoria o facoltativa del conferimento dei dati e conseguenze del rifiuto.
- [ ] Assenza di processi decisionali automatizzati.
- [ ] Data di aggiornamento coerente (oggi "30 maggio 2026" convive con "© 2025").

Adempimenti interni (fuori dal sito, ma richiesti):
- **Registro dei trattamenti** (art. 30): di fatto obbligatorio, visto che il trattamento non è occasionale.
- **Nomine dei responsabili** (DPA) e **autorizzazioni** scritte ai collaboratori (Roberto, Valentina, Edoardo).
- Il DPO **non** è obbligatorio per un'agenzia di queste dimensioni.
- Form: **checkbox privacy come presa visione, non come "consenso"** per la risposta alla richiesta. La base giuridica è il contratto, non il consenso. Il testo attuale "Ho letto e accetto la Privacy Policy e autorizzo…" va riformulato in *"Ho letto l'informativa privacy"* (e il campo non deve essere necessariamente obbligatorio). Il consenso al marketing resta una checkbox separata e facoltativa.
- Newsletter: **double opt-in** e link di disiscrizione in ogni email.

### 4.4 Cookie (Linee guida del Garante del 10 giugno 2021, art. 122 Codice Privacy)

- [ ] **Banner al primo accesso** con: "Accetta tutti", "**Rifiuta tutti**" con la **stessa evidenza grafica** e "Personalizza". La **X** di chiusura equivale al rifiuto.
- [ ] **Nessun cookie o script non tecnico prima del consenso**: GA4 (salvo configurazione anonimizzata senza incrocio dati, comunque sconsigliata), **Clarity**, **iframe Google Maps**, eventuali pixel Meta o Google Ads, embed YouTube. Per la mappa: facade statica con pulsante "Carica mappa (Google)".
- [ ] Lo scroll o la prosecuzione della navigazione **non** valgono come consenso. Niente cookie wall.
- [ ] **Registrazione del consenso** (data, versione, scelte) e riproposizione dopo **6 mesi** in caso di rifiuto; con un rifiuto, il banner non va rimostrato prima di 6 mesi.
- [ ] Link permanente "**Preferenze cookie**" nel footer, per revocare o modificare il consenso.
- [ ] **Cookie Policy riscritta** con l'elenco reale: nome, fornitore, finalità, durata, prima o terza parte. Oggi cita Google Fonts (non usato, i font sono self-hosted) e **non** cita GA4, Clarity e Google Maps, che il sito prevede.
- [ ] **Google Consent Mode v2** collegato al banner (parametri `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`).
- Soluzione rapida: una CMP certificata Google (iubenda, Cookiebot, CookieYes) invece del banner custom. Il costo annuo è minore del rischio, e generano anche privacy e cookie policy aggiornate.

### 4.5 Altri requisiti

- **Pratiche commerciali e claim** (Codice del Consumo, artt. 20-23): claim come "100% valutazioni oneste", "0 sorprese sul prezzo" e "WhatsApp entro 1h" sono promesse assolute. Devono essere sostenibili e dimostrabili, oppure vanno riformulati (es. "Rispondiamo di solito entro 1 ora").
- **Recensioni** (D.Lgs. 26/2023): se vengono pubblicate, indicare se e come si verifica che provengano da clienti reali.
- **Accessibilità**: l'European Accessibility Act (D.Lgs. 82/2022, in vigore dal 28/06/2025) esenta le microimprese che forniscono servizi (meno di 10 dipendenti e fatturato ≤ 2 M€). Resta comunque consigliato il livello WCAG 2.1 AA: contrasto, focus visibile, form con `label`, alternativa al cursore custom, `prefers-reduced-motion`.
- **Diritto d'autore e immagini**: foto degli immobili con liberatoria del fotografo; foto del team con **liberatoria per l'uso dell'immagine** (art. 96 L. 633/1941) firmata da ogni collaboratore; video drone girato da operatore abilitato (Regolamento UE 2019/947, D-Flight).
- **Pagina investors (EN)**: la privacy e cookie policy devono essere disponibili anche in inglese per il pubblico estero a cui la pagina si rivolge.
- **Antiriciclaggio**: non va sul sito, ma il form "investitori esteri" raccoglie contatti che saranno oggetto di adeguata verifica. Va citato in privacy (finalità di legge).

---

## Ordine di esecuzione consigliato

| Settimana | Attività |
|---|---|
| **Pre-lancio (bloccanti)** | Punti 1-11 della tabella iniziale · footer legale · CMP cookie · privacy riscritta · canonical senza `.html` · redirect `casa2.it` · GSC, Bing e GA4 con Consent Mode · test form end-to-end |
| **Settimane 1-2** | GBP completo con 15 foto · campagna recensioni sui clienti storici · allineamento NAP sulle citazioni principali |
| **Settimane 2-4** | Landing `/vendere-casa-tivoli` · form valuta multi-step · pagina grazie + eventi GA4 |
| **Mese 2** | Template scheda immobile + migrazione degli 8 annunci · pagine zona (Villa Adriana, Tivoli Terme, Guidonia-Villalba, Castel Madama) |
| **Mese 3 in poi** | Osservatorio prezzi trimestrale · 2 guide al mese firmate da Gael · post GBP settimanali · revisione mensile delle query in GSC |

### Dati da reperire dal titolare
Ragione sociale · P.IVA · C.F. · REA · iscrizione mediatori · PEC · polizza RC (compagnia, n., massimale) · eventuale associazione di categoria · conferma indirizzo e coordinate del pin · APE di ogni immobile pubblicato · foto e liberatorie del team · account GBP, Facebook, Instagram, Idealista · elenco URL del vecchio sito `casa2.it`.
