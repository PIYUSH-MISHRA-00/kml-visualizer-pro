import { useEffect, useRef } from "react";
import { KmlElement, ParsedKml } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/utils/kmlParser";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface KmlMapProps {
  kmlData?: ParsedKml;
  showDetailed: boolean;
  className?: string;
}

const KmlMap = ({ kmlData, showDetailed, className }: KmlMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);

  // Initialize leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    
    leafletMap.current = L.map(mapRef.current).setView([0, 0], 2);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap.current);
    
    // Create a layer group for KML elements
    layerGroup.current = L.layerGroup().addTo(leafletMap.current);
    
    // Cleanup on unmount
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update map when KML data changes
  useEffect(() => {
    if (!leafletMap.current || !layerGroup.current || !kmlData) return;
    
    // Clear previous layers
    layerGroup.current.clearLayers();
    
    // If bounds exist, fit the map to them
    if (kmlData.bounds) {
      const { north, south, east, west } = kmlData.bounds;
      leafletMap.current.fitBounds([
        [south, west],
        [north, east]
      ]);
    }
    
    // Render KML elements
    renderKmlElements(kmlData.elements, layerGroup.current, showDetailed);
    
  }, [kmlData, showDetailed]);

  // Render KML elements on the map
  const renderKmlElements = (elements: KmlElement[], layerGroup: L.LayerGroup, showDetailed: boolean) => {
    elements.forEach((element, index) => {
      if (element.coordinates && element.coordinates.length > 0) {
        if (element.type === "Point") {
          const [lon, lat] = element.coordinates[0];
          const marker = L.marker([lat, lon], {
            icon: L.divIcon({
              className: 'kml-point-marker',
              html: `<div class="w-4 h-4 rounded-full bg-[#2196F3] border-2 border-white"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          });
          
          if (showDetailed && element.name) {
            marker.bindTooltip(element.name, { permanent: true, direction: 'top', className: 'kml-tooltip' });
          }
          
          layerGroup.addLayer(marker);
        } 
        else if (element.type === "LineString") {
          const latLngs = element.coordinates.map(([lon, lat]) => L.latLng(lat, lon));
          const polyline = L.polyline(latLngs, { color: '#4CAF50', weight: 3 });
          
          if (showDetailed && element.name) {
            // Always compute the length if not provided
            const computedLength = element.length !== undefined ? element.length : computeLength(element.coordinates);
            const tooltipContent = `${element.name} (${formatDistance(computedLength)})`;
            polyline.bindTooltip(tooltipContent, { permanent: true, direction: 'top', className: 'kml-tooltip' });
          }
          
          layerGroup.addLayer(polyline);
        }
        else if (element.type === "Polygon") {
          const latLngs = element.coordinates.map(([lon, lat]) => L.latLng(lat, lon));
          const polygon = L.polygon(latLngs, { 
            color: '#9C27B0', 
            fillColor: '#9C27B0',
            fillOpacity: 0.2,
            weight: 2
          });
          
          if (showDetailed && element.name) {
            polygon.bindTooltip(element.name, { permanent: true, direction: 'top', className: 'kml-tooltip' });
          }
          
          layerGroup.addLayer(polygon);
        }
      }
      
      // Process MultiGeometry children recursively
      if (element.type === "MultiGeometry" && element.children) {
        renderKmlElements(element.children, layerGroup, showDetailed);
      }
    });
  };

  // New helper to compute distance from coordinates
  const computeLength = (coordinates: number[][]): number => {
    let length = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const [lon1, lat1] = coordinates[i - 1];
      const [lon2, lat2] = coordinates[i];
      length += L.latLng(lat1, lon1).distanceTo(L.latLng(lat2, lon2));
    }
    return length;
  };

  // Generate element markers for the sidebar display
  const generateElementMarkers = () => {
    if (!kmlData) return [];
    
    const markers: { id: string; type: string; name?: string; length?: number; coordinates?: string }[] = [];
    
    const processElements = (elements: KmlElement[]) => {
      elements.forEach((element, index) => {
        if (element.type === "Point") {
          const coords = element.coordinates && element.coordinates.length > 0 
            ? `${element.coordinates[0][1]}, ${element.coordinates[0][0]}` 
            : undefined;
          markers.push({
            id: `${element.type}-${index}`,
            type: element.type,
            name: element.name || "Unnamed", // Set default name if missing
            coordinates: coords
          });
        } else if (element.type === "LineString" || element.type === "Polygon") {
          markers.push({
            id: `${element.type}-${index}`,
            type: element.type,
            name: element.name || "Unnamed", // Set default name if missing
            length: element.length ?? computeLength(element.coordinates) // Compute if missing
          });
        }
        if (element.type === "MultiGeometry" && element.children) {
          processElements(element.children);
        }
      });
    };
    
    processElements(kmlData.elements);
    return markers;
  };
  
  const markers = kmlData ? generateElementMarkers() : [];

  return (
    <div className={cn("relative rounded-xl overflow-hidden shadow-lg bg-white", className)}>
      <div className="w-full h-[600px] p-4">
        <h3 className="text-xl font-medium mb-4 text-kml-dark-gray">KML Visualization</h3>
        
        {!kmlData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl font-medium text-kml-dark-gray">
              Upload a KML file to visualize data
            </p>
            <p className="text-sm text-kml-dark-gray/70 mt-2">
              The visualization will appear here
            </p>
          </div>
        ) : (
          <div className="h-[520px] overflow-auto">
            <div className="border border-kml-gray/30 rounded-lg mb-4 h-[300px] relative">
              <div ref={mapRef} className="w-full h-full z-10"></div>
              <div className="absolute bottom-2 right-2 bg-white/80 p-2 rounded text-xs z-20">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full bg-[#2196F3]"></div>
                  <span>Point</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                  <span>LineString</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#9C27B0]"></div>
                  <span>Polygon</span>
                </div>
              </div>
            </div>
            
            <div className="border border-kml-gray/30 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-kml-dark-gray mb-2">Map Elements</h4>
              <p className="text-sm text-kml-dark-gray/70 mb-4">
                Total elements: {markers.length}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {markers.map((marker) => (
                  <div 
                    key={marker.id}
                    className="border border-kml-gray/30 rounded-lg p-3 hover:bg-kml-gray/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className={cn(
                          "w-3 h-3 rounded-full",
                          marker.type === "Point" ? "bg-[#2196F3]" : 
                          marker.type === "LineString" ? "bg-[#4CAF50]" : 
                          "bg-[#9C27B0]"
                        )}
                      />
                      <span className="font-medium text-kml-dark-gray">{marker.name || marker.type}</span>
                    </div>
                    <div className="text-xs text-kml-dark-gray/70">
                      <p>Type: {marker.type}</p>
                      {marker.length !== undefined && (
                        <p>Length: {formatDistance(marker.length)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {showDetailed && (
              <div className="border border-kml-gray/30 rounded-lg p-4">
                <h4 className="font-medium text-kml-dark-gray mb-2">Detailed Information</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-kml-gray/30">
                        <th className="py-2 px-3 text-left">Name</th>
                        <th className="py-2 px-3 text-left">Type</th>
                        <th className="py-2 px-3 text-left">Coordinates</th>
                        <th className="py-2 px-3 text-left">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markers.map((marker) => (
                        <tr key={marker.id} className="border-b border-kml-gray/10">
                          <td className="py-2 px-3">{marker.name || '-'}</td>
                          <td className="py-2 px-3">{marker.type}</td>
                          <td className="py-2 px-3">
                            {marker.type === "Point" && marker.coordinates ? marker.coordinates : "-"}
                          </td>
                          <td className="py-2 px-3">
                            {marker.length !== undefined ? formatDistance(marker.length) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KmlMap;
