import { useState } from 'react';
import type { RawBriefInput } from '../types/brief';

interface Props {
  summary: string;
  initialFields: RawBriefInput;
  onConfirm: (fields: RawBriefInput) => void;
  isLoading: boolean;
}

export default function ReviewBriefStep({ summary, initialFields, onConfirm, isLoading }: Props) {
  const [fields, setFields] = useState<RawBriefInput>(initialFields);

  const update = (key: keyof RawBriefInput, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <div className="text-sm font-semibold mb-1">Ho capito questo dal documento:</div>
        <div className="bg-gray-50 border rounded p-3 text-sm text-gray-700">{summary}</div>
      </div>

      <div className="text-sm text-gray-500">
        Verifica e correggi i campi qui sotto se qualcosa non è preciso, poi conferma per procedere.
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Target</label>
        <input
          value={fields.targetAudience || ''}
          onChange={(e) => update('targetAudience', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Offerta</label>
        <input
          value={fields.offer || ''}
          onChange={(e) => update('offer', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Obiettivo / beneficio principale</label>
        <input
          value={fields.mainProblemOrBenefit || ''}
          onChange={(e) => update('mainProblemOrBenefit', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Call to action</label>
        <input
          value={fields.primaryCta || ''}
          onChange={(e) => update('primaryCta', e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        onClick={() => onConfirm(fields)}
        disabled={isLoading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {isLoading ? 'Conferma in corso...' : 'Conferma e continua'}
      </button>
    </div>
  );
}
