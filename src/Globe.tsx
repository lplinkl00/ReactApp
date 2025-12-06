import { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Define the data type for volunteer opportunities
interface VolunteerOpportunity {
  opportunity_id: string;
  title: string;
  org_title: string;
  category_desc: string;
  vol_requests: number;
  locality: string;
  region: string;
  status: string;
  Latitude: number;
  Longitude: number;
  color?: [number, number, number];
}

// Color mapping based on category (matching viz.py)
const getCategoryColor = (category: string): [number, number, number] => {
  const colorMap: Record<string, [number, number, number]> = {
    'Strengthening Communities': [10, 230, 120],
    'Environment': [10, 180, 230],
    'Health': [230, 30, 30],
    'Education': [230, 158, 10],
    'Arts & Culture': [180, 10, 230],
  };
  return colorMap[category] || [200, 30, 0];
};

// Initial view state (matching viz.py - centered on NYC)
const INITIAL_VIEW_STATE = {
  latitude: 40.7128,
  longitude: -74.0060,
  zoom: 10,
  minZoom: 5,
  maxZoom: 15,
  pitch: 0,
  bearing: 0,
};

// Map style (dark matter, matching viz.py)
// CARTO dark matter style - using the full URL with proper format
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Mapbox access token - required by react-map-gl v7
// Using a public token for development. For production, use your own token.
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// Improved CSV parser that handles quoted fields and newlines
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row (but handle \r\n)
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
      }
      // Skip \n if preceded by \r
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }
  
  // Add last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

export default function Globe() {
  const [data, setData] = useState<VolunteerOpportunity[]>([]);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load CSV data
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load from public folder first, then fallback to root
        let response: Response | null = null;
        try {
          response = await fetch('/volunteer_opportunities_geocoded.csv');
        } catch (e) {
          // If that fails, try loading from parent directory
          response = await fetch('../volunteer_opportunities_geocoded.csv');
        }
        
        if (!response || !response.ok) {
          throw new Error(`Failed to load CSV: ${response?.statusText || 'File not found'}`);
        }
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) {
          throw new Error('CSV file appears to be empty or invalid');
        }
        
        const headers = rows[0].map(h => h.trim());
        const parsedData: VolunteerOpportunity[] = [];
        
        // Find column indices
        const latIdx = headers.indexOf('Latitude');
        const lonIdx = headers.indexOf('Longitude');
        const categoryIdx = headers.indexOf('category_desc');
        const titleIdx = headers.indexOf('title');
        const orgIdx = headers.indexOf('org_title');
        const volRequestsIdx = headers.indexOf('vol_requests');
        const localityIdx = headers.indexOf('locality');
        const regionIdx = headers.indexOf('region');
        const statusIdx = headers.indexOf('status');
        const oppIdIdx = headers.indexOf('opportunity_id');
        
        if (latIdx === -1 || lonIdx === -1) {
          throw new Error('CSV file missing required Latitude or Longitude columns');
        }
        
        // Parse data rows
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i];
          if (values.length < headers.length) continue;
          
          const lat = parseFloat(values[latIdx] || '');
          const lon = parseFloat(values[lonIdx] || '');
          
          // Skip rows with missing coordinates
          if (isNaN(lat) || isNaN(lon)) continue;
          
          const category = values[categoryIdx] || '';
          const opportunity: VolunteerOpportunity = {
            opportunity_id: values[oppIdIdx] || '',
            title: values[titleIdx] || '',
            org_title: values[orgIdx] || '',
            category_desc: category,
            vol_requests: parseInt(values[volRequestsIdx] || '0', 10) || 0,
            locality: values[localityIdx] || '',
            region: values[regionIdx] || '',
            status: values[statusIdx] || '',
            Latitude: lat,
            Longitude: lon,
            color: getCategoryColor(category),
          };
          
          parsedData.push(opportunity);
        }
        
        setData(parsedData);
        console.log(`✓ Loaded ${parsedData.length} geocoded volunteer opportunities`);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load volunteer opportunities data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Create scatterplot layer (matching viz.py configuration)
  // Memoize the layer to prevent recreation on every render
  const scatterplotLayer = useMemo(() => {
    if (data.length === 0) return null;
    
    return new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: data,
      getPosition: (d: VolunteerOpportunity) => [d.Longitude, d.Latitude],
      getColor: (d: VolunteerOpportunity) => d.color || [200, 30, 0],
      getRadius: 150,
      pickable: true,
      autoHighlight: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 100],
      onHover: (info: any) => {
        setHoverInfo(info);
      },
    });
  }, [data]);

  // Tooltip component (matching viz.py style)
  const renderTooltip = () => {
    if (!hoverInfo || !hoverInfo.object) return null;
    
    const { object } = hoverInfo;
    
    return (
      <div
        style={{
          position: 'absolute',
          left: hoverInfo.x,
          top: hoverInfo.y,
          backgroundColor: '#34495e',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000,
          maxWidth: '300px',
        }}
      >
        <div>
          <b style={{ color: '#ecf0f1' }}>Title:</b> {object.title}<br/>
          <b style={{ color: '#ecf0f1' }}>Organization:</b> {object.org_title}<br/>
          <b style={{ color: '#ecf0f1' }}>Category:</b> {object.category_desc}<br/>
          <b style={{ color: '#ecf0f1' }}>Volunteers Needed:</b> {object.vol_requests}<br/>
          <b style={{ color: '#ecf0f1' }}>Location:</b> {object.locality}, {object.region}<br/>
          <b style={{ color: '#ecf0f1' }}>Status:</b> {object.status}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading volunteer opportunities...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#d32f2f',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>Error: {error}</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Make sure volunteer_opportunities_geocoded.csv is in the public folder
        </div>
      </div>
    );
  }

  // Filter out null layers
  const layers = scatterplotLayer ? [scatterplotLayer] : [];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
      >
        <Map 
          mapStyle={MAP_STYLE}
          reuseMaps={true}
          attributionControl={true}
          style={{ width: '100%', height: '100%' }}
          mapboxAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>
      {renderTooltip()}
    </div>
  );
}

