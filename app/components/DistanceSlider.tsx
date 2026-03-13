import { MapPin } from 'lucide-react';

interface DistanceSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function DistanceSlider({ value, onChange, min = 5, max = 50 }: DistanceSliderProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-green-600" />
        <h3 className="text-gray-800">Search Radius</h3>
      </div>
      
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-600"
          style={{
            background: `linear-gradient(to right, #16a34a 0%, #16a34a ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
          }}
        />
        <div className="text-lg text-gray-900 min-w-[60px] text-right">
          {value} km
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{min} km</span>
        <span>{max} km</span>
      </div>
    </div>
  );
}
