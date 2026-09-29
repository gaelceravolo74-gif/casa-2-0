# Tutto quello che ho capito sul motion design per Casa 2.0

> **Però, questo è solo un punto di partenza.** Questo lavoro è ancora "1 su 100" e può
> migliorare nettamente. Leggilo come l'idea di base da cui costruire animazioni e altre
> cose del genere, non come un risultato finito.

Fonte: il lavoro su `masterpiece/index.html` ("The Casa 2.0 Social Media Masterpiece",
40 s, 9:16), sui tre pezzi precedenti (`social/`, `motion/`, `journey/`) e su tutti i
feedback ricevuti durante le revisioni.

---

## 1. Lo scopo

Un video per TikTok, Reels e Shorts deve **trattenere** e **portare contatti**. Tutto il
resto (bellezza, tecnica) serve a quello.

- **Hook entro 1 s**: una domanda che chiama il pubblico giusto ("Hai casa a Tivoli?") e
  apre una curiosità ("Sai quanto vale davvero?"). Un loop aperto: le cifre del prezzo girano e
  non si fermano, si chiudono solo alla fine ("Quanto vale la tua casa?" → GRATIS).
- **Problema reale**, preso dal sito stesso ("Niente stime gonfiate"): la paura n. 1 del
  venditore. Mostrato, non detto: il cartellino si gonfia come un palloncino, scoppia, poi
  un anno di ribassi.
- **Interruzione di schema**: "Noi no." Cambio di tonalità, cambio di colore, cambio di ritmo.
- **Metodo**: tre pilastri, uno dopo l'altro, ognuno con un oggetto che si trasforma nel
  successivo.
- **Prova**: luoghi veri (Tivoli, il tempio di Vesta, la vetrina di Via Colsereno 45, l'ufficio),
  numeri veri (30+ anni, 24 h, 0 € anticipati).
- **Offerta** chiara e ripetuta: valutazione gratuita in 24 ore, senza impegno, WhatsApp,
  numero, sito. Il logo si scrive da solo.
- **Loop perfetto**: l'ultimo fotogramma e il primo condividono lo sfondo (il cobalto
  dell'ufficio), così il feed lo ripete senza stacco.

## 2. Lo stile

- **Un piano sequenza.** Nessun taglio netto: ogni forma diventa la successiva. È la firma
  del film ed è ciò che lo fa sembrare "costoso".
- **Tutto generato**: Canvas 2D e Web Audio, nessuna immagine, font o libreria. Un font
  monolinea costruito da scheletri di tratto; il logo ridisegnato misurando `logo@2x.png`.
  Vantaggi: file unico, nessun diritto, controllo totale, export esatto al fotogramma.
- **Palette misurata dagli asset reali** (non inventata):
  - logo: tetto ceruleo `#0B8BBE`, lettere navy `#142552`;
  - ufficio: parete cobalto `#255892`, parquet di pino, pannelli bianchi;
  - sito: primary `#2B789C` / `#5AAFD3`, navy `#2C4F66`, ink `#233F52`, paper `#F7F1EB`,
    beige `#EFE4DA`, sky `#EAF4F9`.
  - Il rosso "vecchio" del brand non si usa più. Mai colori fuori palette per dare enfasi:
    il contrasto si risolve con lo sfondo, non con un colore nuovo.
- **Tipografia**: poche parole, grandi, sul tempo. Parole chiave in un riquadro colorato
  (`{parola}` nella tabella `CAPS`). Effetti: *slam* (entra grande e si assesta, con due
  "fantasmi" di movimento) per le frasi forti, *rise* (sale da una maschera) per quelle
  narrative. Didascalie dentro le safe zone di TikTok/Reels: lontane dalla barra in alto,
  dai pulsanti a destra e dalla didascalia in basso.
- **Movimento**: easing morbidi (`inOutCubic`, `outQuint`, `outBack` per le entrate), molle
  smorzate (`spring`) per gli oggetti che arrivano, un piccolo *camera shake* (rumore che
  decade) solo sugli impatti veri. Niente movimenti lineari se non per i dettagli meccanici.
- **Luce e materia**: grana di pellicola leggera, vignetta, ombre morbide, bagliori caldi
  delle luci. Tutto disattivabile per qualità adattiva sui telefoni lenti (prima la grana,
  poi le ombre, poi la vignetta, poi la risoluzione).
- **Luoghi fedeli**: Tivoli ridisegnato dalla foto hero del sito (tempio di Vesta, terrazza
  della Sibilla, palazzi ocra, gola, cascate, pino a ombrello, Monte Catillo) con i colori
  campionati dalla foto. L'ufficio ricostruito in 3D dalla foto `casa-ufficio.jpg`
  (dettagli in `ufficio.md`).

## 3. Come pensare una sequenza

1. **Scrivi prima la tabella dei tempi** (`T`). A 100 BPM una battuta dura 2,4 s: le svolte
   cadono sui battere (Noi no. 9,6 · VENDUTO 24,0 · GRATIS 33,6 · logo 36,0). Ogni
   effetto e ogni parola ha un tempo nella tabella; immagine e suono leggono la stessa tabella,
   quindi sono sincronizzati per costruzione.
2. **Per ogni scena chiediti "da quale forma nasce e in quale forma muore?"**. Se non c'è
   risposta, manca una transizione.
3. **Una cosa alla volta al centro dell'attenzione.** Didascalia, oggetto o effetto: uno
   guida, gli altri accompagnano. Vale anche per il suono (vedi `audio.md`).
4. **Il dettaglio vero batte l'effetto speciale.** Una maniglia, le scritte bianche sul vetro,
   le venature del parquet convincono più di un bagliore in più.
5. **Pensa al telefono**: 1080×1920, visto piccolo, spesso senza audio all'inizio. Il testo
   deve reggere da solo; il suono deve reggere sugli altoparlanti del telefono (300 Hz–6 kHz).

## 4. Come si lavora (flusso che ha funzionato)

1. Leggere gli asset reali del brand e misurarli (colori, proporzioni del logo, foto).
2. Scrivere la strategia a battute (hook → offerta) e la tabella `T`.
3. Costruire il motore: canvas 1080×1920, funzione `render(t)` pura (stesso `t` → stesso
   fotogramma), player sull'orologio audio, hook `?t=12.5` per congelare un fotogramma.
4. Costruire le scene una alla volta, controllando i fotogrammi a ogni passaggio.
5. Suono: motore, foley, partitura (vedi `audio.md`).
6. Verificare: nessuna eccezione su tutta la timeline, fotogrammi chiave guardati,
   playback reale senza errori, stem audio misurati, sincronia misurata.
7. Esportare l'MP4 con `export-mp4.js` e verificarlo (fotogrammi unici, sync audio a 0
   campioni, loudness, true peak).

**Strumenti di verifica usati** (ricostruibili): render offline dell'audio via
`window.__renderAudio`, stem separati azzerando i bus, spettrogrammi con i marcatori degli
eventi, grafico "a corsie" effetti/strumenti, rilevatore di buchi di volume, analisi degli
attacchi per la sincronia, confronto fotogramma per fotogramma.

## 5. Errori fatti e feedback ricevuti (la parte più preziosa)

Ogni punto qui è un feedback reale dell'utente e cosa ne è venuto fuori.

- **"Audio da sala d'attesa"** (prima versione): musica piatta, troppo compressa, quasi
  mono. → serviva più vita, ma **non** cambiando genere.
- **"Sembra funk / discoteca, non adatto al brand"** (versione ad alto impatto): cassa dritta
  pesante, groove phonk. → Casa 2.0 è un'agenzia seria: professionalità prima dell'impatto.
- **"Troppa canzoncina, arpeggi inutili e brutti, non si sentono gli effetti"** (versione
  cinematica): un ostinato copriva gli oggetti che atterravano. → decidere sempre **cosa
  prevale** in ogni momento: dove un effetto racconta la storia, la musica gli lascia spazio.
- **"Non ci devono essere tagli: non mutare, non abbassare e poi riprendere"** (versione
  a gerarchia): la musica veniva abbassata sotto gli effetti (ducking) e silenziata prima
  delle svolte. → mai automazioni di volume sulla musica.
- **"Non mi piace. Deve essere una cosa tutt'una"** (versione orchestrale continua): gli archi
  continui non dialogavano con gli effetti. → tornare alla musica della prima versione e
  **scriverla insieme agli effetti**: pause ritmiche, accelerazioni, rallentamenti. È la
  versione attuale.
- **Bug visivi dell'ufficio**: sedie di fronte invece che di lato, scritte distorte che
  volavano. → mobili orientati come nella foto; scritte disegnate parola per parola nel
  piano del vetro, che sfumano quando la porta si gira di taglio.
- **"Non ti ho mai dato limiti di MB, qualità o tempo"**: non ottimizzare il peso a scapito
  della qualità. Meglio 30 secondi in più di render che un risultato peggiore.
- **Il feedback duro va preso sul serio**: fermarsi, capire la causa vera, correggere,
  **verificare con i numeri e guardando**, poi consegnare.

## 6. Dettagli tecnici che contano

- `render(t)` deve essere deterministico: niente `Math.random()` a runtime, solo `rng(seed)`
  e rumore a hash. Le cache pesanti (il panorama di Tivoli) si disegnano una volta.
- La geometria 3D dell'ufficio usa una vera proiezione prospettica con **clipping al piano
  vicino**: senza, i poligoni dietro la camera si ribaltano nell'immagine mentre la camera
  attraversa la stanza.
- Lo stesso disegno per due ruoli (la casa del VENDUTO è anche una casa del centro storico):
  così il passaggio è identico al pixel.
- Export: tutti i 2400 fotogrammi renderizzati offline in Chromium headless e passati a ffmpeg
  (x264 veryslow, CRF 16, BT.709); audio renderizzato offline sulla stessa timeline, quindi
  sincronia esatta. AAC a 320 kb/s con intensity stereo e PNS disattivati; un limiter tarato
  con una codifica di prova per restare sotto −1 dBTP. La grana è spenta di default
  (le piattaforme la ricomprimono in blocchi).
- Il file MP4 (~30 MB) non si mette nel repo: supera il limite di 25 MiB di Cloudflare Pages.
- Chromium può rasterizzare i bordi di tracciati complessi in modo appena diverso tra due
  export: differenze invisibili, non è un bug del codice.

## 7. Dove può migliorare (da qui si riparte)

Questo lavoro è 1 su 100. Direzioni concrete:

- **Il suono**: strumenti campionati o sintesi più ricca (pianoforte, archi veri), mix e
  master fatti da un orecchio umano, più contrasto dinamico tra le sezioni (oggi LRA ~2 LU).
- **La voce**: una voce fuori campo in italiano cambierebbe la ritenzione.
- **L'ufficio e Tivoli**: più materiali (riflessi, ombre proiettate vere, luce che entra dalla
  vetrina), persone (Gael, il team), dettagli dalla foto non ancora riprodotti.
- **Varianti**: 15 s, 6 s, formati 1:1 e 16:9, A/B test di hook diversi, versioni per
  immobili specifici.
- **Dati**: misurare la ritenzione reale su TikTok/Reels e riscrivere l'hook di conseguenza.
