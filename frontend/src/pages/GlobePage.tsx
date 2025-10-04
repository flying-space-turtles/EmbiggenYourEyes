import React, { useState } from 'react';
import Globe from '../components/Globe';
import SearchBox from "../components/SearchBox";

const GlobePage: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333', fontSize: '2.5rem' }}>
          🌍 NASA Space Visualization
        </h1>
        
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666', fontSize: '1.1rem' }}>
          Explore NASA facilities and space missions around the globe using CesiumJS
        </p>

        {/* Pass callback to receive search coordinates */}
        <SearchBox onResult={(data) => setCoords({ lat: data.lat, lon: data.lon })} />

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <Globe height="600px" flyToCoords={coords} />
        </div>
      </div>
    </div>
  );
};

export default GlobePage;
