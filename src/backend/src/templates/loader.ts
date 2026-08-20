import fs from 'node:fs';
import path from 'node:path';
import type { TemplateDefinition } from '../types/brief';

// La cartella /templates vive alla radice del repo, non dentro src/backend.
const TEMPLATES_DIR = path.resolve(__dirname, '../../../../templates');

let cache: TemplateDefinition[] | null = null;

/** Carica (con cache in-memory) tutti i template JSON dalla cartella /templates. */
export function loadTemplates(): TemplateDefinition[] {
  if (cache) return cache;

  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.warn(`[templates/loader] cartella non trovata: ${TEMPLATES_DIR}`);
    cache = [];
    return cache;
  }

  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));

  cache = files.map((file) => {
    const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
    return JSON.parse(raw) as TemplateDefinition;
  });

  return cache;
}

/** Forza il ricaricamento dei template dal disco (utile in dev). */
export function reloadTemplates(): TemplateDefinition[] {
  cache = null;
  return loadTemplates();
}
