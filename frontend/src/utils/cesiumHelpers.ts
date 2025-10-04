import { Viewer, Cartesian3, Color, Entity } from 'cesium';

export const addSampleLocations = (cesiumViewer: Viewer): void => {
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