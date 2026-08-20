import type { AspectRatio, StructuredBrief } from '../types/brief';
import { CREATIVE_DIRECTOR_SYSTEM_PROMPT } from './creativeDirectorSystemPrompt';

/**
 * Genera il concept creativo completo (le 13 sezioni del ruolo Creative
 * Director/Art Director) chiamando Claude con il system prompt dedicato.
 *
 * Il brief e' gia' stato raccolto e confermato dall'utente nello step
 * precedente (upload documento + verifica manuale) — per questo il messaggio
 * utente istruisce esplicitamente Claude a NON fare domande di chiarimento
 * (come farebbe in una conversazione interattiva) e a usare direttamente le
 * informazioni fornite, assumendo scelte stilistiche ragionevoli solo per i
 * dettagli secondari non forniti (mai inventando prezzi, sconti o claim).
 *
 * Richiede ANTHROPIC_API_KEY. Il chiamante deve gestire il fallback (vedi
 * promptBuilder.ts) quando la chiave non e' configurata o la chiamata fallisce.
 */
export async function generateCreativeDirectorOutput(
  brief: StructuredBrief,
  aspectRatio: AspectRatio,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY non configurata');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      system: CREATIVE_DIRECTOR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserBriefMessage(brief, aspectRatio),
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

  return text.trim();
}

function buildUserBriefMessage(brief: StructuredBrief, aspectRatio: AspectRatio): string {
  const awarenessLevel = brief.funnel_stage === 'cold'
    ? 'inconsapevole o consapevole del problema (pubblico cold)'
    : 'consapevole della soluzione o del prodotto, vicino all\'acquisto (pubblico warm)';

  const lines = [
    'Ho gia\' raccolto le informazioni chiave da un brief caricato dall\'utente e confermato da lui. Non fare domande di chiarimento: usa direttamente queste informazioni e procedi subito con l\'analisi strategica e il concept, seguendo il formato di risposta con le 13 sezioni previsto dal tuo ruolo.',
    'Se un dettaglio secondario (tono, stile fotografico, palette, ambientazione specifica) non e\' esplicitamente fornito, scegli tu la soluzione piu\' sensata in base al contesto — ma non inventare MAI prezzi, sconti, risultati, recensioni o caratteristiche del prodotto non forniti.',
    '',
    `Prodotto/offerta: ${brief.key_message}`,
    `Pubblico target: ${brief.target}`,
    `Livello di consapevolezza: ${awarenessLevel}`,
    `Obiettivo della comunicazione: ${brief.objective}`,
    `Emozione dominante da comunicare: ${brief.dominant_emotion}`,
    `Scena/contesto suggerito: ${brief.suggested_scene}`,
    brief.price ? `Prezzo/offerta economica (reale, fornita dall'utente): ${brief.price}` : undefined,
    `Formato richiesto: ${aspectRatio} (${placementDescription(brief.placement)})`,
    brief.sector ? `Settore: ${brief.sector}` : undefined,
    `Mercato e lingua: Italia, italiano`,
  ].filter((line): line is string => line !== undefined);

  return lines.join('\n');
}

function placementDescription(placement: string): string {
  if (placement === 'stories') return 'Instagram/Facebook Stories';
  if (placement === 'reels') return 'Instagram Reels';
  return 'Meta feed';
}
