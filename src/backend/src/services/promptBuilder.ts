import type { AspectRatio, StructuredBrief } from '../types/brief';
import type { LightweightAdCopy } from './adCopyBuilder';

/**
 * Costruisce il prompt per il modello immagine come un unico paragrafo di
 * prosa fluida, direttamente incollabile in Gemini/Nano Banana Pro (che rende
 * bene il testo nelle immagini generate).
 *
 * A differenza di una prima versione di questo prompt, qui il testo NON e'
 * escluso — la creativita' generata deve essere l'annuncio gia' "finito",
 * con headline e CTA integrati nella composizione, non solo uno sfondo pulito
 * da editare dopo. Incorpora comunque i 10 criteri di creativita' Meta Ads
 * efficace: hook d'impatto, leggibilita' anche muted, value proposition
 * chiara, coerenza con l'awareness level, spazio brand non invadente, spazio
 * per prova sociale se pertinente, CTA visiva chiara, contrasto col "rumore"
 * del feed, safe zone per placement multipli, struttura testabile.
 */
export function buildAiImagePrompt(
  brief: StructuredBrief,
  aspectRatio: AspectRatio,
  adCopy: LightweightAdCopy,
): string {
  const placementLabel = brief.placement === 'feed' ? 'Meta feed' : 'Instagram/Facebook Stories o Reels';
  const isColdAudience = brief.funnel_stage === 'cold';

  const sentences = [
    // 1. Hook chiaro e d'impatto
    `Crea una creativita pubblicitaria fotorealistica per Meta Ads, pensata per fermare lo scroll compulsivo del feed: ${lowercaseFirst(brief.suggested_scene)}, con un elemento visivo immediatamente riconoscibile (volto umano se pertinente, gesto o azione dinamica, contrasto cromatico forte)`,

    // ambientazione concreta
    `L'ambientazione e' concreta e coerente con il pubblico di riferimento (${brief.target}), non generica o da stock photo anonima`,

    // 2. Leggibilita' anche muted + 8. contrasto col rumore del feed
    `Luce e contrasto marcati, colori saturi e ben definiti, cosi' la scena resta leggibile anche a schermo poco luminoso o scorsa velocemente senza audio`,

    // luce/mood
    `L'atmosfera generale comunica un senso di ${brief.dominant_emotion}`,

    // 3. Value proposition + 7. CTA visiva — QUESTA VOLTA IL TESTO VA INCLUSO NELL'IMMAGINE
    `Includi nell'immagine, come overlay tipografico ben integrato nella composizione (non un banner posticcio), la scritta "${adCopy.headline}" in un font ad alto contrasto, grande e leggibile in meno di 2 secondi, posizionata in una zona pulita della scena (in alto o in basso) che non copre il soggetto principale`,
    `Includi anche un elemento visivo di call-to-action con il testo "${adCopy.cta}", stile bottone o freccia, posizionato in modo che comunichi chiaramente l'azione da compiere`,

    // 4. Coerenza con awareness level
    isColdAudience
      ? `Il pubblico e' "cold": il tono visivo e testuale deve comunicare un problema o un insight riconoscibile prima ancora dell'offerta esplicita`
      : `Il pubblico e' gia' "warm": il tono puo' comunicare piu' apertamente il beneficio dell'offerta, con urgenza diretta`,

    // 5. Spazio brand
    `Lascia un piccolo angolo (in alto o in basso, non centrale) libero da elementi visivi complessi, dove poter inserire un logo senza coprire il soggetto o il testo principale`,

    // 6. Prova sociale se pertinente
    `Se il contesto lo rende credibile, includi un dettaglio ambientale che suggerisca fiducia o autorevolezza, senza esagerare in elementi grafici artificiali`,

    // 9. Safe zone multi-placement
    `Il soggetto principale e il testo sono centrati con margini di sicurezza generosi rispetto ai bordi, cosi' la composizione regge sia in formato ${aspectRatio === '9:16' ? '9:16 (Stories/Reels)' : `${aspectRatio} (feed)`} sia, se ritagliata, negli altri formati Meta comuni`,

    // framing
    `Framing: ${aspectRatio === '9:16' ? 'inquadratura verticale a tutto schermo con il soggetto leggermente decentrato' : 'inquadratura ravvicinata con il soggetto centrale e spazio negativo pulito per il testo nella parte alta o bassa'}`,

    // stile
    'Stile fotografico professionale, alta definizione, colori realistici, nessun elemento grafico o illustrativo eccetto il testo overlay e l\'elemento CTA descritti sopra',

    // formato
    `Formato ${aspectRatio}, pensato per ${placementLabel}`,
  ];

  return sentences.join('. ') + '.';
}

function lowercaseFirst(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}
