import React from 'react';
import Globe from '../components/Globe';

const GlobePage: React.FC = () => {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          color: '#333',
          fontSize: '2.5rem'
        }}>
          🌍 NASA Space Visualization
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          color: '#666',
          fontSize: '1.1rem'
        }}>
          Explore NASA facilities and space missions around the globe using CesiumJS
        </p>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <Globe height="600px" />
        </div>

        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Features:</h3>
          <ul style={{ color: '#666', lineHeight: '1.6' }}>
            <li>🏢 NASA facility locations marked on the globe</li>
            <li>🌐 Interactive 3D Earth visualization</li>
            <li>🔍 Mouse controls: Left-click and drag to rotate, scroll to zoom</li>
            <li>🏠 Home button to reset view</li>
            <li>📍 Click on markers to see facility information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GlobePage;