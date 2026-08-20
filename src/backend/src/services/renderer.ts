import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import type { GeneratedCopy, TemplateDefinition } from '../types/brief';

const OUTPUT_DIR = path.resolve(__dirname, '../../generated');

/**
 * Renderizza il template scelto (layout + copy + immagine prodotto) in un PNG,
 * usando Puppeteer per fare lo screenshot di un layout HTML/CSS costruito al volo
 * dalle "zone" dichiarate nel template JSON.
 *
 * L'immagine prodotto viene scaricata lato server e incorporata come data URI:
 * questo evita che Puppeteer debba attendere richieste di rete esterne durante
 * il rendering (causa comune di timeout su host lenti o irraggiungibili), ed e'
 * anche piu' veloce perche' la pagina non ha piu' risorse esterne da caricare.
 *
 * E' il punto di estensione per sostituire il motore di rendering in futuro:
 * basta mantenere la stessa firma (template, copy, mainImageUrl) => filePath assoluto del PNG.
 */
export async function renderTemplateToPng(
  template: TemplateDefinition,
  copy: GeneratedCopy,
  mainImageUrl?: string,
): Promise<string> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const inlineImage = mainImageUrl ? await tryFetchAsDataUri(mainImageUrl) : undefined;
  const html = buildHtml(template, copy, inlineImage);
  const { width, height } = template.layout.canvas;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    // domcontentloaded basta: l'HTML non contiene piu' risorse esterne da attendere
    // (l'immagine e' gia' incorporata come data URI), quindi non serve networkidle0.
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const fileName = `${template.template_id}-${Date.now()}.png`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    await page.screenshot({ path: filePath as `${string}.png`, type: 'png' });

    return filePath;
  } finally {
    await browser.close();
  }
}

/**
 * Scarica un'immagine remota e la converte in data URI base64.
 * Non lancia mai eccezioni: se il download fallisce o impiega troppo,
 * ritorna undefined e il template usera' il placeholder grigio di fallback.
 */
async function tryFetchAsDataUri(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return undefined;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Limite di sicurezza: non incorporare immagini enormi (rallenterebbe il rendering)
    if (buffer.byteLength > 5 * 1024 * 1024) return undefined;

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.warn(`[renderer] impossibile scaricare l'immagine prodotto (${url}):`, err);
    return undefined;
  }
}

function buildHtml(
  template: TemplateDefinition,
  copy: GeneratedCopy,
  inlineImageDataUri?: string,
): string {
  const { canvas, zones } = template.layout;

  const zoneStyle = (zone: keyof typeof zones) => {
    const z = zones[zone as string];
    if (!z) return '';
    return `position:absolute; left:${z.x}px; top:${z.y}px; width:${z.w}px; height:${z.h}px;`;
  };

  return /* html */ `
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
  body { width: ${canvas.width}px; height: ${canvas.height}px; position: relative; background: #ffffff; overflow: hidden; }
  .main-image { object-fit: cover; width: 100%; height: 100%; }
  .headline {
    font-size: 44px; font-weight: 700; color: #111; line-height: 1.15;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .subheadline {
    font-size: 22px; color: #555; margin-top: 8px; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .bullets { list-style: none; overflow: hidden; }
  .bullets li {
    font-size: 21px; color: #222; margin-bottom: 6px; padding-left: 24px; position: relative;
    display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
  }
  .bullets li::before { content: '✓'; position: absolute; left: 0; color: #1a7f37; font-weight: 700; }
  .cta { display: inline-block; background: #111; color: #fff; font-size: 22px; font-weight: 700; padding: 16px 32px; border-radius: 8px; white-space: nowrap; }
  .badge { background: #e63946; color: #fff; font-size: 18px; font-weight: 700; padding: 10px 16px; border-radius: 6px; text-align: center; }
</style>
</head>
<body>
  ${
    zones.main_image
      ? `<div style="${zoneStyle('main_image')}">
          ${
            inlineImageDataUri
              ? `<img class="main-image" src="${inlineImageDataUri}" />`
              : `<div style="width:100%;height:100%;background:#ddd;"></div>`
          }
        </div>`
      : ''
  }
  ${
    zones.headline
      ? `<div style="${zoneStyle('headline')}">
          <div class="headline">${escapeHtml(copy.headline)}</div>
          <div class="subheadline">${escapeHtml(copy.subheadline)}</div>
        </div>`
      : ''
  }
  ${
    zones.bullets
      ? `<ul class="bullets" style="${zoneStyle('bullets')}">
          ${copy.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>`
      : ''
  }
  ${
    zones.cta
      ? `<div style="${zoneStyle('cta')}"><span class="cta">${escapeHtml(copy.cta)}</span></div>`
      : ''
  }
  ${
    zones.badge && copy.badge_text
      ? `<div style="${zoneStyle('badge')}"><div class="badge">${escapeHtml(copy.badge_text)}</div></div>`
      : ''
  }
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
