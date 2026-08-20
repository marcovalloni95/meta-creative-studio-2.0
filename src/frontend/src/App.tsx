import { useState } from 'react';
import DocumentUploadStep from './components/DocumentUploadStep';
import ReviewBriefStep from './components/ReviewBriefStep';
import ModeSelector from './components/ModeSelector';
import ModeAResult from './components/ModeAResult';
import ModeBResult from './components/ModeBResult';
import {
  analyzeBriefFromDocument,
  confirmBrief,
  generateAiImage,
  generateTemplateImage,
} from './api/client';
import type {
  GenerateAiImageResponse,
  GenerateTemplateImageResponse,
  RawBriefInput,
  Sector,
  StructuredBrief,
} from './types/brief';

type Step = 'input' | 'review' | 'mode' | 'result';

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [editableFields, setEditableFields] = useState<RawBriefInput>({});
  const [brief, setBrief] = useState<StructuredBrief | null>(null);
  const [aiResult, setAiResult] = useState<GenerateAiImageResponse | null>(null);
  const [templateResult, setTemplateResult] = useState<GenerateTemplateImageResponse | null>(
    null,
  );

  const handleDocumentSubmit = async (file: File, sector?: Sector) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeBriefFromDocument(file, sector);
      setSummary(result.summary);
      setEditableFields(result.editableFields);
      setBrief(result.structuredBrief);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewConfirm = async (fields: RawBriefInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const structured = await confirmBrief(fields);
      setBrief(structured);
      setStep('mode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSelect = async (mode: 'ai' | 'template') => {
    if (!brief) return;
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'ai') {
        const result = await generateAiImage(brief, '4:5');
        setAiResult(result);
        setTemplateResult(null);
      } else {
        const result = await generateTemplateImage(brief);
        setTemplateResult(result);
        setAiResult(null);
      }
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateAiImage = async () => {
    if (!brief) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateAiImage(brief, '4:5');
      setAiResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateTemplateImage = async () => {
    if (!brief) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateTemplateImage(brief);
      setTemplateResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  const backToModeSelection = () => {
    setStep('mode');
    setAiResult(null);
    setTemplateResult(null);
    setError(null);
  };

  const reset = () => {
    setStep('input');
    setSummary('');
    setEditableFields({});
    setBrief(null);
    setAiResult(null);
    setTemplateResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Meta Creative Studio 2.0</h1>
          <p className="text-gray-500">
            Genera creativita Meta Ads: da zero con AI oppure da libreria template.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">
            {error}
          </div>
        )}

        {step === 'input' && (
          <DocumentUploadStep onSubmit={handleDocumentSubmit} isLoading={isLoading} />
        )}

        {step === 'review' && (
          <ReviewBriefStep
            summary={summary}
            initialFields={editableFields}
            onConfirm={handleReviewConfirm}
            isLoading={isLoading}
          />
        )}

        {step === 'mode' && brief && <ModeSelector onSelect={handleModeSelect} />}

        {step === 'result' && (
          <div className="space-y-4">
            {aiResult && (
              <ModeAResult
                result={aiResult}
                onRegenerate={handleRegenerateAiImage}
                isRegenerating={isLoading}
              />
            )}
            {templateResult && (
              <ModeBResult
                result={templateResult}
                onRegenerate={handleRegenerateTemplateImage}
                isRegenerating={isLoading}
              />
            )}
            <div className="flex gap-4 text-sm">
              <button onClick={backToModeSelection} className="underline text-gray-500">
                Cambia modalita
              </button>
              <button onClick={reset} className="underline text-gray-500">
                Ricomincia (nuovo documento)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
