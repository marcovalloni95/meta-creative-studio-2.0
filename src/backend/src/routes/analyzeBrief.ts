import { Router } from 'express';
import multer from 'multer';
import { extractStructuredBrief } from '../services/briefExtractor';
import { extractTextFromDocument } from '../services/documentParser';
import { parseDocumentToRawBrief } from '../services/briefDocumentExtractor';
import { extractBriefWithAi, summarizeHeuristically } from '../services/briefSummarizer';
import type { RawBriefInput, Sector } from '../types/brief';

export const analyzeBriefRouter = Router();

// File in memoria (nessuna scrittura su disco): il documento serve solo per
// estrarne il testo, non va conservato dopo la richiesta. Limite 10MB.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Accetta multipart/form-data con:
 *  - "document": file caricato (PDF, .docx, .txt/.md) — brief creativo
 *  - "sector": stringa opzionale (uno dei Sector) per forzare il settore
 *
 * Estrazione a due livelli:
 *  1. Se ANTHROPIC_API_KEY e' configurata, Claude legge il documento e
 *     restituisce DIRETTAMENTE i campi sintetici (target, offerta,
 *     beneficio, CTA) + un riepilogo — vera comprensione, non pattern-matching.
 *  2. Altrimenti (o se la chiamata fallisce), fallback euristico: righe
 *     etichettate ("Target:", "Offerta:", ...) via briefDocumentExtractor.ts,
 *     con un riepilogo composto dai campi trovati.
 *
 * Ritorna { summary, editableFields, structuredBrief }.
 */
analyzeBriefRouter.post('/api/analyze-brief', upload.single('document'), async (req, res) => {
  try {
    let input: RawBriefInput;
    let summary: string;
    let rawText = '';

    if (req.file) {
      rawText = await extractTextFromDocument(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );

      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({
          error: 'Non sono riuscito a estrarre testo dal documento caricato. Verifica che non sia vuoto o scansionato come immagine.',
        });
      }

      const sectorOverride = (req.body.sector as Sector) || undefined;

      const aiResult = await extractBriefWithAi(rawText);
      if (aiResult) {
        input = { ...aiResult.fields, sector: sectorOverride };
        summary = aiResult.summary;
      } else {
        input = parseDocumentToRawBrief(rawText, sectorOverride);
        summary = summarizeHeuristically(input);
      }
    } else if (req.body && (req.body.productUrl || req.body.offer)) {
      input = req.body as RawBriefInput;
      summary = summarizeHeuristically(input);
    } else {
      return res.status(400).json({
        error: 'Carica un documento (brief creativo) oppure fornisci productUrl/offer nel body.',
      });
    }

    const structuredBrief = await extractStructuredBrief(input);

    return res.json({ summary, editableFields: input, structuredBrief });
  } catch (err) {
    console.error('[analyze-brief] errore:', err);
    return res.status(500).json({ error: 'Errore durante l\'analisi del documento.' });
  }
});
