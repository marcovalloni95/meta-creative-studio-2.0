import { Router } from 'express';
import { generateCreativeDirectorOutput } from '../services/creativeDirector';
import { buildAiImagePrompt } from '../services/promptBuilder';
import { buildLightweightAdCopy } from '../services/adCopyBuilder';
import type { GenerateAiImageRequest, GenerateAiImageResponse } from '../types/brief';

export const generateAiImageRouter = Router();

/**
 * Modalita A: genera il concept creativo completo chiamando Claude nel ruolo
 * di Creative Director/Art Director (vedi creativeDirectorSystemPrompt.ts) —
 * ritorna le 13 sezioni previste dal ruolo (brief interpretato, big idea,
 * headline, prompt finale, negative prompt, checklist, ecc.), non solo un
 * prompt grezzo.
 *
 * Se ANTHROPIC_API_KEY non e' configurata (o la chiamata fallisce), fallback
 * su un prompt semplice generato euristicamente (promptBuilder.ts) — qualita'
 * inferiore ma il flusso non si blocca.
 */
generateAiImageRouter.post('/api/generate-ai-image', async (req, res) => {
  try {
    const { brief, aspectRatio } = req.body as GenerateAiImageRequest;

    if (!brief || !aspectRatio) {
      return res.status(400).json({ error: 'brief e aspectRatio sono obbligatori.' });
    }

    let prompt: string;
    try {
      prompt = await generateCreativeDirectorOutput(brief, aspectRatio);
    } catch (err) {
      console.warn('[generate-ai-image] Creative Director (Claude) non disponibile, uso fallback euristico:', err);
      const adCopy = buildLightweightAdCopy(brief);
      prompt = buildAiImagePrompt(brief, aspectRatio, adCopy);
    }

    const response: GenerateAiImageResponse = { prompt };
    return res.json(response);
  } catch (err) {
    console.error('[generate-ai-image] errore:', err);
    return res.status(500).json({ error: 'Errore durante la generazione del concept creativo (Modalita A).' });
  }
});
