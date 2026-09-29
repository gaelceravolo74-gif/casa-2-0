# L'ufficio di Casa 2.0: composizione esatta

> **Però, questo è solo un punto di partenza.** È la ricostruzione "1 su 100" dell'ufficio:
> fedele nelle proporzioni e nella disposizione, ma può migliorare nettamente (materiali,
> luce, persone, dettagli ancora mancanti).

Fonte: la foto `assets/casa-ufficio.jpg` (branch `claude/nifty-galileo-od3h8a`) e il codice
in `codice/ufficio-3d.js` (funzioni `shopfront`, `officeRoom`, `sceneOffice`).

## 1. La sequenza (a 100 BPM, `T.office` = 28,8 s)

| Tempo | Cosa succede |
|---|---|
| 28,8–29,6 | Dalla vista di Tivoli la camera scende alla **vetrina** di Via Colsereno 45 (pan verticale, `inOutCubic`). |
| 29,65–30,05 | Zoom dentro la **porta a vetri** (`inQuart`, fino a ×8): l'interno si vede attraverso l'apertura e cresce fino a riempire il fotogramma. La porta si apre verso l'interno. Campanello della porta a 29,65. |
| 29,8–30,6 | Un passo dentro mentre si legge "Vieni a trovarci." |
| 30,3–31,2 | La camera cammina fino alla **parete cobalto** con il logo bianco; la parete diventa lo sfondo della call to action. |

## 2. La vetrina (coordinate schermo, 1080×1920, `SF_Y` = 250)

- Muro in **pietra** chiara `[226,214,196]`, conci da 140×64 sfalsati.
- **Insegna** cobalto 680×250 a (200, 330) con il logo bianco (scala 1,9).
- **Arco** largo 780, alto 1060, a partire da (150, 700): cornice in travertino `[206,190,168]`,
  interno scuro `[36,60,84]`, vetro con il cobalto interno che traspare (gradiente
  `[62,104,150]` → `[40,72,108]`) e un bagliore caldo.
- **Telai** in alluminio `[196,200,204]`: porta al centro (x 380–700), due vetrine laterali con
  6 schede immobili ciascuna (tetto ceruleo, righe di testo).
- **Scritte bianche sulla porta**: "I NOSTRI SERVIZI", "Vendita e locazione", "Consulenza
  mutui", "Valutazioni gratuite", "Gestione affitti", "Pratiche notarili". Maniglia a (662, 1310).
- **Targa** "VIA COLSERENO 45" a (770, 740), sampietrini sotto, una pianta in vaso a sinistra.

## 3. La stanza in 3D (metri, camera sulla soglia)

Proiezione: `OF = { f: 1000, vx: 540, vy: 820, L: -2.3, R: 2.1, Fl: 1.5, Ce: -1.4, B: 6.0, cob: -0.15 }`.
L'asse Y va **verso il basso**: l'occhio è a y = 0 (1,5 m dal pavimento); pavimento a
y = +1,5, soffitto a y = −1,4. X = sinistra/destra, Z = profondità.

- **Guscio**: parete sinistra x = −2,3, parete destra x = +2,1, parete di fondo z = 6,0.
  Pareti e soffitto bianco caldo (`[214..236]` con gradienti leggeri), battiscopa bianco.
- **Parete di fondo**: bianca da x = −2,3 a −0,15, poi **cobalto** da −0,15 a +2,1, con una
  lama di luce sul bordo e una luce radiale dall'alto (`[48,104,164]` → `[26,64,108]`).
  **Logo bianco in rilievo** largo 1,5 m, centrato a x ≈ 0,98, y = −0,95, con un'ombra
  navy sfalsata. Canalina e interruttore sulla parte bianca.
- **Pavimento**: listoni di pino da 19 cm verso il fondo, toni `[206,164,120]`–`[176,132,94]`,
  giunti sfalsati, venature, nodi, riflessi dei faretti. Generato con `rng(45)`.
- **Soffitto**: 5 faretti incassati a (−0,9, 2,2), (0,8, 2,3), (−0,7, 4,1), (0,9, 4,3), (0,1, 5,5).

### Arredi (dal fondo verso la camera)

| Oggetto | Posizione (x, y, z in m) | Note |
|---|---|---|
| Stampante multifunzione nera | x −0,45…0,15, z 5,35…5,95 | davanti al bordo sinistro del cobalto |
| Seconda scrivania, laminato crema | x 0,7…2,1, piano a y 0,72, z 4,55…5,35 | pannello frontale, monitor nero, portapenne |
| Due pannelli divisori bianchi | x −2,0…−1,38 e −1,28…−0,66, z 4,4 | profili in alluminio, piedini, **logo ardesia** `[67,93,109]` |
| **Poltroncina in velluto blu** | centro (0,32; 4,25) | **di profilo**, rivolta verso la seconda scrivania (+x), schienale sul lato lontano, 4 gambe cromate |
| Armadio laminato | parete sinistra, z 3,4…4,6 | due ante, maniglie in acciaio |
| Prima scrivania | x −2,3…−1,0, piano a y 0,72, z 2,85…3,75 | monitor nero, fogli |
| **Sedia da ufficio nera** | centro (−1,2; 2,72) | **vista da dietro**, accostata alla scrivania (+z): base a 5 razze, seduta blu |
| Stampa blu incorniciata | parete destra, z 4,2…4,95 | |
| **Divanetto Luigi a righe** | x 1,38…1,96, z 1,95…3,15 | lungo il lato destro, **rivolto verso la stanza**, cornice in noce intagliata, 12 colori di righe (`O_STRIPES`) |
| Ficus (pianta della gomma) | (−0,72; pavimento; 1,25) | in primo piano a sinistra, foglie verdi e bordeaux, vaso bianco |
| **Porta a vetri** | cardine a (1,11; 1,5), larga 1,0 m | telaio in alluminio, maniglia a leva, si apre verso l'interno; scritte bianche parola per parola nel piano del vetro |

Le scritte della porta interna: "I NOSTRI SERVIZI", "Vendita e locazione di Immobili",
"Consulenza Mutui", "Valutazioni Gratuite", "Residenziale Commerciale", "Gestione Affitti e
Contratti", "Pratiche Notarili", "I NOSTRI CONTATTI". Sfumano quando la porta si gira di
taglio (angolo 0,55–1,05 rad).

## 4. Regole per non sbagliare (bug già corretti una volta)

- **Orientamento dei mobili come nella foto**: la sedia nera si vede di schiena, la
  poltroncina blu di profilo, il divanetto guarda dentro la stanza. Controllare sempre
  contro la foto.
- **Scritte ferme sul vetro**: mai testo "flottante" sopra la scena. Ogni parola si
  trasforma con la matrice del piano della porta (tre punti proiettati → `c.transform`).
- **Clipping al piano vicino** (`oPoly`): senza, i poligoni dietro la camera si ribaltano.
- **Ordine di disegno**: dal fondo verso la camera; per i box si disegnano solo le facce
  visibili (`oBox` decide in base alla posizione della camera).
- La camera: `cam = { x: 0.98·pu, y: −0.3·pu, z: creep + (5.1 − creep)·pu }` con `pu` che
  va da 0 a 1 tra `T.push` e `T.cta`: finisce centrata sul logo della parete cobalto.

## 5. Dove può migliorare

Luce vera (ombre proiettate, riflesso sul pavimento lucido, luce dalla vetrina), persone
(Gael alla scrivania, il team), oggetti ancora semplificati (monitor spenti, fogli), texture
del velluto e delle righe, una leggera profondità di campo nel passaggio attraverso la porta.
