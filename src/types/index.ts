
export interface KmlElement {
  type: string;
  name?: string;
  description?: string;
  coordinates?: number[][];
  length?: number;
  children?: KmlElement[];
  style?: {
    color?: string;
    width?: number;
    icon?: string;
  };
}

export interface KmlSummary {
  [key: string]: number;
}

export interface MapMarker {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  name?: string;
  length?: number;
}

export interface ParsedKml {
  elements: KmlElement[];
  summary: KmlSummary;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
