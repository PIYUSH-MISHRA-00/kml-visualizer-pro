# KML Visualizer

This project visualizes KML data on an interactive Leaflet map built with React.

## Features
- Interactive map display using [Leaflet](https://leafletjs.com/)
- Visualization of KML points, line strings, and polygons
- Detailed sidebar with map elements information

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PIYUSH-MISHRA-00/kml-visualizer-pro.git
   ```

2. Install dependencies:
   ```bash
   cd kml-visualizer-pro
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

- Upload a KML file to see data visualization on the map.
- Toggle detailed view to see sidebar information such as names, types, coordinates, and lengths.

## Project Structure

- `/src/components` - Contains React components (e.g., KmlMap.tsx).
- `/src/types` - Contains TypeScript type definitions.
- `/src/utils` - Utility functions (e.g., kmlParser).

