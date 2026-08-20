import type { GenerateTemplateImageResponse } from '../types/brief';
import { resolveAssetUrl } from '../api/client';

interface Props {
  result: GenerateTemplateImageResponse;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export default function ModeBResult({ result, onRegenerate, isRegenerating }: Props) {
  return (
    <div className="space-y-4 max-w-xl">
      <img
        src={resolveAssetUrl(result.imageUrl)}
        alt="Creativita generata"
        className="w-full rounded border"
      />
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="border border-black rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {isRegenerating ? 'Rigenerazione in corso...' : '🔄 Rigenera'}
      </button>
      <div className="text-sm text-gray-500">Template usato: {result.templateId}</div>
      <div className="bg-gray-100 rounded p-3 text-sm space-y-2">
        <div>
          <span className="font-semibold">Headline: </span>
          {result.copy.headline}
        </div>
        <div>
          <span className="font-semibold">Sottotitolo: </span>
          {result.copy.subheadline}
        </div>
        <div>
          <span className="font-semibold">Benefici: </span>
          {result.copy.benefits.join(' · ')}
        </div>
        <div>
          <span className="font-semibold">CTA: </span>
          {result.copy.cta}
        </div>
        {result.copy.badge_text && (
          <div>
            <span className="font-semibold">Badge: </span>
            {result.copy.badge_text}
          </div>
        )}
      </div>
    </div>
  );
}
