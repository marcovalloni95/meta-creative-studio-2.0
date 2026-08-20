import type { GenerateAiImageResponse } from '../types/brief';

interface Props {
  result: GenerateAiImageResponse;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export default function ModeAResult({ result, onRegenerate, isRegenerating }: Props) {
  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <div className="font-semibold text-sm mb-1">Concept creativo (Art Director)</div>
        <pre className="whitespace-pre-wrap text-sm bg-gray-100 rounded p-3">{result.prompt}</pre>
      </div>
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="border border-black rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {isRegenerating ? 'Rigenerazione in corso...' : '🔄 Rigenera concept'}
      </button>
    </div>
  );
}
