import React, { useState } from 'react';
import Globe from '../components/Globe';
import SearchBox from "../components/SearchBox";
import { type FlyToCoords } from "../types/FlyToCoords";

const GlobePage: React.FC = () => {
  const [coords, setCoords] = useState<FlyToCoords | null>(null);

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
        <SearchBox 
          onResult={(data: FlyToCoords) => setCoords(data)} 
        />
      </div>

      {/* Fullscreen Globe */}
      <Globe 
        height="100vh" 
        width="100vw" 
        flyToCoords={coords} 
      />
    </div>
  );
};

export default GlobePage;