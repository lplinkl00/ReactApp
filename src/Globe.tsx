import { useEffect, useState, useMemo } from 'react';
import { DeckGL } from '@deck.gl/react';
import { _GlobeView as GlobeView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';

// Based on deck.gl GlobeView documentation
// https://deck.gl/docs/api-reference/core/globe-view

interface Campaign {
  charity_name: string;
  money_collected: number;
  goal: number;
  campaign_title: string;
  url: string;
  latitude: number;
  longitude: number;
  address: string;
  color?: [number, number, number];
  country?: string;
}


// Color mapping based on progress percentage
const getProgressColor = (collected: number, goal: number): [number, number, number] => {
  if (goal === 0) return [150, 150, 150]; // Gray for no goal
  const progress = collected / goal;
  if (progress >= 1.0) return [10, 230, 120]; // Green for completed
  if (progress >= 0.75) return [100, 200, 100]; // Light green for near completion
  if (progress >= 0.5) return [230, 158, 10]; // Orange for halfway
  if (progress >= 0.25) return [230, 100, 30]; // Dark orange for quarter
  return [230, 30, 30]; // Red for just started
};

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

// Simple function to extract country from address or determine from coordinates
function getCountryFromAddress(address: string, lat: number, lon: number): string {
  // Try to extract country from address (common patterns)
  const addressUpper = address.toUpperCase();
  
  // Common country patterns in addresses
  const countryPatterns: { [key: string]: string[] } = {
    'United States': ['USA', 'US', 'UNITED STATES', 'AMERICA'],
    'United Kingdom': ['UK', 'UNITED KINGDOM', 'ENGLAND', 'SCOTLAND', 'WALES'],
    'Canada': ['CANADA', 'CA'],
    'Australia': ['AUSTRALIA', 'AU'],
    'Germany': ['GERMANY', 'DEUTSCHLAND'],
    'France': ['FRANCE', 'FR'],
    'Spain': ['SPAIN', 'ESPAÑA'],
    'Italy': ['ITALY', 'ITALIA'],
    'Netherlands': ['NETHERLANDS', 'HOLLAND', 'NL'],
    'Belgium': ['BELGIUM', 'BELGIË'],
    'Switzerland': ['SWITZERLAND', 'SCHWEIZ'],
    'Austria': ['AUSTRIA', 'ÖSTERREICH'],
    'Sweden': ['SWEDEN', 'SVERIGE'],
    'Norway': ['NORWAY', 'NORGE'],
    'Denmark': ['DENMARK', 'DANMARK'],
    'Finland': ['FINLAND', 'SUOMI'],
    'Poland': ['POLAND', 'POLSKA'],
    'Ireland': ['IRELAND', 'ÉIRE'],
    'Portugal': ['PORTUGAL'],
    'Greece': ['GREECE', 'ΕΛΛΆΔΑ'],
    'Japan': ['JAPAN', 'JAPAN'],
    'China': ['CHINA', '中国'],
    'India': ['INDIA', 'भारत'],
    'Brazil': ['BRAZIL', 'BRASIL'],
    'Mexico': ['MEXICO', 'MÉXICO'],
    'Argentina': ['ARGENTINA'],
    'South Africa': ['SOUTH AFRICA', 'ZA'],
    'New Zealand': ['NEW ZEALAND', 'NZ'],
  };
  
  // Check address for country patterns
  for (const [country, patterns] of Object.entries(countryPatterns)) {
    for (const pattern of patterns) {
      if (addressUpper.includes(pattern)) {
        return country;
      }
    }
  }
  
  // Fallback: simple coordinate-based country detection (approximate)
  // This is a basic heuristic - for production, use a proper geocoding service
  if (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66) return 'United States';
  if (lat >= 50 && lat <= 84 && lon >= -141 && lon <= -52) return 'Canada';
  if (lat >= 50 && lat <= 61 && lon >= -8 && lon <= 2) return 'United Kingdom';
  if (lat >= -44 && lat <= -10 && lon >= 113 && lon <= 154) return 'Australia';
  if (lat >= 47 && lat <= 55 && lon >= 5 && lon <= 15) return 'Germany';
  if (lat >= 42 && lat <= 51 && lon >= -5 && lon <= 8) return 'France';
  if (lat >= 36 && lat <= 44 && lon >= -10 && lon <= 4) return 'Spain';
  if (lat >= 36 && lat <= 47 && lon >= 6 && lon <= 19) return 'Italy';
  if (lat >= 50 && lat <= 54 && lon >= 3 && lon <= 7) return 'Netherlands';
  if (lat >= 49 && lat <= 52 && lon >= 2 && lon <= 6) return 'Belgium';
  if (lat >= 46 && lat <= 48 && lon >= 5 && lon <= 11) return 'Switzerland';
  if (lat >= 47 && lat <= 49 && lon >= 9 && lon <= 17) return 'Austria';
  if (lat >= 55 && lat <= 69 && lon >= 11 && lon <= 24) return 'Sweden';
  if (lat >= 58 && lat <= 71 && lon >= 4 && lon <= 31) return 'Norway';
  if (lat >= 54 && lat <= 58 && lon >= 8 && lon <= 13) return 'Denmark';
  if (lat >= 60 && lat <= 70 && lon >= 20 && lon <= 32) return 'Finland';
  if (lat >= 49 && lat <= 55 && lon >= 14 && lon <= 25) return 'Poland';
  if (lat >= 51 && lat <= 55 && lon >= -11 && lon <= -5) return 'Ireland';
  if (lat >= 36 && lat <= 42 && lon >= -10 && lon <= -6) return 'Portugal';
  if (lat >= 35 && lat <= 42 && lon >= 19 && lon <= 30) return 'Greece';
  if (lat >= 24 && lat <= 46 && lon >= 123 && lon <= 146) return 'Japan';
  if (lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135) return 'China';
  if (lat >= 6 && lat <= 36 && lon >= 68 && lon <= 97) return 'India';
  if (lat >= -34 && lat <= 6 && lon >= -74 && lon <= -32) return 'Brazil';
  if (lat >= 14 && lat <= 33 && lon >= -118 && lon <= -86) return 'Mexico';
  if (lat >= -56 && lat <= -22 && lon >= -74 && lon <= -53) return 'Argentina';
  if (lat >= -35 && lat <= -22 && lon >= 16 && lon <= 33) return 'South Africa';
  if (lat >= -48 && lat <= -34 && lon >= 166 && lon <= 179) return 'New Zealand';
  
  return 'Unknown';
}

const INITIAL_VIEW_STATE = {
  longitude: 101.6869, // Kuala Lumpur longitude
  latitude: 3.1390,     // Kuala Lumpur latitude
  zoom: 9,
  minZoom: 0,
  maxZoom: 20
};

export default function Globe() {
  const [data, setData] = useState<Campaign[]>([]);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  useEffect(() => {
    // Load CSV data
    const loadData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/cleaned_data.csv');
        
        if (!response || !response.ok) {
          throw new Error(`Failed to load CSV: ${response?.statusText || 'File not found'}`);
        }
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) {
          throw new Error('CSV file appears to be empty or invalid');
        }
        
        const headers = rows[0].map(h => h.trim());
        const parsedData: Campaign[] = [];
        
        // Find column indices
        const latIdx = headers.indexOf('latitude');
        const lonIdx = headers.indexOf('longitude');
        const charityNameIdx = headers.indexOf('charity_name');
        const moneyCollectedIdx = headers.indexOf('money_collected');
        const goalIdx = headers.indexOf('goal');
        const campaignTitleIdx = headers.indexOf('campaign_title');
        const urlIdx = headers.indexOf('url');
        const addressIdx = headers.indexOf('address');
        
        if (latIdx === -1 || lonIdx === -1) {
          throw new Error('CSV file missing required latitude or longitude columns');
        }
        
        // Parse data rows
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i];
          if (values.length < headers.length) continue;
          
          const lat = parseFloat(values[latIdx] || '');
          const lon = parseFloat(values[lonIdx] || '');
          
          // Skip rows with missing coordinates or empty campaign titles
          if (isNaN(lat) || isNaN(lon) || !values[campaignTitleIdx] || values[campaignTitleIdx].trim() === '') continue;
          
          const moneyCollected = parseFloat(values[moneyCollectedIdx] || '0') || 0;
          const goal = parseFloat(values[goalIdx] || '0') || 0;
          
          const address = values[addressIdx] || '';
          const country = getCountryFromAddress(address, lat, lon);
          
          const campaign: Campaign = {
            charity_name: values[charityNameIdx] || '',
            money_collected: moneyCollected,
            goal: goal,
            campaign_title: values[campaignTitleIdx] || '',
            url: values[urlIdx] || '',
            latitude: lat,
            longitude: lon,
            address: address,
            country: country,
            color: getProgressColor(moneyCollected, goal),
          };
          
          parsedData.push(campaign);
        }
        
        setData(parsedData);
        console.log(`✓ Loaded ${parsedData.length} campaigns`);
      } catch (err: any) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Create scatterplot layer for campaigns (precise small points)
  const scatterplotLayer = useMemo(() => {
    if (data.length === 0) return null;
    
    // Calculate max goal for scaling
    const maxGoal = Math.max(...data.map(d => d.goal || 0), 1);
    
    return new ScatterplotLayer({
      id: 'campaigns-layer',
      data: data,
      coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      getPosition: (d: Campaign) => [d.longitude, d.latitude],
      getColor: (d: Campaign) => d.color || [200, 30, 0],
      getRadius: (d: Campaign) => {
        // Precise small radius - small enough to see exact area
        // Scale by goal but keep it very small for precision
        const baseRadius = Math.sqrt((d.goal || 0) / maxGoal) * 2000; // Very small base
        // Fixed small size - precise points
        return Math.max(500, Math.min(10000, baseRadius)); // 500m to 10km for precision
      },
      radiusUnits: 'meters',
      pickable: true,
      autoHighlight: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 180],
      onHover: (info: any) => {
        setHoverInfo(info);
      },
    });
  }, [data]);

  // Combine layers
  const layers = useMemo(() => {
    const allLayers: any[] = [
      new TileLayer({
        data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        renderSubLayers: (props: any) => {
          const {
            bbox: { west, south, east, north }
          } = props.tile;

          return new BitmapLayer({
            id: `${props.id}-bitmap`,
            image: props.data,
            _imageCoordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            bounds: [west, south, east, north]
          });
        }
      })
    ];
    
    // Add individual campaign points
    if (scatterplotLayer) {
      allLayers.push(scatterplotLayer);
    }
    
    return allLayers;
  }, [scatterplotLayer]);

  // Tooltip component
  const renderTooltip = () => {
    if (!hoverInfo || !hoverInfo.object) return null;
    
    const { object } = hoverInfo;
    const campaign = object as Campaign;
    const progress = campaign.goal > 0 ? (campaign.money_collected / campaign.goal * 100).toFixed(1) : 'N/A';
    
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
          maxWidth: '350px',
        }}
      >
        <div>
          <b style={{ color: '#ecf0f1' }}>Campaign:</b> {campaign.campaign_title}<br/>
          {campaign.charity_name && (
            <>
              <b style={{ color: '#ecf0f1' }}>Charity:</b> {campaign.charity_name}<br/>
            </>
          )}
          <b style={{ color: '#ecf0f1' }}>Collected:</b> ${campaign.money_collected.toLocaleString()}<br/>
          <b style={{ color: '#ecf0f1' }}>Goal:</b> ${campaign.goal.toLocaleString()}<br/>
          <b style={{ color: '#ecf0f1' }}>Progress:</b> {progress}%<br/>
          {campaign.country && (
            <>
              <b style={{ color: '#ecf0f1' }}>Country:</b> {campaign.country}<br/>
            </>
          )}
          {campaign.address && (
            <>
              <b style={{ color: '#ecf0f1' }}>Address:</b> {campaign.address}<br/>
            </>
          )}
          {campaign.url && (
            <>
              <a href={campaign.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>
                View Campaign →
              </a>
            </>
          )}
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
        height: '600px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading campaigns...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px', overflow: 'hidden' }}>
      <DeckGL
        views={new GlobeView({
          resolution: 10
        })}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        onViewStateChange={({ viewState }) => {
          // Update viewState and log zoom changes
          const newViewState = {
            ...INITIAL_VIEW_STATE,
            ...viewState,
            minZoom: viewState.minZoom ?? INITIAL_VIEW_STATE.minZoom,
            maxZoom: viewState.maxZoom ?? INITIAL_VIEW_STATE.maxZoom
          };
          setViewState(newViewState);
          // Optional: log zoom level for debugging
          if (viewState.zoom !== undefined) {
            console.log(`Zoom level: ${viewState.zoom.toFixed(2)}`);
          }
        }}
        controller={true}
        layers={layers}
      />
      {/* Zoom level indicator */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        Zoom: {viewState.zoom?.toFixed(2) ?? '0.00'}
      </div>
      {renderTooltip()}
    </div>
  );
}
