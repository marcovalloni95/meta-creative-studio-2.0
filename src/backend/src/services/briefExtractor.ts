import { scrapeProductPage } from './urlScraper';
import type {
  FunnelStage,
  MessageType,
  RawBriefInput,
  StructuredBrief,
} from '../types/brief';

/**
 * Step 1: costruisce il brief strutturato a partire da URL e/o brief manuale.
 * Lo scraping e' opzionale e non bloccante: se fallisce, si prosegue con i soli
 * dati manuali forniti dall'utente.
 */
export async function extractStructuredBrief(input: RawBriefInput): Promise<StructuredBrief> {
  let scraped: Awaited<ReturnType<typeof scrapeProductPage>> | undefined;

  if (input.productUrl) {
    try {
      scraped = await scrapeProductPage(input.productUrl);
    } catch (err) {
      // Non blocchiamo il flusso: logghiamo e proseguiamo solo col brief manuale.
      console.warn(`[briefExtractor] scraping fallito per ${input.productUrl}:`, err);
    }
  }

  const target = input.targetAudience || inferTargetFallback(scraped);
  const offer = input.offer || scraped?.title || 'offerta non specificata';
  const problemOrBenefit =
    input.mainProblemOrBenefit || scraped?.benefits[0] || 'beneficio principale non specificato';

  const funnel_stage: FunnelStage = inferFunnelStage(input, scraped);
  const message_type: MessageType = inferMessageType(input, scraped);
  const dominant_emotion = inferDominantEmotion(message_type);

  return {
    target,
    objective: `Spingere l'utente a: ${input.primaryCta || 'richiedere maggiori informazioni'}`,
    key_message: buildKeyMessage(offer, problemOrBenefit),
    dominant_emotion,
    suggested_scene: buildSuggestedScene(offer, target),
    placement: input.placement || 'feed',
    brand_constraints: input.brandConstraints || {},
    funnel_stage,
    message_type,
    sector: input.sector,
    product_images: scraped?.images || [],
    price: scraped?.price,
  };
}

function inferTargetFallback(scraped?: { title?: string }): string {
  return scraped?.title
    ? `potenziali clienti interessati a "${scraped.title}"`
    : 'target non specificato';
}

function inferFunnelStage(
  input: RawBriefInput,
  scraped?: { price?: string },
): FunnelStage {
  // Euristica semplice: se c'e' un prezzo esplicito, l'utente e' spesso piu' vicino
  // alla decisione (warm); altrimenti assumiamo cold come default piu' sicuro.
  return input.mainProblemOrBenefit || scraped?.price ? 'warm' : 'cold';
}

function inferMessageType(
  input: RawBriefInput,
  scraped?: { price?: string; benefits: string[] },
): MessageType {
  if (scraped?.price) return 'price-based';
  if (scraped?.benefits && scraped.benefits.length > 2) return 'proof-based';
  if (input.mainProblemOrBenefit) return 'benefit-focused';
  return 'benefit-focused';
}

function inferDominantEmotion(messageType: MessageType): string {
  const map: Record<MessageType, string> = {
    'benefit-focused': 'desiderio',
    'proof-based': 'fiducia',
    'price-based': 'urgenza',
    'urgency-based': 'urgenza',
  };
  return map[messageType];
}

function buildKeyMessage(offer: string, problemOrBenefit: string): string {
  return `${offer}: ${problemOrBenefit}`;
}

function buildSuggestedScene(offer: string, target: string): string {
  return `Una scena concreta che mostra ${offer} nel contesto di vita reale di ${target}, senza testo sovrapposto.`;
}
