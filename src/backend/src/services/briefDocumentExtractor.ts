import type { Placement, RawBriefInput, Sector } from '../types/brief';

/**
 * Converte il testo grezzo di un documento (brief creativo caricato dall'utente)
 * in un RawBriefInput, cosi' puo' proseguire nella stessa pipeline gia' usata
 * per il brief manuale (extractStructuredBrief in briefExtractor.ts).
 *
 * Riconosce righe etichettate del tipo "Etichetta: valore" (case-insensitive,
 * tollerante a variazioni comuni). Se il documento non usa etichette esplicite,
 * fa un fallback ragionevole: prima riga = offerta, resto del testo = contesto
 * principale, cosi' il flusso non si blocca comunque.
 *
 * NOTA: questa e' un'estrazione euristica (regex su etichette), non una vera
 * comprensione del linguaggio naturale. Per un'estrazione piu' robusta su
 * documenti non strutturati, questo e' il punto dove collegare una chiamata a
 * un modello linguistico (es. Claude/GPT) che riceva il testo e restituisca
 * direttamente i campi in JSON.
 */
export function parseDocumentToRawBrief(rawText: string, sectorOverride?: Sector): RawBriefInput {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const labeled = extractLabeledFields(lines);

  const targetAudience = labeled.target;
  const offer = combineChiSiamoAndOfferta(labeled.chiSiamo, labeled.offerta);
  const mainProblemOrBenefit = combineObiettivoAndBeneficio(labeled.obiettivo, labeled.beneficio);
  const primaryCta = labeled.cta || (labeled.obiettivo && !labeled.beneficio ? labeled.obiettivo : undefined);
  const sector = sectorOverride || matchSector(labeled.settore);
  const placement = matchPlacement(labeled.placement);
  const productUrl = labeled.url;

  // Fallback: nessuna etichetta riconosciuta nel documento -> usa la prima riga
  // come offerta e il resto come beneficio/contesto, per non bloccare il flusso.
  if (!targetAudience && !offer && !mainProblemOrBenefit && !primaryCta && lines.length > 0) {
    const [firstLine, ...rest] = lines;
    return {
      offer: firstLine.slice(0, 200),
      mainProblemOrBenefit: rest.join(' ').slice(0, 500) || undefined,
      sector,
      placement,
      productUrl,
    };
  }

  return { targetAudience, offer, mainProblemOrBenefit, primaryCta, sector, placement, productUrl };
}

interface LabeledFields {
  chiSiamo?: string;
  target?: string;
  obiettivo?: string;
  offerta?: string;
  beneficio?: string;
  cta?: string;
  settore?: string;
  placement?: string;
  url?: string;
}

/** Ogni chiave ha piu' varianti accettate per la stessa etichetta, cercate riga per riga. */
const LABEL_PATTERNS: Record<keyof LabeledFields, RegExp> = {
  chiSiamo: /^(chi siamo|azienda|brand|about( us)?)\s*[:\-]\s*(.+)$/i,
  target: /^(target|pubblico|a chi si rivolge|audience)\s*[:\-]\s*(.+)$/i,
  obiettivo: /^(obiettivo( della campagna)?|goal|scopo)\s*[:\-]\s*(.+)$/i,
  offerta: /^(offerta|cosa offriamo|prodotto\/servizio|prodotto|servizio)\s*[:\-]\s*(.+)$/i,
  beneficio: /^(beneficio( principale)?|problema( principale)?|perche' sceglierci|perche sceglierci)\s*[:\-]\s*(.+)$/i,
  cta: /^(cta|call to action|cosa deve fare l'utente)\s*[:\-]\s*(.+)$/i,
  settore: /^(settore|sector|categoria)\s*[:\-]\s*(.+)$/i,
  placement: /^(placement|formato|posizionamento)\s*[:\-]\s*(.+)$/i,
  url: /^(url|sito|link( prodotto)?)\s*[:\-]\s*(.+)$/i,
};

function extractLabeledFields(lines: string[]): LabeledFields {
  const result: LabeledFields = {};

  for (const line of lines) {
    for (const [key, pattern] of Object.entries(LABEL_PATTERNS) as [
      keyof LabeledFields,
      RegExp,
    ][]) {
      const match = line.match(pattern);
      if (match && !result[key]) {
        // L'ultimo gruppo catturato e' sempre il valore, indipendentemente da
        // quanti gruppi opzionali precedano nel pattern.
        result[key] = match[match.length - 1].trim();
      }
    }
  }

  return result;
}

function combineChiSiamoAndOfferta(chiSiamo?: string, offerta?: string): string | undefined {
  // Niente concatenazione: l'offerta va tenuta sintetica, non un blob "chi siamo — offerta".
  // "Chi siamo" e' usato solo come fallback se l'offerta non e' specificata a parte.
  return offerta || chiSiamo;
}

function combineObiettivoAndBeneficio(obiettivo?: string, beneficio?: string): string | undefined {
  if (obiettivo && beneficio) return `${beneficio} (obiettivo: ${obiettivo})`;
  return beneficio || obiettivo;
}

const SECTOR_KEYWORDS: Record<Sector, string[]> = {
  dental: ['dental', 'odontoiatr', 'dentist'],
  jewelry: ['jewel', 'gioiell', 'ecommerce', 'e-commerce'],
  'real-estate': ['real-estate', 'real estate', 'immobil'],
  events: ['event', 'matrimon', 'wedding'],
  motorsport: ['motorsport', 'moto', 'rally', 'racing'],
  'professional-services': ['legal', 'legale', 'ingegner', 'wellness', 'professional'],
};

function matchSector(raw?: string): Sector | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS) as [Sector, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return sector;
  }
  return undefined;
}

function matchPlacement(raw?: string): Placement | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes('stor')) return 'stories';
  if (lower.includes('reel')) return 'reels';
  if (lower.includes('feed')) return 'feed';
  return undefined;
}
