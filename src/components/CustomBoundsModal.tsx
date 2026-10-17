import React, { useState } from 'react';
import { useAircraftStore } from '../store/aircraftStore';
import { GeoBounds } from '../types/aircraft';
import { validateGeoBounds } from '../utils/geoBounds';

interface CustomBoundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomBoundsModal: React.FC<CustomBoundsModalProps> = ({ isOpen, onClose }) => {
  const { activeBounds, setCustomBounds } = useAircraftStore();

  const [lamin, setLamin] = useState<string>(activeBounds.lamin.toString());
  const [lomin, setLomin] = useState<string>(activeBounds.lomin.toString());
  const [lamax, setLamax] = useState<string>(activeBounds.lamax.toString());
  const [lomax, setLomax] = useState<string>(activeBounds.lomax.toString());
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const boundsCandidate: Partial<GeoBounds> = {
      lamin: parseFloat(lamin),
      lomin: parseFloat(lomin),
      lamax: parseFloat(lamax),
      lomax: parseFloat(lomax),
    };

    const result = validateGeoBounds(boundsCandidate);
    if (!result.isValid) {
      setValidationError(result.error || 'Invalid geographic coordinates');
      return;
    }

    setCustomBounds(boundsCandidate as GeoBounds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="bg-[#f2efeb] border-2 border-[#1a1a1a] w-full max-w-md shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] pb-3">
          <div>
            <div className="label-tech text-[#1a1a1a]/70">[ GEOMETRY CONFIG ]</div>
            <h3 className="font-oswald text-xl font-bold uppercase text-[#1a1a1a]">
              CUSTOM BOUNDING BOX
            </h3>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-[#1a1a1a] px-2 py-0.5 text-xs font-mono-tech font-bold hover:bg-[#1a1a1a] hover:text-[#f2efeb]"
          >
            [X]
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="space-y-4">
          <p className="text-xs font-mono-tech text-[#1a1a1a]/70">
            Define WGS-84 bounding coordinates (lamin, lomin, lamax, lomax) for OpenSky radar acquisition.
          </p>

          {validationError && (
            <div className="border-2 border-[#d94e33] bg-[#d94e33]/10 p-2.5 text-xs font-mono-tech font-bold text-[#d94e33]">
              ERR: {validationError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs font-mono-tech">
            <div className="space-y-1">
              <label className="label-tech text-[#1a1a1a]/70">Min Lat (lamin)</label>
              <input
                type="number"
                step="any"
                value={lamin}
                onChange={(e) => setLamin(e.target.value)}
                className="w-full border-2 border-[#1a1a1a] bg-transparent p-2 text-xs font-bold focus:outline-none focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="label-tech text-[#1a1a1a]/70">Max Lat (lamax)</label>
              <input
                type="number"
                step="any"
                value={lamax}
                onChange={(e) => setLamax(e.target.value)}
                className="w-full border-2 border-[#1a1a1a] bg-transparent p-2 text-xs font-bold focus:outline-none focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="label-tech text-[#1a1a1a]/70">Min Lon (lomin)</label>
              <input
                type="number"
                step="any"
                value={lomin}
                onChange={(e) => setLomin(e.target.value)}
                className="w-full border-2 border-[#1a1a1a] bg-transparent p-2 text-xs font-bold focus:outline-none focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="label-tech text-[#1a1a1a]/70">Max Lon (lomax)</label>
              <input
                type="number"
                step="any"
                value={lomax}
                onChange={(e) => setLomax(e.target.value)}
                className="w-full border-2 border-[#1a1a1a] bg-transparent p-2 text-xs font-bold focus:outline-none focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-[#1a1a1a] px-3 py-1.5 text-xs font-mono-tech font-bold uppercase hover:bg-[#1a1a1a] hover:text-[#f2efeb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border-2 border-[#d94e33] bg-[#d94e33] text-white px-4 py-1.5 text-xs font-mono-tech font-bold uppercase hover:bg-[#1a1a1a] hover:border-[#1a1a1a]"
            >
              Apply Sector
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
