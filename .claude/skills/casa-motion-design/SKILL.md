---
name: casa-motion-design
description: Motion design per Casa 2.0 (agenzia immobiliare di Tivoli). Usala prima di progettare o modificare animazioni, film per social (TikTok/Reels/Shorts 9:16), video promozionali, transizioni, scene dell'ufficio o di Tivoli, musica ed effetti sonori generati in codice, o export MP4. Contiene lo stile, il metodo di lavoro, come pensare una sequenza, la composizione esatta dell'ufficio (Via Colsereno 45) e codice di riferimento dal film masterpiece/index.html. Triggera su "animazione", "motion", "video", "reel", "film", "transizione", "ufficio in 3D", "musica", "effetti sonori", "export mp4".
---

# Casa 2.0 · Motion design

> **Però, questo è solo un punto di partenza.** Questo lavoro è ancora "1 su 100":
> può ancora migliorare nettamente. Tutto quello che c'è qui è l'idea di base da cui
> partire per costruire animazioni e cose del genere, non un traguardo e non una
> regola chiusa. Ogni volta che la usi, cerca il modo di superarla.

Il riferimento vivo è `masterpiece/index.html` (il film di 40 s, 9:16), con lo script
`masterpiece/export-mp4.js`. Questa skill riassume cosa ha funzionato, cosa no, e perché.

## Cosa leggere

| File | Quando |
|---|---|
| `references/lezioni.md` | **Sempre, per primo.** Tutto quello che è stato capito: stile, metodo, errori fatti e feedback ricevuti. |
| `references/ufficio.md` | Quando compare l'ufficio (vetrina, porta, interno, parete cobalto). Misure, colori, posizione di ogni mobile. |
| `references/audio.md` | Quando c'è suono: musica, effetti, mix, sincronizzazione, export audio. |
| `references/codice/base-timeline.js` | Utilità, easing, spring, rumore, tabella dei tempi `T`, camera shake. |
| `references/codice/ufficio-3d.js` | L'ufficio in 3D reale (proiezione, clipping, mobili, porta con scritte) e la vetrina. |
| `references/codice/didascalie.js` | Didascalie a tempo con parole chiave, effetti slam/rise, safe zone. |
| `references/codice/audio-partitura.js` | Motore audio, foley, partitura "a drum machine", render offline. |

## Il metodo in breve

1. **Storia prima dei pixel.** Scrivi la sequenza a battute: hook (0–3 s), problema,
   interruzione, metodo, prova, offerta. Ogni battuta ha un'immagine e una frase.
2. **Una sola tabella dei tempi** (`T`, a 100 BPM: battuta 2,4 s, sedicesimo 0,15 s).
   Immagine, didascalie, musica ed effetti leggono tutti da lì.
3. **Nessun taglio netto.** Ogni scena passa la sua forma alla successiva (casa → cartellino →
   palloncino → grafico → casa → finestra → stanza → foto → telefono → Tivoli → vetrina →
   ufficio → parete → logo). L'ultimo fotogramma coincide con il primo, così il loop è pulito.
4. **Materiali veri del brand.** Logo, colori, foto dell'ufficio e di Tivoli si **misurano**
   dagli asset reali (vedi `references/lezioni.md`). Non si inventano palette.
5. **Il suono è una sola partitura**: musica ed effetti scritti insieme, sulla stessa griglia.
   La musica non si abbassa mai: fa pause ritmiche o cambia passo (vedi `references/audio.md`).
6. **Verifica guardando e misurando**: fotogrammi renderizzati, spettrogrammi, stem separati,
   loudness. Mai consegnare senza aver visto e sentito (con i numeri) il risultato.
7. **Export**: `node masterpiece/export-mp4.js` → MP4 1080×1920, 60 fps, H.264 + AAC 320k.

## Le tre regole che l'utente ha chiesto con più forza

- **Fedeltà**: l'ufficio e Tivoli devono essere *quelli veri*, riconoscibili (sedie orientate
  come nella foto, scritte ferme sul vetro, nessuna lettera che "vola" o si deforma).
- **Professionalità**: è un'agenzia immobiliare seria. Niente musica da discoteca, phonk,
  funk o "canzoncina"; niente arpeggi inutili sopra gli effetti; niente effetto "salotto" piatto.
- **Tutto connesso**: musica ed effetti sono una cosa sola. Quando capita un effetto la musica
  non abbassa il volume e non finisce: lo rispetta con il ritmo (accelera, rallenta) o con una pausa.

Ricorda: è un punto di partenza. Il prossimo lavoro deve essere migliore di questo.
