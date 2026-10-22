// Dark map style in the AIVO palette (Google Maps on Android).
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#12121a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8c8c9c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0b0f' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a35' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#14201a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a35' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a48' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1a22' }] },
];
