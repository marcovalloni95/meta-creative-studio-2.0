import { useRef, useState } from 'react';
import type { Sector } from '../types/brief';

interface Props {
  onSubmit: (file: File, sector?: Sector) => void;
  isLoading: boolean;
}

const SECTOR_OPTIONS: { value: Sector; label: string }[] = [
  { value: 'dental', label: 'Odontoiatria' },
  { value: 'jewelry', label: 'Gioielleria / e-commerce' },
  { value: 'real-estate', label: 'Immobiliare' },
  { value: 'events', label: 'Eventi / matrimoni' },
  { value: 'motorsport', label: 'Motorsport' },
  { value: 'professional-services', label: 'Servizi professionali (legale, ingegneria, wellness...)' },
];

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.md';

export default function DocumentUploadStep({ onSubmit, isLoading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [sector, setSector] = useState<Sector | ''>('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (selected: File | undefined) => {
    if (selected) setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelected(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onSubmit(file, sector || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">
          Settore <span className="text-gray-400 font-normal">(opzionale — usato per scegliere il template in Modalita B)</span>
        </label>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value as Sector)}
          className="w-full border rounded px-3 py-2 bg-white"
        >
          <option value="">Seleziona un settore...</option>
          {SECTOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Brief creativo</label>
        <p className="text-sm text-gray-500 mb-2">
          Carica un documento (PDF, Word o testo) con le informazioni chiave: chi siamo, target,
          obiettivo della campagna, offerta, beneficio principale, call to action.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragging ? 'border-black bg-gray-50' : 'border-gray-300'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
          {file ? (
            <div className="text-sm">
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-400"> ({Math.round(file.size / 1024)} KB)</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Trascina qui il documento, o clicca per selezionarlo
              <div className="text-xs text-gray-400 mt-1">PDF, Word (.docx) o testo (.txt/.md)</div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !file}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {isLoading ? 'Analisi del documento in corso...' : 'Analizza documento'}
      </button>
    </form>
  );
}
