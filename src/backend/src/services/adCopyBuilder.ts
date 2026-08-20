import type { StructuredBrief } from '../types/brief';

export interface LightweightAdCopy {
  headline: string;
  cta: string;
}

/**
 * Copy essenziale (headline + CTA) per la Modalita A — usato sia per istruire
 * il modello immagine su quale testo includere nell'overlay, sia per
 * l'anteprima mock, cosi' la preview e il prompt sono sempre coerenti tra loro.
 *
 * Logica simile a copyGenerator.ts ma senza dipendere da un TemplateDefinition
 * (la Modalita A non usa un template di layout).
 */
export function buildLightweightAdCopy(brief: StructuredBrief): LightweightAdCopy {
  const promise = brief.key_message.split(':')[0].trim();
  const headline = truncateAtWord(capitalize(promise), 45);

  let cta = 'Scopri di piu\'';
  if (brief.message_type === 'price-based') cta = 'Scopri l\'offerta';
  else if (brief.funnel_stage === 'warm') cta = 'Prenota ora';

  return { headline, cta };
}

function truncateAtWord(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${safe}...`;
}

function capitalize(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
