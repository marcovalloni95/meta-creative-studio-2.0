import type { RawBriefInput } from '../types/brief';

export interface AiExtractionResult {
  summary: string;
  fields: Pick<RawBriefInput, 'targetAudience' | 'offer' | 'mainProblemOrBenefit' | 'primaryCta'>;
}

/**
 * Analizza il documento brief con Claude: estrae DIRETTAMENTE i campi
 * strutturati (target, offerta, obiettivo/beneficio, CTA) in JSON, oltre a un
 * riepilogo breve leggibile. Questo e' il motivo per cui e' preferibile al
 * solo pattern-matching su etichette (briefDocumentExtractor.ts): capisce il
 * senso del documento anche quando non usa un formato "Etichetta: valore".
 *
 * Ritorna null se ANTHROPIC_API_KEY non e' configurata o la chiamata fallisce
 * — in quel caso il chiamante deve usare il fallback euristico esistente.
 *
 * Per collegare Claude: imposta ANTHROPIC_API_KEY nelle variabili d'ambiente
 * del backend (console.anthropic.com — diversa dall'abbonamento claude.ai).
 */
export async function extractBriefWithAi(rawText: string): Promise<AiExtractionResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: buildExtractionPrompt(rawText),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API ha risposto ${response.status}: ${errorBody.slice(0, 300)}`);
    }

    const data = (await response.json()) as { content?: { text?: string }[] };
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Risposta Anthropic senza testo');

    return parseExtractionResponse(text);
  } catch (err) {
    console.warn('[briefSummarizer] estrazione con Claude fallita, uso fallback euristico:', err);
    return null;
  }
}

function buildExtractionPrompt(rawText: string): string {
  return `Analizza questo documento (brief creativo per una campagna Meta Ads) ed estrai le informazioni chiave.

Rispondi SOLO con un oggetto JSON valido (nessun testo prima o dopo, nessun blocco markdown), con questa struttura esatta:
{
  "summary": "riassunto in massimo 2 frasi, in italiano, tono diretto: chi e' il brand/offerta e cosa comunica la campagna",
  "target": "descrizione sintetica del pubblico target (max 15 parole), o stringa vuota se non specificato",
  "offer": "cosa viene offerto, in modo sintetico (max 15 parole)",
  "mainBenefit": "il beneficio o obiettivo principale della campagna, sintetico (max 20 parole)",
  "cta": "la call to action, sintetica (max 8 parole), o stringa vuota se non specificata"
}

Sii sintetico: NON copiare frasi lunghe dal documento, riformula con parole tue in modo conciso.

Documento:
${rawText.slice(0, 8000)}`;
}

function parseExtractionResponse(text: string): AiExtractionResult {
  // Claude a volte avvolge il JSON in un blocco markdown nonostante l'istruzione;
  // estraiamo la porzione tra la prima { e l'ultima } per sicurezza.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Nessun JSON trovato nella risposta');

  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    summary?: string;
    target?: string;
    offer?: string;
    mainBenefit?: string;
    cta?: string;
  };

  if (!parsed.summary) throw new Error('JSON senza campo summary');

  return {
    summary: parsed.summary,
    fields: {
      targetAudience: parsed.target || undefined,
      offer: parsed.offer || undefined,
      mainProblemOrBenefit: parsed.mainBenefit || undefined,
      primaryCta: parsed.cta || undefined,
    },
  };
}

/** Fallback euristico: compone una frase leggibile dai campi gia' estratti via etichette. */
export function summarizeHeuristically(extracted: RawBriefInput): string {
  const parts: string[] = [];

  if (extracted.offer) parts.push(extracted.offer.slice(0, 150));
  if (extracted.targetAudience) parts.push(`Target: ${extracted.targetAudience}`);
  if (extracted.mainProblemOrBenefit) parts.push(extracted.mainProblemOrBenefit.slice(0, 150));
  if (extracted.primaryCta) parts.push(`CTA: ${extracted.primaryCta}`);

  if (parts.length === 0) {
    return 'Non sono riuscito a estrarre informazioni chiare dal documento. Verifica e compila manualmente i campi qui sotto.';
  }

  return parts.join(' — ').slice(0, 400);
}
