import type {
  AnalyzeBriefResponse,
  AspectRatio,
  GenerateAiImageResponse,
  GenerateTemplateImageResponse,
  RawBriefInput,
  Sector,
  StructuredBrief,
} from '../types/brief';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Richiesta fallita (${response.status})`);
  }

  return response.json() as Promise<TResponse>;
}

export async function analyzeBriefFromDocument(
  file: File,
  sector?: Sector,
): Promise<AnalyzeBriefResponse> {
  const formData = new FormData();
  formData.append('document', file);
  if (sector) formData.append('sector', sector);

  const response = await fetch(`${API_BASE_URL}/api/analyze-brief`, {
    method: 'POST',
    body: formData, // niente header Content-Type: il browser imposta multipart/form-data con il boundary corretto
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Richiesta fallita (${response.status})`);
  }

  return response.json() as Promise<AnalyzeBriefResponse>;
}

export function confirmBrief(fields: RawBriefInput): Promise<StructuredBrief> {
  return postJson<StructuredBrief>('/api/confirm-brief', fields);
}

export function generateAiImage(
  brief: StructuredBrief,
  aspectRatio: AspectRatio,
): Promise<GenerateAiImageResponse> {
  return postJson<GenerateAiImageResponse>('/api/generate-ai-image', { brief, aspectRatio });
}

export function generateTemplateImage(
  brief: StructuredBrief,
  templateId?: string,
): Promise<GenerateTemplateImageResponse> {
  return postJson<GenerateTemplateImageResponse>('/api/generate-template-image', {
    brief,
    templateId,
  });
}

export function resolveAssetUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}${pathOrUrl}`;
}
