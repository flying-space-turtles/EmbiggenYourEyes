import React from 'react';
import SolarSystem from '../components/SolarSystem';

const SolarSystemPage: React.FC = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Fullscreen Solar System */}
      <SolarSystem height="100vh" width="100vw" />
    </div>
  );
};

export default SolarSystemPage;