import React, { useState } from 'react';
import Globe from '../components/Globe';
import SearchBox from "../components/SearchBox";

const GlobePage: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-5 text-center text-4xl font-bold text-gray-800">
          🌍 NASA Space Visualization
        </h1>
        
       <p className="text-center mb-8 text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
          Explore NASA facilities and space missions around the globe using CesiumJS
        </p>
        
        {/* Pass callback to receive search coordinates */}
        <SearchBox onResult={(data) => setCoords({ lat: data.lat, lon: data.lon })} />


        <div className="rounded-xl bg-white p-5 shadow-lg">
          <Globe height="800px" flyToCoords={coords} />
        </div>

        <div className="mt-5 rounded-xl bg-white p-5 shadow-lg">
          <h3 className="mb-4 text-xl font-semibold text-gray-800">Features:</h3>
          <ul className="space-y-2 text-gray-600 leading-relaxed">
            <li>🏢 NASA facility locations marked on the globe</li>
            <li>🌐 Interactive 3D Earth visualization</li>
            <li>🔍 Mouse controls: Left-click and drag to rotate, scroll to zoom</li>
            <li>🏠 Home button to reset view</li>
            <li>📍 Click on markers to see facility information</li>
            <li>🖥️ Press 'F' for fullscreen mode, 'Esc' to exit</li>
            <li>📸 Take screenshots of the current view for sharing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GlobePage;
