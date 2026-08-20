interface Props {
  onSelect: (mode: 'ai' | 'template') => void;
}

export default function ModeSelector({ onSelect }: Props) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onSelect('ai')}
        className="border rounded-lg p-4 flex-1 text-left hover:border-black"
      >
        <div className="font-semibold">Modalita A — AI da zero</div>
        <div className="text-sm text-gray-500 mt-1">
          Genera un'immagine inedita a partire dal brief (prompt + chiamata modello immagine).
        </div>
      </button>

      <button
        onClick={() => onSelect('template')}
        className="border rounded-lg p-4 flex-1 text-left hover:border-black"
      >
        <div className="font-semibold">Modalita B — Template</div>
        <div className="text-sm text-gray-500 mt-1">
          Seleziona il template piu' adatto dalla libreria e compone copy + immagine prodotto.
        </div>
      </button>
    </div>
  );
}
