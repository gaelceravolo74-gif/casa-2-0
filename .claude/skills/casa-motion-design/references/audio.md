# Suono: musica ed effetti come una sola partitura

> **Però, questo è solo un punto di partenza.** La partitura attuale è "1 su 100": funziona
> e rispetta le regole qui sotto, ma può migliorare nettamente (strumenti più ricchi, mix fatto
> a orecchio, voce, più dinamica).

Codice: `codice/audio-partitura.js` (motore, foley, partitura). Tutto è sintetizzato con Web
Audio e scritto sulla tabella dei tempi `T`, la stessa dell'immagine.

## 1. Il principio

**Musica ed effetti sono una cosa sola.** Ogni effetto sonoro ha il suo posto nella battuta
e la band gli suona intorno. Quando capita un effetto la musica:

- **non abbassa il volume** (niente ducking, sidechain, automazioni, compressori sul mix);
- **non finisce** (basso e accordo tengono l'armonia anche nelle pause);
- **lo rispetta con il ritmo**: fa una pausa ritmica, oppure accelera o rallenta.

Esempi dal film:

| Momento | Come musica ed effetto si legano |
|---|---|
| Rulli del prezzo | Il loro ticchettio in trentaduesimi *è* l'hi-hat; la band va a metà tempo sotto. |
| Pompate del palloncino | Sono il battito: cassa e nota di basso su ognuna, la band accelera con loro; il cinguettio di ogni pompata canta la nota del basso due ottave sopra. |
| Ribassi | Ogni ribasso fa scendere l'armonia (Si, La, Sol, Mi, Fa♯); il suo tono discendente è accordato per atterrare sulla nuova nota del basso. |
| Riavvolgimento | L'accordo di Fa♯ cresce al contrario e si alza come un nastro, i mesi tornano indietro accelerando, dritto su "Noi no.". |
| Punti sulla mappa, oggetti della casa | Suonano l'arpeggio (marimba in re maggiore pentatonico). |
| Timbri | Sono il rullante (backbeat), cassa e basso con loro; la penna scrive nelle pause sopra il basso tenuto. |
| Notifiche | Sono la melodia (La, Do♯, Mi); l'hi-hat risponde in levare. |
| Mirino che blocca il prezzo | La band si ferma (il basso tiene) e riparte con il colpo su "Prezzo giusto.". |
| Telefono che vibra | Suonano solo gli hi-hat che raddoppiano, poi un rullo porta a VENDUTO. |
| Ufficio | Metà tempo, caldo; il campanello della porta suona in una pausa dell'arpeggio. |
| Tap sul pulsante | Un istante di spazio, poi un rullo in trentaduesimi fino al logo. |

## 2. La partitura "a drum machine"

La funzione `band(t0, accordo, pattern)` scrive un tratto di band con un carattere per
sedicesimo; `.` è una pausa, ed è lì che parlano gli effetti:

```js
band(T.docs, 'G', {
  kick: 'x...x...X...x...',   // cassa su 1 e su ogni timbro
  bass: 'x---x---x---x.o.',   // il basso tiene fra un timbro e l'altro
  hat:  '.............hxx',   // hi-hat solo come ripresa verso la battuta dopo
  keys: 'x.......x.......',   // accordo di piano elettrico su "Ci pensiamo noi."
});
```

Simboli: kick `X/x/o`, clap `x/o`, snr `x/o`, hat `x` chiuso, `o` aperto, `h` piano,
shk shaker, bass `x` fondamentale, `o` ottava, `-` tiene; arp `abcd`/`ABCD` note
dell'arpeggio; keys `x` accordo tenuto fino al successivo. `cresc: [da, a]` per i crescendi.
Il pad tiene l'accordo per tutto il tratto.

Armonia: Si minore per il problema, Re maggiore da "Noi no."; 100 BPM; il logo sonoro di
quattro note (La–Re–Fa♯–La) suona una sola volta, alla fine.

## 3. Cosa decide chi prevale

- Dove un effetto racconta la storia (rulli, pompate, mesi, ribassi, punti, oggetti, timbri,
  notifiche, chiavi, campanello, tap), l'effetto prevale: la musica gli lascia la sua zona
  di frequenze e il suo posto nel ritmo.
- Alle svolte (hook, "Noi no.", VENDUTO, GRATIS, logo) prevale la band, con un colpo pieno.
- Mai un arpeggio o una melodia sopra un effetto che parla ("canzoncina").

## 4. Mix e master

- Bus musica, batteria ed effetti a **livelli fissi**. Riverbero generato, delay ping-pong
  a otto tap in avanti (deterministico: un loop di feedback varia da un render all'altro).
- Master: passa-alto 30 Hz → presenza 2,8 kHz → shelf 8 kHz → **soft clipper senza memoria**
  (un picco non abbassa niente dopo di sé). Gli impatti hanno un compressore tutto loro.
- Obiettivi misurati nella versione attuale: effetti principali 11–29 dB sopra la musica nella
  loro banda; nessun calo ≥ 9 dB sotto la mediana locale per ≥ 100 ms; colpi entro ±8 ms
  dall'immagine; −13,6 LUFS, true peak −1,2 dBTP dopo AAC.
- Prima di un colpo grosso, lo swell si ferma pochi millisecondi prima del battere:
  il colpo arriva pulito, senza che si senta un buco.

## 5. Come verificare

1. Render offline con `window.__renderAudio(0, 40, 48000)`.
2. Stem separati (musica / effetti) azzerando i bus, e confronto effetto per effetto nella
   sua banda.
3. Rilevatore di buchi sul mix completo (RMS a 50 ms contro la mediana di 1,2 s).
4. Spettrogrammi zoomati con i marcatori degli eventi; grafico "a corsie" effetti/strumenti.
5. Attacchi (spectral flux) contro la tabella dei tempi per la sincronia.
6. Dopo l'export: loudness e true peak dell'AAC decodificato, correlazione con il master.

## 6. Dove può migliorare

Strumenti campionati o sintesi più ricca, una voce fuori campo, più contrasto tra le sezioni
(oggi LRA ~2 LU), un mix fatto ascoltando su telefono, cuffie e casse, sound design dei
foley più realistico (carta, penna, chiavi registrate).
