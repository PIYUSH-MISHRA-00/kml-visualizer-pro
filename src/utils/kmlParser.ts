
import { KmlElement, KmlSummary, ParsedKml } from "@/types";

export const parseKmlFile = async (file: File): Promise<ParsedKml> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      
      try {
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(
          event.target.result as string,
          "application/xml"
        );
        
        const kmlElements: KmlElement[] = [];
        const summary: KmlSummary = {};
        
        // Parse styles first
        const styles: Record<string, any> = {};
        const styleNodes = kmlDoc.querySelectorAll("Style");
        styleNodes.forEach((styleNode) => {
          const id = styleNode.getAttribute("id");
          if (id) {
            const lineStyle = styleNode.querySelector("LineStyle");
            if (lineStyle) {
              const color = lineNode(lineStyle);
              styles[`#${id}`] = { color, width: 2 };
            }
          }
        });
        
        // Parse placemarks
        const placemarks = kmlDoc.querySelectorAll("Placemark");
        let bounds = {
          north: -90,
          south: 90,
          east: -180,
          west: 180,
          isSet: false
        };
        
        placemarks.forEach((placemark) => {
          const element = parsePlacemark(placemark, styles);
          if (element) {
            kmlElements.push(element);
            
            // Update summary count
            summary[element.type] = (summary[element.type] || 0) + 1;
            
            // Update bounds if coordinates exist
            if (element.coordinates && element.coordinates.length > 0) {
              element.coordinates.forEach(([lon, lat]) => {
                if (lat > bounds.north) bounds.north = lat;
                if (lat < bounds.south) bounds.south = lat;
                if (lon > bounds.east) bounds.east = lon;
                if (lon < bounds.west) bounds.west = lon;
                bounds.isSet = true;
              });
            }
          }
        });
        
        // Parse folders
        const folders = kmlDoc.querySelectorAll("Folder");
        folders.forEach((folder) => {
          summary["Folder"] = (summary["Folder"] || 0) + 1;
        });
        
        resolve({
          elements: kmlElements,
          summary,
          bounds: bounds.isSet ? {
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west,
          } : undefined
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsText(file);
  });
};

function parsePlacemark(placemark: Element, styles: Record<string, any>): KmlElement | null {
  const name = placemark.querySelector("name")?.textContent || undefined;
  const description = placemark.querySelector("description")?.textContent || undefined;
  const styleUrl = placemark.querySelector("styleUrl")?.textContent;
  const style = styleUrl ? styles[styleUrl] : undefined;
  
  // Check for Point
  const point = placemark.querySelector("Point");
  if (point) {
    const coordinates = parseCoordinates(point.querySelector("coordinates")?.textContent);
    if (coordinates && coordinates.length > 0) {
      return {
        type: "Point",
        name,
        description,
        coordinates,
        style
      };
    }
  }
  
  // Check for LineString
  const lineString = placemark.querySelector("LineString");
  if (lineString) {
    const coordinates = parseCoordinates(lineString.querySelector("coordinates")?.textContent);
    if (coordinates && coordinates.length > 0) {
      const length = calculateLength(coordinates);
      return {
        type: "LineString",
        name,
        description,
        coordinates,
        length,
        style
      };
    }
  }
  
  // Check for Polygon
  const polygon = placemark.querySelector("Polygon");
  if (polygon) {
    const outerBoundary = polygon.querySelector("outerBoundaryIs LinearRing coordinates");
    const coordinates = parseCoordinates(outerBoundary?.textContent);
    if (coordinates && coordinates.length > 0) {
      return {
        type: "Polygon",
        name,
        description,
        coordinates,
        style
      };
    }
  }
  
  // Check for MultiGeometry
  const multiGeometry = placemark.querySelector("MultiGeometry");
  if (multiGeometry) {
    const children: KmlElement[] = [];
    
    // Process LineStrings in MultiGeometry
    const lineStrings = multiGeometry.querySelectorAll("LineString");
    lineStrings.forEach((lineString) => {
      const coordinates = parseCoordinates(lineString.querySelector("coordinates")?.textContent);
      if (coordinates && coordinates.length > 0) {
        const length = calculateLength(coordinates);
        children.push({
          type: "LineString",
          coordinates,
          length,
          style
        });
      }
    });
    
    // Process Points in MultiGeometry
    const points = multiGeometry.querySelectorAll("Point");
    points.forEach((point) => {
      const coordinates = parseCoordinates(point.querySelector("coordinates")?.textContent);
      if (coordinates && coordinates.length > 0) {
        children.push({
          type: "Point",
          coordinates,
          style
        });
      }
    });
    
    if (children.length > 0) {
      // Calculate total length for LineStrings
      const totalLength = children
        .filter(child => child.type === "LineString" && child.length)
        .reduce((sum, child) => sum + (child.length || 0), 0);
      
      return {
        type: "MultiGeometry",
        name,
        description,
        children,
        length: totalLength > 0 ? totalLength : undefined,
        style
      };
    }
  }
  
  return null;
}

function parseCoordinates(coordinatesText: string | null | undefined): number[][] {
  if (!coordinatesText) return [];
  
  return coordinatesText
    .trim()
    .split(/\s+/)
    .map(coordString => {
      const [lon, lat, alt] = coordString.split(',').map(Number);
      return [lon, lat]; // Ignore altitude for simplicity
    })
    .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
}

function calculateLength(coordinates: number[][]): number {
  let totalLength = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1];
    const [lon2, lat2] = coordinates[i];
    
    totalLength += haversineDistance(lat1, lon1, lat2, lon2);
  }
  
  return totalLength;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function lineNode(node: Element): string | undefined {
  return node.querySelector("color")?.textContent || undefined;
}

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`;
  }
  return `${distance.toFixed(2)} km`;
};
