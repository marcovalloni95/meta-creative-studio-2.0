import * as cheerio from 'cheerio';
import type { ScrapedProductData } from '../types/brief';

/**
 * Scraping euristico di una pagina prodotto/landing.
 * Cerca prima i tag Open Graph (piu' affidabili), poi fa fallback su tag HTML comuni.
 * Nessuna dipendenza esterna a pagamento: usa solo fetch + cheerio.
 */
export async function scrapeProductPage(url: string): Promise<ScrapedProductData> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text().trim() ||
    undefined;

  const subtitle =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    undefined;

  const images = collectImages($, url);
  const price = extractPrice($);
  const benefits = extractBenefits($);

  return { title, subtitle, benefits, price, images };
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      // Alcuni siti bloccano richieste senza uno User-Agent "da browser"
      'User-Agent':
        'Mozilla/5.0 (compatible; MetaCreativeStudioBot/1.0; +https://marcovalloni.it)',
    },
  });
  if (!response.ok) {
    throw new Error(`Impossibile scaricare la pagina (status ${response.status})`);
  }
  return response.text();
}

function collectImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const found = new Set<string>();

  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) found.add(resolveUrl(ogImage, baseUrl));

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src) found.add(resolveUrl(src, baseUrl));
  });

  return Array.from(found).slice(0, 8);
}

function resolveUrl(maybeRelative: string, baseUrl: string): string {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return maybeRelative;
  }
}

function extractPrice($: cheerio.CheerioAPI): string | undefined {
  // Cerca elementi con classi/attributi comuni di e-commerce, poi fallback a regex sul testo.
  const candidate = $('[class*="price"], [itemprop="price"], [data-price]').first();
  const candidateText = candidate.text().trim();
  if (candidateText && /\d/.test(candidateText)) {
    return candidateText;
  }

  // Fallback: cerca TUTTI i prezzi nel testo e prende il piu' basso. Su pagine con
  // sconti (es. "120€ -> 49€"), il prezzo piu' basso e' quasi sempre quello reale
  // di vendita, mentre il primo trovato nel testo e' spesso il prezzo barrato/originale.
  const bodyText = $('body').text();
  const matches = bodyText.match(/(?:€|EUR)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|EUR)/g);
  if (!matches || matches.length === 0) return undefined;

  const withValues = matches
    .map((raw) => ({ raw: raw.trim(), value: parseFloat(raw.replace(/[^\d.,]/g, '').replace(',', '.')) }))
    .filter((m) => !Number.isNaN(m.value));

  if (withValues.length === 0) return matches[0].trim();

  withValues.sort((a, b) => a.value - b.value);
  return withValues[0].raw;
}

function extractBenefits($: cheerio.CheerioAPI): string[] {
  const items: string[] = [];
  $('li').each((_, el) => {
    const text = $(el).text().trim();
    // Euristica minima: righe brevi tipiche di elenchi puntati di benefici
    if (text.length > 5 && text.length < 120) {
      items.push(text);
    }
  });
  return items.slice(0, 6);
}
