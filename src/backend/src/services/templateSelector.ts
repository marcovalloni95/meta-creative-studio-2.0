import { loadTemplates } from '../templates/loader';
import type { StructuredBrief, TemplateDefinition } from '../types/brief';

/**
 * Sceglie il template piu' adatto per settore e message type.
 * Scoring semplice: +2 se il settore combacia, +1 se il message type combacia.
 * A parita' di punteggio, vince il primo trovato (ordine dei file in /templates).
 */
export function selectTemplate(brief: StructuredBrief, explicitTemplateId?: string): TemplateDefinition {
  const templates = loadTemplates();

  if (templates.length === 0) {
    throw new Error('Nessun template disponibile in /templates.');
  }

  if (explicitTemplateId) {
    const found = templates.find((t) => t.template_id === explicitTemplateId);
    if (found) return found;
    throw new Error(`Template "${explicitTemplateId}" non trovato.`);
  }

  const scored = templates.map((template) => ({
    template,
    score: scoreTemplate(template, brief),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].template;
}

function scoreTemplate(template: TemplateDefinition, brief: StructuredBrief): number {
  let score = 0;
  if (brief.sector && template.sector === brief.sector) score += 2;
  if (template.message_type === brief.message_type) score += 1;
  return score;
}
