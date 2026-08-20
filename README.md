# meta-creative-studio-2.0

Tool ibrido per la generazione di creatività Meta Ads (immagini statiche), con due modalità:

- **Modalità A — AI da zero**: Claude assume il ruolo di Creative Director/Art Director (system prompt dedicato) e genera un concept creativo completo — brief interpretato, big idea, headline, prompt finale per il generatore immagine, negative prompt, checklist — a partire dal brief strutturato. Richiede `ANTHROPIC_API_KEY`; senza chiave, fallback su un prompt semplice generato euristicamente.
- **Modalità B — Template**: seleziona il template più adatto da una libreria locale in `/templates`, genera il copy (headline, bullet, CTA, badge), recupera l'immagine prodotto (via scraping URL) e compone il rendering finale **server-side**, esportando un PNG.

Sostituisce l'impianto precedente del repo (wizard "solo prompt testuale, nessuna API"): qui il backend espone endpoint reali (mockati dove serve) e il frontend mostra l'anteprima dell'immagine generata, non solo il prompt.

## Struttura del repo

```
meta-creative-studio-2.0/
├── src/
│   ├── backend/     # Express + TypeScript API
│   │   └── src/
│   │       ├── routes/       # endpoint HTTP
│   │       ├── services/     # logica: scraping, brief, prompt, template, copy, render
│   │       └── types/
│   └── frontend/    # React + TypeScript + Tailwind (Vite)
│       └── src/
│           ├── components/
│           └── api/
├── templates/       # libreria template JSON (uno per use case/settore)
└── public/
```

## Setup

Prerequisiti: Node.js ≥ 18, npm.

### Backend

```bash
cd src/backend
npm install
cp .env.example .env
npm run dev        # avvia il server su http://localhost:4000
```

### Frontend

```bash
cd src/frontend
npm install
npm run dev         # avvia Vite su http://localhost:5173
```

Il frontend chiama il backend su `http://localhost:4000` (configurabile in `src/frontend/src/api/client.ts` o via variabile `VITE_API_BASE_URL`).

## Flusso funzionale

1. **Input**: l'utente carica un documento (brief creativo / documento di conoscenza generica) in PDF, Word (.docx) o testo (.txt/.md), opzionalmente indicando il settore da un menu a tendina.
2. **`POST /api/analyze-brief`** (multipart/form-data, campo `document` + `sector` opzionale): il backend estrae il testo dal documento, riconosce righe etichettate del tipo "Target: ...", "Offerta: ...", "Obiettivo: ...", "CTA: ...", "Chi siamo: ...", "Settore: ...", "Placement: ..." (case-insensitive, con varianti comuni) e produce un **brief strutturato** (target, objective, key_message, dominant_emotion, suggested_scene, placement, brand_constraints). Se il documento non usa etichette esplicite, un fallback usa la prima riga come offerta e il resto come contesto, cosi' il flusso non si blocca comunque. Ritorna anche un **riepilogo breve** (via Claude se `ANTHROPIC_API_KEY` e' configurata, altrimenti euristico) e i campi grezzi estratti.
3. **Step di verifica**: l'utente vede il riepilogo e i campi estratti (target, offerta, obiettivo/beneficio, CTA) in un form **modificabile** — puo' correggere a mano eventuali errori di estrazione prima di procedere. Alla conferma, `POST /api/confirm-brief` ricalcola il brief strutturato con i valori (eventualmente corretti).
3. L'utente sceglie **Modalità A** o **Modalità B**.
4. **Modalità A** → `POST /api/generate-ai-image`: chiama Claude nel ruolo di Creative Director/Art Director (system prompt in `creativeDirectorSystemPrompt.ts`), passandogli il brief già raccolto e confermato (istruito a non fare domande di chiarimento, essendo un flusso one-shot). Ritorna il concept creativo completo nelle 13 sezioni previste dal ruolo (brief interpretato, big idea, angolo creativo, headline, testo overlay, direzione artistica, composizione per formato, **prompt finale pronto per il generatore**, negative prompt, checklist, elementi da aggiungere in post-produzione). Se `ANTHROPIC_API_KEY` non è configurata, fallback su un prompt semplice generato euristicamente (`promptBuilder.ts`).
5. **Modalità B** → `POST /api/generate-template-image`: seleziona il template più adatto per settore/message type dalla libreria `/templates`, genera copy (headline, 2-3 bullet, CTA, badge opzionale), associa l'immagine prodotto (dallo scraping, se disponibile) e renderizza il PNG finale **lato server** (Puppeteer su un layout HTML/CSS del template).
6. Il frontend mostra: per la Modalità A il prompt testuale (senza anteprima); per la Modalità B l'immagine renderizzata e il copy usato.

## Deploy online (Render + Vercel)

Per avere un link pubblico invece di girare solo in locale:

### Backend su Render

1. Crea un nuovo servizio su [render.com](https://render.com), collegando questo repo GitHub.
2. Render legge automaticamente `render.yaml` alla radice (Blueprint): usa il `Dockerfile` in `src/backend/Dockerfile`, che include Chromium per Puppeteer.
3. Imposta la variabile `FRONTEND_ORIGIN` con l'URL Vercel del frontend (una volta che lo hai) — altrimenti il browser blocca le richieste per CORS.
4. Al termine del deploy ottieni un URL tipo `https://meta-creative-studio-backend.onrender.com`.

Nota: sul piano free di Render il servizio va "in sleep" dopo un periodo di inattivita' — la prima richiesta dopo una pausa puo' impiegare anche 30-60 secondi.

### Frontend su Vercel

1. Su Vercel, importa questo repo e imposta come **Root Directory** `src/frontend` (il progetto contiene `vercel.json` che configura build e output).
2. Aggiungi la variabile d'ambiente `VITE_API_BASE_URL` con l'URL del backend Render (es. `https://meta-creative-studio-backend.onrender.com`).
3. Deploy: ottieni un URL tipo `https://meta-creative-studio.vercel.app`, da aprire direttamente nel browser.

Dopo il primo deploy di entrambi, torna su Render e aggiorna `FRONTEND_ORIGIN` con l'URL Vercel definitivo (per evitare errori CORS).

## Formato del documento brief

Per un'estrazione affidabile, il documento caricato dovrebbe usare righe etichettate (l'ordine non conta, tutte le etichette sono opzionali):

```
Chi siamo: Wedding Revolution, evento B2B per fornitori del settore matrimoni
Target: imprenditori del matrimonio (fotografi, location, wedding planner)
Obiettivo: vendere biglietti per l'evento
Offerta: biglietto scontato a 49€ invece di 120€
Beneficio: risolve il problema di poche richieste o richieste che non chiudono
CTA: prenota il tuo posto
Settore: events
Placement: feed
```

Varianti accettate per ogni etichetta: "Chi siamo/Azienda/Brand", "Target/Pubblico/Audience", "Obiettivo/Goal/Scopo", "Offerta/Cosa offriamo/Prodotto/Servizio", "Beneficio/Problema principale/Perche' sceglierci", "CTA/Call to action", "Settore/Sector/Categoria" (valori: dental, jewelry, real-estate, events, motorsport, professional-services), "Placement/Formato" (feed, stories, reels).

Se il documento non usa queste etichette, l'estrazione fa comunque un tentativo (prima riga come offerta, resto come contesto) ma con risultati meno precisi — vedi nota sull'estrazione euristica in `briefDocumentExtractor.ts` per il punto dove collegare un vero modello linguistico in futuro.

## Come collegare Claude per un riepilogo intelligente del brief

Il riepilogo mostrato nello step di verifica (prima della scelta modalita') usa di default un fallback euristico (compone una frase dai campi estratti via etichette). Per un riepilogo di qualita' — vera comprensione del documento, non solo pattern-matching:

1. Genera una API key su [console.anthropic.com](https://console.anthropic.com) (account separato dall'abbonamento claude.ai, a consumo).
2. Impostala come `ANTHROPIC_API_KEY` nelle variabili d'ambiente del backend (in locale nel `.env`, in produzione nel pannello Render).
3. Nessun'altra modifica richiesta: `briefSummarizer.ts` la rileva automaticamente e passa a usare Claude.

## Come collegare un vero modello immagine AI (Gemini)

Attualmente la Modalità A ritorna solo il prompt testuale (nessuna generazione immagine, mock o reale). Per aggiungere una vera generazione con Gemini Image (Nano Banana Pro):

1. Aggiungi la chiave in `src/backend/.env`:
   ```
   GEMINI_API_KEY=la-tua-chiave
   ```
2. Ricrea un servizio `src/backend/src/services/aiImageClient.ts` (rimosso in questa versione) con una funzione che chiama l'endpoint Gemini Image, passando il prompt costruito da `promptBuilder.ts` e l'aspect ratio richiesto.
3. In `routes/generateAiImage.ts`, richiama quella funzione e aggiungi `imageUrl` alla risposta (aggiorna anche `GenerateAiImageResponse` nei tipi backend/frontend e `ModeAResult.tsx` per mostrare l'immagine).

Lo stesso pattern vale per collegare un vero motore di rendering se in futuro si vuole sostituire Puppeteer (es. servizio di rendering esterno).

## Come aggiungere un nuovo template alla libreria

Ogni template è un file JSON in `/templates`. Struttura minima:

```json
{
  "template_id": "dental-lead-gen-01",
  "use_case": "dental hygiene lead gen",
  "sector": "dental",
  "message_type": "benefit-focused",
  "layout": {
    "canvas": { "width": 1080, "height": 1350 },
    "zones": {
      "main_image": { "x": 0, "y": 0, "w": 1080, "h": 700 },
      "headline": { "x": 60, "y": 740, "w": 960, "h": 140 },
      "bullets": { "x": 60, "y": 900, "w": 960, "h": 200 },
      "cta": { "x": 60, "y": 1150, "w": 960, "h": 100 },
      "badge": { "x": 780, "y": 40, "w": 260, "h": 80 }
    }
  },
  "required_fields": ["headline", "subheadline", "benefits", "cta", "badge_text"]
}
```

1. Crea il file JSON con `template_id` univoco, `sector` e `message_type` coerenti (usati da `templateSelector.ts` per lo scoring).
2. Aggiungi il layout HTML/CSS corrispondente in `src/backend/src/services/renderer.ts` (una funzione `renderX(template, data)` per ogni `template_id`, o un layout generico se le zone bastano).
3. Nessuna registrazione manuale altrove: `templates/loader.ts` carica tutti i JSON nella cartella all'avvio.

## Settori coperti dalla libreria iniziale

Template di partenza pensati per il portfolio clienti reale: odontoiatria (Kairos, Dentalift, Barbagallo/Zanzottera), gioielleria (MaisonFire), immobiliare (Green Build Solutions, Edil Rete Italia), eventi/matrimoni (Wedding Revolution), motorsport (Rally Factor, Motoracing Shop), legale (Legge3.it), ingegneria/tecnico (Ted Ingegneria, Fapir, Fraiser), formazione ristorazione (Ristobusiness), wellness/teleriabilitazione (Shoulder Center), arte/eventi culturali (Vertigo). Nuovi settori si aggiungono semplicemente con un nuovo file JSON, nessuna modifica al codice core.

## Comandi principali

| Comando | Dove | Effetto |
|---|---|---|
| `npm run dev` | `src/backend` | Avvia l'API in watch mode |
| `npm run build` | `src/backend` | Compila TypeScript in `dist/` |
| `npm run dev` | `src/frontend` | Avvia il dev server Vite |
| `npm run build` | `src/frontend` | Build di produzione del frontend |
| `npm run lint` | entrambi | ESLint |

## Note tecniche

- Il rendering server-side della Modalità B usa **Puppeteer** (HTML/CSS → screenshot PNG). È il motore più semplice da far girare subito senza dipendenze cloud, ma isolato in `renderer.ts` così è sostituibile in futuro con un servizio di rendering dedicato.
- Lo scraping URL (`urlScraper.ts`) usa `cheerio` per il parsing HTML e tenta euristiche semplici (og:title, og:image, prezzo via regex) — da rifinire per landing page realmente eterogenee.
- Nessuna chiave API è richiesta per far girare il progetto in locale: sia la generazione immagine (Modalità A) sia — se lo scraping fallisce — l'estrazione brief hanno un fallback mockato.
