import React, { useState } from 'react';
import Globe from '../components/Globe';
import SearchBox from "../components/SearchBox";

interface Location {
  lat: number;
  lon: number;
  name: string;
  boundingbox?: [number, number, number, number];
}

const GlobePage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  return (
    <div className="p-5 min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Centered SearchBox */}
      <div className="w-full max-w-md mb-5">
        <SearchBox onResult={(data) => setSelectedLocation(data)} />
      </div>

      {/* Globe container */}
      <div className="w-full flex-1 rounded-lg overflow-hidden shadow-md">
        <Globe width="100%" height="100%" flyToCoords={selectedLocation} />
      </div>

      {/* Features section */}
      <div className="mt-5 p-5 bg-white rounded-lg shadow-md w-full max-w-6xl">
        <h3 className="text-gray-800 mb-4 text-xl font-semibold">Features:</h3>
        <ul className="text-gray-600 leading-7 list-disc list-inside">
          <li>🏢 NASA facility locations marked on the globe</li>
          <li>🌐 Interactive 3D Earth visualization</li>
          <li>🔍 Mouse controls: Left-click and drag, scroll to zoom</li>
          <li>🏠 Home button to reset view</li>
          <li>📍 Click on markers to see facility information</li>
        </ul>
      </div>
    </div>
  );
};

export default GlobePage;
