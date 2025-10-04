import React, { useEffect, useRef } from 'react';
import { Viewer, Cartesian3, Color, Entity, Ion } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface GlobeProps {
  width?: string;
  height?: string;
}

const Globe: React.FC<GlobeProps> = ({ width = '100%', height = '500px' }) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);

  useEffect(() => {
    if (cesiumContainer.current && !viewer.current) {
      // Set Cesium Ion access token
      const cesiumToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
      if (cesiumToken && cesiumToken !== 'your-cesium-ion-token-here') {
        Ion.defaultAccessToken = cesiumToken;
        console.log('Cesium Ion token configured successfully');
      } else {
        console.warn('Cesium Ion token not configured. Some imagery may not be available. See CESIUM_SETUP.md for instructions.');
      }

      // Initialize Cesium viewer
      viewer.current = new Viewer(cesiumContainer.current, {
        timeline: false,
        animation: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        homeButton: true,
        baseLayerPicker: false,
      });

      // Set the initial camera position
      viewer.current.camera.setView({
        destination: Cartesian3.fromDegrees(-74.0, 40.7, 15000000), // Above New York
        orientation: {
          heading: 0.0,
          pitch: -0.5,
          roll: 0.0,
        },
      });

      // Add some sample points of interest
      addSampleLocations(viewer.current);
    }

    // Cleanup function
    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);

  const addSampleLocations = (cesiumViewer: Viewer) => {
    // Add NASA locations
    const locations = [
      { name: 'NASA Goddard Space Flight Center', lat: 38.9964, lon: -76.8479 },
      { name: 'NASA Kennedy Space Center', lat: 28.5721, lon: -80.6480 },
      { name: 'NASA Johnson Space Center', lat: 29.5591, lon: -95.0907 },
      { name: 'NASA Jet Propulsion Laboratory', lat: 34.2048, lon: -118.1711 },
    ];

    locations.forEach((location) => {
      cesiumViewer.entities.add(
        new Entity({
          name: location.name,
          position: Cartesian3.fromDegrees(location.lon, location.lat),
          point: {
            pixelSize: 10,
            color: Color.YELLOW,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            heightReference: 0, // CLAMP_TO_GROUND
          },
          label: {
            text: location.name,
            font: '12pt Arial',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new Cartesian3(0, -40, 0),
            showBackground: true,
            backgroundColor: Color.BLACK.withAlpha(0.7),
          },
        })
      );
    });
  };

  return (
    <div
      ref={cesiumContainer}
      style={{
        width,
        height,
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

export default Globe;