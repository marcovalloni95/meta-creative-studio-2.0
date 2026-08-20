import { Router } from 'express';
import path from 'node:path';
import { selectTemplate } from '../services/templateSelector';
import { generateCopyForTemplate } from '../services/copyGenerator';
import { renderTemplateToPng } from '../services/renderer';
import type {
  GenerateTemplateImageRequest,
  GenerateTemplateImageResponse,
} from '../types/brief';

export const generateTemplateImageRouter = Router();

generateTemplateImageRouter.post('/api/generate-template-image', async (req, res) => {
  try {
    const { brief, templateId } = req.body as GenerateTemplateImageRequest;

    if (!brief) {
      return res.status(400).json({ error: 'brief e\' obbligatorio.' });
    }

    const template = selectTemplate(brief, templateId);
    const copy = generateCopyForTemplate(brief, template);
    const mainImageUrl = brief.product_images[0];

    const filePath = await renderTemplateToPng(template, copy, mainImageUrl);
    const publicUrl = `/generated/${path.basename(filePath)}`;

    const response: GenerateTemplateImageResponse = {
      imageUrl: publicUrl,
      templateId: template.template_id,
      copy,
    };
    return res.json(response);
  } catch (err) {
    console.error('[generate-template-image] errore:', err);
    return res
      .status(500)
      .json({ error: 'Errore durante la generazione immagine (Modalita B).' });
  }
});
