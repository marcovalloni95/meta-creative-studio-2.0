import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { analyzeBriefRouter } from './routes/analyzeBrief';
import { confirmBriefRouter } from './routes/confirmBrief';
import { generateAiImageRouter } from './routes/generateAiImage';
import { generateTemplateImageRouter } from './routes/generateTemplateImage';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

// Serve i PNG generati dalla Modalita B (rendering server-side)
app.use('/generated', express.static(path.resolve(__dirname, '../generated')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(analyzeBriefRouter);
app.use(confirmBriefRouter);
app.use(generateAiImageRouter);
app.use(generateTemplateImageRouter);

app.listen(PORT, () => {
  console.log(`meta-creative-studio-2.0 backend in ascolto su http://localhost:${PORT}`);
});
