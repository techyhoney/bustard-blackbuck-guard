import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatToIST } from '@/lib/utils';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  location: string;
  type: string;
  creature?: string;
  observer_name: string;
  created_at: string;
  image_url?: string | null;
}

interface SurveyMapProps {
  locations: MapLocation[];
  height?: string;
  birdIcon?: string;
  animalIcon?: string;
}

// Component to fit bounds when locations change
const FitBounds = ({ locations }: { locations: MapLocation[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map(loc => [loc.latitude, loc.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [locations, map]);

  return null;
};

const SurveyMap = ({ locations, height = '500px', birdIcon, animalIcon }: SurveyMapProps) => {
  const [center, setCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center

  useEffect(() => {
    if (locations.length > 0) {
      // Calculate center from locations
      const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
      const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
      setCenter([avgLat, avgLng]);
    }
  }, [locations]);

  // Create custom icons based on creature type
  const getMarkerIcon = (creature?: string) => {
    let iconHtml = '';
    
    switch (creature) {
      case 'Great Indian Bustard':
      case 'Bustard':
        // Use bird image if provided, otherwise use default blue marker
        if (birdIcon) {
          iconHtml = `
            <div style="background: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid #3b82f6;">
              <img src="${birdIcon}" style="width: 28px; height: 28px; object-fit: contain;" />
            </div>
          `;
          return new DivIcon({
            html: iconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            className: 'custom-marker-icon'
          });
        }
        return createColorIcon('#3b82f6');
      
      case 'Blackbuck':
        // Use animal image if provided, otherwise use default green marker
        if (animalIcon) {
          iconHtml = `
            <div style="background: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid #10b981;">
              <img src="${animalIcon}" style="width: 28px; height: 28px; object-fit: contain;" />
            </div>
          `;
          return new DivIcon({
            html: iconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            className: 'custom-marker-icon'
          });
        }
        return createColorIcon('#10b981');
      
      case 'Other':
        return createColorIcon('#8b5cf6'); // purple
      
      default:
        return createColorIcon('#6b7280'); // gray
    }
  };

  const createColorIcon = (color: string) => {
    const svgIcon = `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" stroke="white" stroke-width="2" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.125 12.5 28.125S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z"/>
        <circle fill="white" cx="12.5" cy="12.5" r="6"/>
      </svg>
    `;
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  };

  const formatDate = (dateString: string) => {
    return formatToIST(dateString, true);
  };

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground font-medium">No survey locations with coordinates found</p>
          <p className="text-sm text-muted-foreground">Survey entries with latitude and longitude will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds locations={locations} />
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={getMarkerIcon(location.creature)}
          >
            <Popup maxWidth={300}>
              <div className="space-y-2 min-w-[200px]">
                <div className="font-semibold text-base border-b pb-1">
                  {location.creature || location.type}
                </div>
                
                {/* Display image if available */}
                {location.image_url && (
                  <div className="my-2">
                    <img 
                      src={location.image_url} 
                      alt={location.creature || location.type}
                      className="w-full h-40 object-cover rounded-md border border-gray-200"
                      onError={(e) => {
                        console.error('Failed to load image:', location.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="text-sm">
                  <span className="font-medium">Location:</span> {location.location}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Observer:</span> {location.observer_name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Type:</span> {location.type}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {formatDate(location.created_at)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default SurveyMap;

