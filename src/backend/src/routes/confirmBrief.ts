import { Router } from 'express';
import { extractStructuredBrief } from '../services/briefExtractor';
import type { RawBriefInput } from '../types/brief';

export const confirmBriefRouter = Router();

/**
 * Ricalcola il brief strutturato a partire dai campi che l'utente ha
 * eventualmente corretto a mano nello step di verifica (dopo l'analisi del
 * documento). Stesso identico calcolo di /api/analyze-brief, ma senza dover
 * ri-processare un documento.
 */
confirmBriefRouter.post('/api/confirm-brief', async (req, res) => {
  try {
    const input = req.body as RawBriefInput;

    if (!input.offer && !input.targetAudience && !input.mainProblemOrBenefit) {
      return res.status(400).json({ error: 'Compila almeno uno tra offerta, target o beneficio.' });
    }

    const structuredBrief = await extractStructuredBrief(input);
    return res.json(structuredBrief);
  } catch (err) {
    console.error('[confirm-brief] errore:', err);
    return res.status(500).json({ error: 'Errore durante la conferma del brief.' });
  }
});
