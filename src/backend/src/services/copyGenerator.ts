import type { GeneratedCopy, StructuredBrief, TemplateDefinition } from '../types/brief';

/**
 * Genera il copy per i campi richiesti dal template scelto.
 * Regole di base ispirate a PAS/Cashvertising, con un vincolo esplicito:
 * headline e sottotitolo devono dire cose DIVERSE (mai la stessa frase ripetuta),
 * e ogni campo ha un limite di lunghezza rispettato per parola intera (mai tagli
 * a meta' parola), per restare dentro le zone di layout del template senza overflow.
 */
export function generateCopyForTemplate(
  brief: StructuredBrief,
  template: TemplateDefinition,
): GeneratedCopy {
  const headline = buildHeadline(brief);
  const subheadline = buildSubheadline(brief, headline);
  const benefits = buildBenefits(brief);
  const cta = buildCta(brief);
  const badge_text = template.required_fields.includes('badge_text')
    ? buildBadge(brief)
    : undefined;

  return { headline, subheadline, benefits, cta, badge_text };
}

/** Troncamento "sicuro": non taglia mai a meta' parola, aggiunge "..." solo se ha tagliato. */
function truncateAtWord(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${safe}...`;
}

function buildHeadline(brief: StructuredBrief): string {
  // Headline: solo la promessa principale, breve e diretta (max ~50 caratteri).
  const promise = brief.key_message.split(':')[0].trim();
  return truncateAtWord(capitalize(promise), 50);
}

function buildSubheadline(brief: StructuredBrief, headline: string): string {
  // Sottotitolo: aggiunge contesto SENZA ripetere la headline. Se il resto del
  // key_message dopo ":" e' vuoto o troppo simile alla headline, usa il beneficio.
  const afterColon = brief.key_message.split(':').slice(1).join(':').trim();
  const candidate = afterColon.length > 0 ? afterColon : brief.suggested_scene;
  return truncateAtWord(capitalize(candidate), 90);
}

function buildBenefits(brief: StructuredBrief): string[] {
  // Bullet brevi e concreti (max ~55 caratteri l'uno), mai frasi-scena intere.
  const items: string[] = [`Pensato per ${brief.target}`.slice(0, 55)];

  if (brief.price) {
    items.push(`A partire da ${brief.price}`);
  } else if (brief.funnel_stage === 'warm') {
    items.push('Posti/disponibilita\' limitati');
  } else {
    items.push('Nessun impegno richiesto');
  }

  items.push(brief.dominant_emotion === 'fiducia' ? 'Risultati verificabili' : 'Un passo alla volta, senza fretta');

  return items.slice(0, 3);
}

function buildCta(brief: StructuredBrief): string {
  // CTA brevi e standard per funnel stage/message type, MAI derivate per taglio
  // di una frase piu' lunga (era la causa dei tagli a meta' parola).
  if (brief.message_type === 'price-based') return 'Scopri l\'offerta';
  if (brief.funnel_stage === 'warm') return 'Prenota ora';
  return 'Scopri di piu\'';
}

function buildBadge(brief: StructuredBrief): string {
  if (brief.message_type === 'price-based' && brief.price) return `Da ${brief.price}`;
  if (brief.funnel_stage === 'warm') return 'Offerta a tempo';
  return 'Consulenza gratuita';
}

function capitalize(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
