import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Search,
  Calendar,
  Globe,
  Thermometer,
  Droplets,
  CloudRain,
  Layers,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Wind,
  Compass,
  X,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Activity,
  Sliders,
  Eye,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { ALL_INDIA_GRID_CELLS, getGridCellsForDay } from '../data/mock/forecastGridData';
import {
  getTemperatureColor,
  getRainfallColor,
  getBustProbabilityColor,
  getConfidenceColor,
  getHumidityColor
} from '../utils/colorScales';
import { getMapTileConfig } from '../utils/mapTileConfig';
import {
  SUB_CONTINENT_BOUNDS,
  getMeteorologicalField,
  generateWeatherRasterDataURL
} from '../utils/weatherRasterGenerator';
import { WhyRiskyExplainabilitySection } from '../components/explainability/WhyRiskyExplainabilitySection';
import { explanationService } from '../services/explanationService';

export function MapAnalysis({
  onBackToDashboard,
  initialGridId = null,
  initialDay = 5,
  initialVariable = 'temperature',
  initialMode = 'explainability',
  onNavigateToExplainability
}) {
  // Operational state
  const [currentDay, setCurrentDay] = useState(initialDay || 5);
  const [activeParameter, setActiveParameter] = useState(initialVariable || 'temperature'); // temperature, rainfall, accumulated, humidity, bust_risk, confidence
  const [selectedModel, setSelectedModel] = useState('NCUM-G / NEPS-G 0.25°');
  const [pressureLevel, setPressureLevel] = useState(850);
  const [layerOpacity, setLayerOpacity] = useState(78);
  const [showWinds, setShowWinds] = useState(true);
  const [showGeopotential, setShowGeopotential] = useState(false);
  const [showCriticalOutlines, setShowCriticalOutlines] = useState(true);

  // Administrative layer states
  const [adminStates, setAdminStates] = useState(true);
  const [adminIndia, setAdminIndia] = useState(true);
  const [adminGlobal, setAdminGlobal] = useState(true);

  // UI Panels
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [analysisModalMode, setAnalysisModalMode] = useState(initialMode || 'explainability'); // explainability, epsgram, meteogram, verification
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Explainability state
  const [explanationData, setExplanationData] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  // Live Hover Tooltip near cursor
  const [hoverTooltip, setHoverTooltip] = useState(null);

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const rasterLayerRef = useRef(null);
  const markerRef = useRef(null);
  const windLayersRef = useRef([]);
  const currentDayRef = useRef(currentDay);
  currentDayRef.current = currentDay;

  // Sync initial parameters
  useEffect(() => {
    if (initialDay) setCurrentDay(initialDay);
  }, [initialDay]);

  useEffect(() => {
    if (initialVariable) setActiveParameter(initialVariable);
  }, [initialVariable]);

  useEffect(() => {
    if (initialMode) setAnalysisModalMode(initialMode);
  }, [initialMode]);

  // Set selected cell from initialGridId or default
  useEffect(() => {
    if (initialGridId) {
      const match = ALL_INDIA_GRID_CELLS.find(c => c.id === initialGridId);
      if (match) {
        setSelectedCell(match);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([match.lat, match.lon], 6.5);
        }
        return;
      }
    }
    const defaultCell = ALL_INDIA_GRID_CELLS.find(c => c.district.toLowerCase().includes('wardha') || c.state.includes('Madhya Pradesh')) || ALL_INDIA_GRID_CELLS[0];
    setSelectedCell(defaultCell);
  }, [initialGridId]);

  // Fetch explainability for selected cell
  useEffect(() => {
    let isMounted = true;
    async function loadExplanation() {
      if (!selectedCell) return;
      setExplanationLoading(true);
      const res = await explanationService.getExplanation(selectedCell.id, currentDay);
      if (isMounted) {
        setExplanationData(res);
        setExplanationLoading(false);
      }
    }
    loadExplanation();
    return () => { isMounted = false; };
  }, [selectedCell, currentDay]);

  // Initialize Map with OpenStreetMap and Cursor Hover Tooltip
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 79.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false
      });

      // Modular OpenStreetMap Basemap (with optional API key support via .env)
      const tileConfig = getMapTileConfig();
      L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom,
        opacity: 0.95
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | NCMRWF Medium-Range NWP')
        .addTo(map);

      // Zoom control top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Mousemove event for live meteorological inspection near cursor
      map.on('mousemove', (e) => {
        const { lat, lng } = e.latlng;
        if (lat >= 6.5 && lat <= 37.5 && lng >= 67.0 && lng <= 98.0) {
          const day = currentDayRef.current;
          const field = getMeteorologicalField(lat, lng, day);
          const closest = ALL_INDIA_GRID_CELLS.reduce((prev, curr) => {
            const dPrev = Math.hypot(prev.lat - lat, prev.lon - lng);
            const dCurr = Math.hypot(curr.lat - lat, curr.lon - lng);
            return dCurr < dPrev ? curr : prev;
          }, ALL_INDIA_GRID_CELLS[0]);

          setHoverTooltip({
            x: e.containerPoint.x,
            y: e.containerPoint.y,
            lat: lat.toFixed(2),
            lon: lng.toFixed(2),
            district: closest.district,
            state: closest.state,
            temperature_c: field.temperature_c,
            nwp_rainfall: field.nwp_rainfall,
            bust_probability: field.bust_probability,
            confidence: field.confidence,
            wind_speed_ms: field.wind_speed_ms,
            wind_direction_deg: field.wind_direction_deg,
            surface_pressure_hpa: field.surface_pressure_hpa
          });
        } else {
          setHoverTooltip(null);
        }
      });

      map.on('mouseout', () => {
        setHoverTooltip(null);
      });

      mapInstanceRef.current = map;

      // Ensure Leaflet correctly calculates dimensions in new tabs
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 100);
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 350);
    }

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        rasterLayerRef.current = null;
        windLayersRef.current = [];
        markerRef.current = null;
      }
    };
  }, []);

  // Auto-play timeline simulation
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentDay(prev => (prev >= 10 ? 1 : prev + 1));
      }, 1600);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Click on map to sample continuous weather field and position pin marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMapClick = (e) => {
      const { lat, lng } = e.latlng;
      if (lat < 6.5 || lat > 37.5 || lng < 67.0 || lng > 98.0) return;

      const field = getMeteorologicalField(lat, lng, currentDay);
      const closest = ALL_INDIA_GRID_CELLS.reduce((prev, curr) => {
        const dPrev = Math.hypot(prev.lat - lat, prev.lon - lng);
        const dCurr = Math.hypot(curr.lat - lat, curr.lon - lng);
        return dCurr < dPrev ? curr : prev;
      }, ALL_INDIA_GRID_CELLS[0]);

      setSelectedCell({
        ...closest,
        id: `point_${lat.toFixed(2)}_${lng.toFixed(2)}`,
        name: `${closest.district}, ${closest.state} [${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E]`,
        lat: Number(lat.toFixed(3)),
        lon: Number(lng.toFixed(3)),
        days: {
          ...closest.days,
          [currentDay]: {
            ...closest.days[currentDay],
            temperature_c: field.temperature_c,
            nwp_rainfall: field.nwp_rainfall,
            bust_probability: field.bust_probability,
            confidence: field.confidence,
            humidity_pct: field.humidity_pct,
            surface_pressure_hpa: field.surface_pressure_hpa,
            wind_speed_ms: field.wind_speed_ms,
            wind_direction_deg: field.wind_direction_deg
          }
        }
      });
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [currentDay]);

  // Smooth opacity slider adjustment without redrawing
  useEffect(() => {
    if (rasterLayerRef.current) {
      rasterLayerRef.current.setOpacity(layerOpacity / 100);
    }
  }, [layerOpacity]);

  // Update continuous raster gradient and wind streamlines on day or parameter change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Generate smooth continuous meteorological raster overlay (NO BLOCKS!)
    const rasterUrl = generateWeatherRasterDataURL(activeParameter, currentDay);
    if (rasterLayerRef.current) {
      rasterLayerRef.current.setUrl(rasterUrl);
      rasterLayerRef.current.setOpacity(layerOpacity / 100);
    } else {
      rasterLayerRef.current = L.imageOverlay(rasterUrl, SUB_CONTINENT_BOUNDS, {
        opacity: layerOpacity / 100,
        interactive: false
      }).addTo(map);
    }

    // 2. Clear previous wind streamlines
    windLayersRef.current.forEach(layer => map.removeLayer(layer));
    windLayersRef.current = [];

    // 3. Render elegant wind streamlines matching reference when Winds toggle is ON
    if (showWinds) {
      const windSamplePoints = [
        [15.0, 72.0], [17.5, 71.5], [20.0, 71.0], [12.0, 74.0], [14.0, 75.5],
        [16.5, 74.5], [19.0, 73.5], [21.5, 72.5], [24.0, 70.0], [13.0, 78.0],
        [15.5, 78.5], [18.0, 77.0], [21.0, 76.5], [23.5, 75.0], [26.0, 73.5],
        [28.5, 72.0], [14.0, 82.0], [17.0, 82.5], [20.0, 81.5], [22.5, 80.0],
        [25.0, 78.5], [27.5, 77.0], [30.0, 75.5], [18.0, 86.0], [21.0, 86.5],
        [23.5, 84.5], [26.0, 82.0], [24.0, 88.5], [26.5, 86.5], [25.0, 92.0]
      ];

      windSamplePoints.forEach(([lat, lon]) => {
        const field = getMeteorologicalField(lat, lon, currentDay);
        const rad = (field.wind_direction_deg * Math.PI) / 180;
        const arrowLen = 0.55;
        const toLat = lat + arrowLen * Math.cos(rad);
        const toLon = lon + arrowLen * Math.sin(rad);

        // Vector arrow with arrowhead
        const line = L.polyline([[lat, lon], [toLat, toLon]], {
          color: '#1E293B',
          weight: 1.8,
          opacity: 0.70
        }).addTo(map);

        windLayersRef.current.push(line);
      });
    }

    // 4. Update marker on selected cell
    if (selectedCell) {
      if (markerRef.current) map.removeLayer(markerRef.current);
      const icon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 14px; height: 14px; background: #2563EB; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 12px rgba(37,99,235,0.9);"></div>
            <div style="position: absolute; width: 34px; height: 34px; border: 2px solid rgba(37,99,235,0.6); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      markerRef.current = L.marker([selectedCell.lat, selectedCell.lon], { icon }).addTo(map);
    }
  }, [currentDay, activeParameter, showWinds, selectedCell]);

  // Selected cell current day metrics
  const activeDayData = selectedCell ? (selectedCell.days[currentDay] || selectedCell.days[5]) : null;

  // Handle search location jump
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    const match = ALL_INDIA_GRID_CELLS.find(
      c => c.district.toLowerCase().includes(query) ||
           c.state.toLowerCase().includes(query) ||
           c.name.toLowerCase().includes(query)
    );

    if (match && mapInstanceRef.current) {
      setSelectedCell(match);
      mapInstanceRef.current.flyTo([match.lat, match.lon], 6.5, { duration: 1.2 });
      setSearchQuery('');
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      fontFamily: 'var(--font-family-base)',
      overflow: 'hidden'
    }}>
      {/* 1. TOP NAVBAR (Modeled after NCMRWF Reference Header) */}
      <header style={{
        height: '56px',
        backgroundColor: '#1E293B',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 500,
        flexShrink: 0
      }}>
        {/* Left: Brand & Operational Institution */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Compass size={20} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
              margin: 0
            }}>
              National Centre For Medium Range Weather Forecasting
            </h1>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', letterSpacing: '0.02em' }}>
              NWP Verification & Forecast Analysis Console
            </span>
          </div>
        </div>

        {/* Right: Search, Region, and Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Location Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search location (e.g. Pune, Mada, Wardha)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '6px 12px 6px 32px',
                color: '#F8FAFC',
                fontSize: '0.8125rem',
                width: '240px',
                outline: 'none'
              }}
            />
          </form>

          {/* Region Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.8125rem',
            color: '#E2E8F0'
          }}>
            <Globe size={14} style={{ color: '#38BDF8' }} />
            <span>India Subcontinent</span>
          </div>

          {/* Date / Initialization Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.8125rem',
            color: '#E2E8F0'
          }}>
            <Calendar size={14} style={{ color: '#38BDF8' }} />
            <span>2026-09-29 (00Z Run)</span>
          </div>

          {/* Back to Dashboard Button */}
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              style={{
                backgroundColor: '#334155',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Dashboard</span>
              <Minimize2 size={13} />
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN MAP VIEWPORT */}
      <div style={{ position: 'relative', flex: 1, width: '100%', height: 'calc(100vh - 56px)' }}>
        {/* Full-bleed Leaflet container */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Cursor-Following Live Meteorological Readout Tooltip */}
        {hoverTooltip && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(hoverTooltip.x + 18, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 240)}px`,
              top: `${Math.min(Math.max(12, hoverTooltip.y - 12), (typeof window !== 'undefined' ? window.innerHeight : 800) - 220)}px`,
              pointerEvents: 'none',
              zIndex: 600,
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 4px 8px -2px rgba(0, 0, 0, 0.4)',
              color: '#F8FAFC',
              minWidth: '210px',
              transition: 'opacity 0.1s ease'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(71, 85, 105, 0.6)',
              paddingBottom: '5px',
              marginBottom: '6px'
            }}>
              <strong style={{ color: '#38BDF8', fontSize: '0.8125rem' }}>
                {hoverTooltip.district}
              </strong>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                {hoverTooltip.state}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: '12px',
              rowGap: '3px',
              fontSize: '0.6875rem'
            }}>
              <span style={{ color: '#94A3B8' }}>Coordinates:</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#E2E8F0' }}>
                {hoverTooltip.lat}°N, {hoverTooltip.lon}°E
              </span>

              <span style={{ color: '#94A3B8' }}>Temperature:</span>
              <span style={{ textAlign: 'right', fontWeight: 700, color: '#FB923C' }}>
                {hoverTooltip.temperature_c} °C
              </span>

              <span style={{ color: '#94A3B8' }}>NWP Rainfall:</span>
              <span style={{ textAlign: 'right', fontWeight: 700, color: '#38BDF8' }}>
                {hoverTooltip.nwp_rainfall} mm
              </span>

              <span style={{ color: '#94A3B8' }}>Bust Risk:</span>
              <span style={{
                textAlign: 'right',
                fontWeight: 700,
                color: hoverTooltip.bust_probability >= 0.5 ? '#EF4444' : '#10B981'
              }}>
                {Math.round(hoverTooltip.bust_probability * 100)}%
              </span>

              <span style={{ color: '#94A3B8' }}>Confidence:</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#A7F3D0' }}>
                {Math.round(hoverTooltip.confidence * 100)}%
              </span>

              <span style={{ color: '#94A3B8' }}>Wind:</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#CBD5E1' }}>
                {hoverTooltip.wind_speed_ms} m/s ({hoverTooltip.wind_direction_deg}°)
              </span>

              <span style={{ color: '#94A3B8' }}>Pressure:</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#CBD5E1' }}>
                {hoverTooltip.surface_pressure_hpa} hPa
              </span>
            </div>
          </div>
        )}

        {/* 3. RIGHT FLOATING CONTROL PANEL (From Reference Screenshot) */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: sidebarOpen ? '290px' : '44px',
          maxHeight: 'calc(100% - 100px)',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(71, 85, 105, 0.7)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          zIndex: 450,
          transition: 'width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header with collapse button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(71, 85, 105, 0.5)'
          }}>
            {sidebarOpen && (
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC' }}>
                Forecast Controls
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: '#2563EB',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {sidebarOpen && (
            <div style={{ padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Administrative toggles */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Administrative:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={adminStates} onChange={(e) => setAdminStates(e.target.checked)} />
                    <span>States</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={adminIndia} onChange={(e) => setAdminIndia(e.target.checked)} />
                    <span>India</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={adminGlobal} onChange={(e) => setAdminGlobal(e.target.checked)} />
                    <span>Global</span>
                  </label>
                </div>
              </div>

              {/* Choose Model */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Choose Model:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem',
                    outline: 'none'
                  }}
                >
                  <option value="NCUM-G / NEPS-G 0.25°">NCUM-G / NEPS-G 0.25° (Operational)</option>
                  <option value="GFS Seamless 0.25°">NOAA GFS Seamless 0.25°</option>
                  <option value="ECMWF IFS 0.25°">ECMWF IFS 0.25° (Global)</option>
                </select>
              </div>

              {/* Weather Parameter Grid */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Weather Parameter:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    onClick={() => setActiveParameter('temperature')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeParameter === 'temperature' ? '#2563EB' : '#334155',
                      backgroundColor: activeParameter === 'temperature' ? '#2563EB' : '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Thermometer size={16} />
                    <span>Temperature</span>
                  </button>

                  <button
                    onClick={() => setActiveParameter('humidity')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeParameter === 'humidity' ? '#2563EB' : '#334155',
                      backgroundColor: activeParameter === 'humidity' ? '#2563EB' : '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Droplets size={16} />
                    <span>Humidity</span>
                  </button>

                  <button
                    onClick={() => setActiveParameter('rainfall')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeParameter === 'rainfall' ? '#2563EB' : '#334155',
                      backgroundColor: activeParameter === 'rainfall' ? '#2563EB' : '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <CloudRain size={16} />
                    <span>Rainfall</span>
                  </button>

                  <button
                    onClick={() => setActiveParameter('accumulated')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeParameter === 'accumulated' ? '#2563EB' : '#334155',
                      backgroundColor: activeParameter === 'accumulated' ? '#2563EB' : '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Layers size={16} />
                    <span>Accum. Rain</span>
                  </button>

                  <button
                    onClick={() => setActiveParameter('bust_risk')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeParameter === 'bust_risk' ? '#DC2626' : '#334155',
                      backgroundColor: activeParameter === 'bust_risk' ? '#DC2626' : '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>Bust Risk %</span>
                  </button>

                  <button
                    onClick={() => setActiveParameter('confidence')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeParameter === 'confidence' ? '#059669' : '#334155',
                      backgroundColor: activeParameter === 'confidence' ? '#059669' : '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Confidence</span>
                  </button>
                </div>
              </div>

              {/* Pressure Level Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94A3B8', fontWeight: 600 }}>Pressure Level:</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>{pressureLevel} hPa</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  step="50"
                  value={pressureLevel}
                  onChange={(e) => setPressureLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
              </div>

              {/* Opacity Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94A3B8', fontWeight: 600 }}>Opacity:</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>{layerOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={layerOpacity}
                  onChange={(e) => setLayerOpacity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
              </div>

              {/* Toggles: Winds, Geopotential, Critical Risk Flags */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <Wind size={14} style={{ color: '#38BDF8' }} />
                    <span>Winds (850hPa)</span>
                  </div>
                  <button
                    onClick={() => setShowWinds(!showWinds)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: showWinds ? '#2563EB' : '#475569',
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    {showWinds ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <Activity size={14} style={{ color: '#38BDF8' }} />
                    <span>Geopotential</span>
                  </div>
                  <button
                    onClick={() => setShowGeopotential(!showGeopotential)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: showGeopotential ? '#2563EB' : '#475569',
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    {showGeopotential ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    <span>Bust Risk Outline</span>
                  </div>
                  <button
                    onClick={() => setShowCriticalOutlines(!showCriticalOutlines)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: showCriticalOutlines ? '#DC2626' : '#475569',
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    {showCriticalOutlines ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. SELECTED LOCATION POPUP (Matches exact reference card floating over location) */}
        {selectedCell && activeDayData && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            marginTop: '-24px',
            width: '270px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
            color: '#1E293B',
            zIndex: 480,
            border: '1px solid #E2E8F0'
          }}>
            {/* Header: Dot + Location Name */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>
                  {selectedCell.district}, {selectedCell.state}
                </span>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Readout matching reference: TEMPERATURE, RAINFALL, BUST PROBABILITY */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.75rem',
              color: '#475569',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>TEMPERATURE:</span>
                <span style={{ color: '#0F172A', fontWeight: 800 }}>{activeDayData.temperature_c} °C</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>NWP RAINFALL:</span>
                <span style={{ color: '#0284C7', fontWeight: 800 }}>{activeDayData.nwp_rainfall} mm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontWeight: 700 }}>BUST PROBABILITY:</span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  backgroundColor: activeDayData.bust_probability >= 0.50 ? '#FEE2E2' : '#DCFCE7',
                  color: activeDayData.bust_probability >= 0.50 ? '#DC2626' : '#15803D'
                }}>
                  {Math.round(activeDayData.bust_probability * 100)}%
                </span>
              </div>
            </div>

            {/* Radio options: Explainability, Meteogram, Verification, EPSgram */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="analysisType"
                  value="explainability"
                  checked={analysisModalMode === 'explainability'}
                  onChange={() => setAnalysisModalMode('explainability')}
                />
                <span style={{ color: '#D97706', fontWeight: 800 }}>Why is this risky? (Explainability)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="analysisType"
                  value="meteogram"
                  checked={analysisModalMode === 'meteogram'}
                  onChange={() => setAnalysisModalMode('meteogram')}
                />
                <span>Meteogram Time Series</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="analysisType"
                  value="verification"
                  checked={analysisModalMode === 'verification'}
                  onChange={() => setAnalysisModalMode('verification')}
                />
                <span>Forecast vs Reference Truth</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="analysisType"
                  value="epsgram"
                  checked={analysisModalMode === 'epsgram'}
                  onChange={() => setAnalysisModalMode('epsgram')}
                />
                <span>EPSgram (21 Ensemble Members)</span>
              </label>
            </div>

            {/* Quick Explainability Action Button */}
            <button
              onClick={() => {
                setAnalysisModalMode('explainability');
                setShowDetailModal(true);
              }}
              style={{
                width: '100%',
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B45309'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D97706'}
            >
              <span>Why is this forecast risky?</span>
              <ArrowRight size={13} />
            </button>

            {/* Primary Action Button: View Details */}
            <button
              onClick={() => setShowDetailModal(true)}
              style={{
                width: '100%',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369A1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0284C7'}
            >
              View Details
            </button>
          </div>
        )}

        {/* 5. COLOR SCALE & LEGEND BAR (Bottom Right) */}
        <div style={{
          position: 'absolute',
          bottom: '88px',
          right: '20px',
          backgroundColor: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(71, 85, 105, 0.6)',
          borderRadius: '8px',
          padding: '8px 12px',
          zIndex: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>{activeParameter.replace('_', ' ')} Scale</span>
            <span>{activeParameter === 'temperature' ? '°C' : (activeParameter.includes('rain') ? 'mm' : '%')}</span>
          </div>

          {/* Color Gradient Strip / NCMRWF Operational Palette */}
          {activeParameter === 'temperature' && (
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {[
                { v: '-10', bg: '#9333ea', fg: '#fff' },
                { v: '-5',  bg: '#6366f1', fg: '#fff' },
                { v: '0',   bg: '#2563eb', fg: '#fff' },
                { v: '3',   bg: '#06b6d4', fg: '#fff' },
                { v: '8',   bg: '#10b981', fg: '#fff' },
                { v: '12',  bg: '#84cc16', fg: '#000' },
                { v: '14',  bg: '#bef264', fg: '#000' },
                { v: '16',  bg: '#facc15', fg: '#000' },
                { v: '18',  bg: '#fbbf24', fg: '#000' },
                { v: '20',  bg: '#fb923c', fg: '#000' },
                { v: '22',  bg: '#f97316', fg: '#fff' },
                { v: '24',  bg: '#f43f5e', fg: '#fff' },
                { v: '26',  bg: '#ef4444', fg: '#fff' },
                { v: '28',  bg: '#dc2626', fg: '#fff' },
                { v: '30',  bg: '#991b1b', fg: '#fff' }
              ].map((stop, i) => (
                <div key={i} style={{
                  backgroundColor: stop.bg,
                  color: stop.fg,
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '2px 5px',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {stop.v}
                </div>
              ))}
            </div>
          )}

          {activeParameter === 'bust_risk' && (
            <div>
              <div style={{
                width: '260px',
                height: '10px',
                borderRadius: '2px',
                background: 'linear-gradient(to right, #2D8A68, #D8A23A, #D9826B, #C85C5C)'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: '#E2E8F0', marginTop: '2px' }}>
                <span>0% (Low)</span>
                <span>30%</span>
                <span>50%</span>
                <span>70%</span>
                <span>100% (Critical)</span>
              </div>
            </div>
          )}

          {activeParameter === 'rainfall' && (
            <div>
              <div style={{
                width: '260px',
                height: '10px',
                borderRadius: '2px',
                background: 'linear-gradient(to right, #E2E8F0, #99D5CF, #4FA8A0, #176B68, #0E4846)'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: '#E2E8F0', marginTop: '2px' }}>
                <span>0 mm</span>
                <span>15 mm</span>
                <span>35 mm</span>
                <span>60 mm</span>
                <span>100+ mm</span>
              </div>
            </div>
          )}

          {activeParameter === 'humidity' && (
            <div>
              <div style={{
                width: '260px',
                height: '10px',
                borderRadius: '2px',
                background: 'linear-gradient(to right, #fed7aa, #bae6fd, #38bdf8, #0284c7, #1e3a8a)'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: '#E2E8F0', marginTop: '2px' }}>
                <span>30%</span>
                <span>50%</span>
                <span>70%</span>
                <span>85%</span>
                <span>95%+</span>
              </div>
            </div>
          )}

          {activeParameter === 'confidence' && (
            <div>
              <div style={{
                width: '260px',
                height: '10px',
                borderRadius: '2px',
                background: 'linear-gradient(to right, #D9826B, #D8A23A, #8FAFA5, #176B68)'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: '#E2E8F0', marginTop: '2px' }}>
                <span>0% (Low)</span>
                <span>40%</span>
                <span>70%</span>
                <span>100% (High)</span>
              </div>
            </div>
          )}
        </div>

        {/* 6. BOTTOM TIMELINE & FORECAST PLAYER (Exact layout from reference) */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          right: '20px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(71, 85, 105, 0.7)',
          borderRadius: '10px',
          padding: '10px 18px',
          zIndex: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Top row: Play button, Step Tag, and Scrubber Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {isPlaying ? <Pause size={18} fill="#0F172A" /> : <Play size={18} fill="#0F172A" style={{ marginLeft: '2px' }} />}
            </button>

            {/* Current Step Pill */}
            <div style={{
              backgroundColor: '#1E293B',
              border: '1px solid #475569',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: '#F8FAFC',
              whiteSpace: 'nowrap'
            }}>
              <strong>Date:</strong> 2026-09-29 &nbsp;|&nbsp; <strong>Lead:</strong> Day {currentDay} (+{currentDay * 24}h)
            </div>

            {/* 10-Day Timeline Track */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="1"
                max="10"
                value={currentDay}
                onChange={(e) => setCurrentDay(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#38BDF8',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Bottom row: Day Date Labels and Live Weather Sensor Readout */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                <span
                  key={d}
                  onClick={() => setCurrentDay(d)}
                  style={{
                    cursor: 'pointer',
                    color: currentDay === d ? '#38BDF8' : '#94A3B8',
                    fontWeight: currentDay === d ? 700 : 400
                  }}
                >
                  Day {d} (09-{(28 + d).toString().padStart(2, '0')})
                </span>
              ))}
            </div>

            {/* Readout bottom left like reference */}
            {activeDayData && (
              <div style={{ color: '#CBD5E1', fontSize: '0.6875rem', fontWeight: 600 }}>
                Wind Direction: <span style={{ color: '#38BDF8' }}>{activeDayData.wind_direction_deg}°</span> &nbsp;|&nbsp;
                Wind Speed: <span style={{ color: '#38BDF8' }}>{activeDayData.wind_speed_ms} m/s</span> &nbsp;|&nbsp;
                Pressure: <span style={{ color: '#38BDF8' }}>{activeDayData.surface_pressure_hpa} hPa</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. DEEP METEOROLOGICAL ANALYSIS MODAL (EPSgram, Meteogram, Forecast vs Reference) */}
      {showDetailModal && selectedCell && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '900px',
            maxWidth: '96vw',
            maxHeight: '90vh',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '14px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} style={{ color: '#38BDF8' }} />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {selectedCell.district}, {selectedCell.state} [{selectedCell.lat}°N, {selectedCell.lon}°E]
                  </h2>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {selectedCell.terrain} • Synoptic Regime: {selectedCell.synoptic_regime}
                </span>
              </div>

              {/* Mode Switcher Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setAnalysisModalMode('explainability')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: analysisModalMode === 'explainability' ? '#D97706' : '#334155',
                    color: '#FFFFFF'
                  }}
                >
                  Why Risky? (Explainability)
                </button>
                <button
                  onClick={() => setAnalysisModalMode('epsgram')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: analysisModalMode === 'epsgram' ? '#0284C7' : '#334155',
                    color: '#FFFFFF'
                  }}
                >
                  EPSgram (Ensemble)
                </button>
                <button
                  onClick={() => setAnalysisModalMode('meteogram')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: analysisModalMode === 'meteogram' ? '#0284C7' : '#334155',
                    color: '#FFFFFF'
                  }}
                >
                  Meteogram
                </button>
                <button
                  onClick={() => setAnalysisModalMode('verification')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: analysisModalMode === 'verification' ? '#0284C7' : '#334155',
                    color: '#FFFFFF'
                  }}
                >
                  Forecast vs Actual
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    marginLeft: '12px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* TAB 0: EXPLAINABILITY ("Why is this forecast risky?") */}
              {analysisModalMode === 'explainability' && (
                <div>
                  <WhyRiskyExplainabilitySection
                    explanationData={explanationData}
                    loading={explanationLoading}
                    compact={false}
                  />
                </div>
              )}
              {/* TAB 1: EPSGRAM (Ensemble Prediction System Gram) */}
              {analysisModalMode === 'epsgram' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                        21-Member Ensemble Plume & Probability Envelope (NEPS-G)
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                        Shows member spread (IQR & 10th–90th percentiles). High spread past Day 5 identifies the physical mechanism for forecast bust.
                      </p>
                    </div>
                    <span style={{
                      backgroundColor: activeDayData.bust_probability >= 0.70 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                      color: activeDayData.bust_probability >= 0.70 ? '#EF4444' : '#10B981',
                      border: `1px solid ${activeDayData.bust_probability >= 0.70 ? '#EF4444' : '#10B981'}`,
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      Day {currentDay} Bust Probability: {Math.round(activeDayData.bust_probability * 100)}%
                    </span>
                  </div>

                  {/* SVG Box-and-Whisker EPSGRAM across 10 Days */}
                  <div style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #334155'
                  }}>
                    <svg viewBox="0 0 800 240" style={{ width: '100%', height: '240px', overflow: 'visible' }}>
                      {/* Grid lines */}
                      {[0, 25, 50, 75, 100, 125].map((val) => {
                        const y = 200 - (val / 125) * 170;
                        return (
                          <g key={val}>
                            <line x1="40" y1={y} x2="780" y2={y} stroke="#334155" strokeDasharray="3,3" />
                            <text x="32" y={y + 4} fill="#64748B" fontSize="10" textAnchor="end">{val}mm</text>
                          </g>
                        );
                      })}

                      {/* 10 Days EPS Box plots */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d, idx) => {
                        const dayData = selectedCell.days[d];
                        const x = 70 + idx * 72;
                        const scale = 170 / 125;

                        const yP10 = 200 - Math.min(125, dayData.ensemble_p10) * scale;
                        const yP25 = 200 - Math.min(125, dayData.ensemble_p25) * scale;
                        const yMed = 200 - Math.min(125, dayData.ensemble_median) * scale;
                        const yP75 = 200 - Math.min(125, dayData.ensemble_p75) * scale;
                        const yP90 = 200 - Math.min(125, dayData.ensemble_p90) * scale;
                        const yDet = 200 - Math.min(125, dayData.nwp_rainfall) * scale;

                        const isCurrent = d === currentDay;

                        return (
                          <g key={d}>
                            {/* Whisker line P10 to P90 */}
                            <line x1={x} y1={yP90} x2={x} y2={yP10} stroke={isCurrent ? '#38BDF8' : '#94A3B8'} strokeWidth="1.5" />
                            <line x1={x - 6} y1={yP90} x2={x + 6} y2={yP90} stroke={isCurrent ? '#38BDF8' : '#94A3B8'} strokeWidth="1.5" />
                            <line x1={x - 6} y1={yP10} x2={x + 6} y2={yP10} stroke={isCurrent ? '#38BDF8' : '#94A3B8'} strokeWidth="1.5" />

                            {/* Interquartile Box P25 to P75 */}
                            <rect
                              x={x - 14}
                              y={Math.min(yP25, yP75)}
                              width="28"
                              height={Math.max(4, Math.abs(yP25 - yP75))}
                              fill={isCurrent ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.2)'}
                              stroke={isCurrent ? '#38BDF8' : '#64748B'}
                              strokeWidth="1.5"
                              rx="2"
                            />

                            {/* Median Line */}
                            <line x1={x - 14} y1={yMed} x2={x + 14} y2={yMed} stroke="#F59E0B" strokeWidth="2" />

                            {/* Deterministic Forecast Point */}
                            <circle cx={x} cy={yDet} r="3.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />

                            {/* Day Label */}
                            <text
                              x={x}
                              y="225"
                              fill={isCurrent ? '#38BDF8' : '#94A3B8'}
                              fontSize="11"
                              fontWeight={isCurrent ? 'bold' : 'normal'}
                              textAnchor="middle"
                            >
                              D{d}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* EPS Legend */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', fontSize: '0.75rem', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', backgroundColor: 'rgba(56, 189, 248, 0.4)', border: '1px solid #38BDF8' }}></span>
                        <span style={{ color: '#94A3B8' }}>25th–75th Percentile (IQR)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '16px', height: '2px', backgroundColor: '#F59E0B' }}></span>
                        <span style={{ color: '#94A3B8' }}>Ensemble Median (P50)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                        <span style={{ color: '#94A3B8' }}>Deterministic Model Run</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: METEOGRAM */}
              {analysisModalMode === 'meteogram' && (
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                    Multi-Variable Meteogram Time Series (Day 1–10)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '14px' }}>
                    Continuous physical atmospheric variables: Temperature, Precipitation, Surface Pressure, and Wind.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Panel 1: Temperature */}
                    <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                        <span style={{ color: '#F8FAFC', fontWeight: 700 }}>2m Temperature (°C)</span>
                        <span style={{ color: '#F97316' }}>Peak: {Math.max(...[1,2,3,4,5,6,7,8,9,10].map(d => selectedCell.days[d].temperature_c))} °C</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', textAlign: 'center' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                          <div key={d} style={{ backgroundColor: d === currentDay ? '#2563EB' : '#334155', padding: '6px 2px', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>D{d}</div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>{selectedCell.days[d].temperature_c}°</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Panel 2: Precipitation */}
                    <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                        <span style={{ color: '#F8FAFC', fontWeight: 700 }}>24h NWP Rainfall (mm)</span>
                        <span style={{ color: '#38BDF8' }}>Day {currentDay}: {activeDayData.nwp_rainfall} mm</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', textAlign: 'center' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                          <div key={d} style={{ backgroundColor: d === currentDay ? '#0284C7' : '#334155', padding: '6px 2px', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>D{d}</div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38BDF8' }}>{selectedCell.days[d].nwp_rainfall}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Panel 3: Surface Pressure & Wind */}
                    <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                        <span style={{ color: '#F8FAFC', fontWeight: 700 }}>Surface Pressure (hPa) & 10m Wind Speed</span>
                        <span style={{ color: '#A7F3D0' }}>{activeDayData.surface_pressure_hpa} hPa • {activeDayData.wind_speed_ms} m/s</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', textAlign: 'center' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                          <div key={d} style={{ backgroundColor: d === currentDay ? '#065F46' : '#334155', padding: '6px 2px', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>D{d}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF' }}>{selectedCell.days[d].surface_pressure_hpa}</div>
                            <div style={{ fontSize: '0.625rem', color: '#34D399' }}>{selectedCell.days[d].wind_speed_ms}m/s</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FORECAST VS ACTUAL VERIFICATION */}
              {analysisModalMode === 'verification' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                        Forecast vs Reference Truth & Dynamic Bust Verification
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                        Compares NWP Forecast (F) with Observed Ground Truth (O) against the climatological P90 bust threshold.
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                      Local P90 Climatology Threshold: <strong>±{activeDayData.p90_threshold} mm</strong>
                    </span>
                  </div>

                  {/* Verification Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                        <th style={{ padding: '8px 12px' }}>LEAD HORIZON</th>
                        <th style={{ padding: '8px 12px' }}>NWP FORECAST (F)</th>
                        <th style={{ padding: '8px 12px' }}>OBSERVED TRUTH (O)</th>
                        <th style={{ padding: '8px 12px' }}>ERROR |F - O|</th>
                        <th style={{ padding: '8px 12px' }}>P90 THRESHOLD</th>
                        <th style={{ padding: '8px 12px' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => {
                        const dayData = selectedCell.days[d];
                        const isBust = dayData.is_bust;
                        return (
                          <tr
                            key={d}
                            style={{
                              borderBottom: '1px solid #1E293B',
                              backgroundColor: d === currentDay ? 'rgba(56, 189, 248, 0.15)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '8px 12px', fontWeight: d === currentDay ? 800 : 500, color: d === currentDay ? '#38BDF8' : '#FFFFFF' }}>
                              Day {d} (+{d * 24}h)
                            </td>
                            <td style={{ padding: '8px 12px', color: '#38BDF8' }}>{dayData.nwp_rainfall} mm</td>
                            <td style={{ padding: '8px 12px', color: '#A7F3D0' }}>{dayData.actual_rainfall} mm</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: isBust ? '#EF4444' : '#E2E8F0' }}>
                              ±{dayData.rain_error} mm
                            </td>
                            <td style={{ padding: '8px 12px', color: '#94A3B8' }}>{dayData.p90_threshold} mm</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                backgroundColor: isBust ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: isBust ? '#EF4444' : '#10B981'
                              }}>
                                {isBust ? 'FORECAST BUST' : 'RELIABLE'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default MapAnalysis;
