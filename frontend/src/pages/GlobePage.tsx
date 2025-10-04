import React, { useState } from 'react';
import Globe from '../components/Globe';
import SearchBox from "../components/SearchBox";

const GlobePage: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Title overlay */}
      <div className="absolute left-4 top-4 z-20">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">
          🌍 NASA Space Visualization
        </h1>
      </div>
      
      {/* Search box overlay */}
      <div className="absolute right-20 top-4 z-20">
        <SearchBox onResult={(data) => setCoords({ lat: data.lat, lon: data.lon })} />
      </div>

      {/* Fullscreen Globe */}
      <Globe height="100vh" width="100vw" flyToCoords={coords} />
    </div>
  );
};

export default GlobePage;
