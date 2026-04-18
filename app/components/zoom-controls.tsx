import { Plus, Minus } from 'lucide-react';

type ZoomControlsProps = {
  zoom: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

export default function ZoomControls({
  zoom,
  onDecrease,
  onIncrease,
}: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-gray-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-gray-700 hover:bg-gray-100"
        onClick={onDecrease}
        aria-label="Diminuir zoom"
      >
        <Minus className="h-4 w-4 shrink-0" />
      </button>
      <span className="w-14 text-center text-sm font-semibold text-gray-700">
        {zoom}%
      </span>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-gray-700 hover:bg-gray-100"
        onClick={onIncrease}
        aria-label="Aumentar zoom"
      >
        <Plus className="h-4 w-4 shrink-0" />
      </button>
    </div>
  );
}