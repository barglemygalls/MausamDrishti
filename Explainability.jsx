import React, { useState, useEffect } from 'react';
import { HelpCircle, MapPin, Calendar, Layers, Sparkles, ArrowRight } from 'lucide-react';
import { ALL_INDIA_GRID_CELLS, RAW_GRID_CELLS } from '../data/mock/forecastGridData';
import { explanationService } from '../services/explanationService';
import { WhyRiskyExplainabilitySection } from '../components/explainability/WhyRiskyExplainabilitySection';
import { FeatureImportanceChart } from '../components/explainability/FeatureImportanceChart';
import { MeteorologicalFactorCard } from '../components/explainability/MeteorologicalFactorCard';
import { EnsembleSpreadViewer } from '../components/explainability/EnsembleSpreadViewer';

export function Explainability({ initialGridId = 'grid_4821', initialDay = 5, onNavigateToMapAnalysis }) {
  const [selectedGridId, setSelectedGridId] = useState(initialGridId);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [explanationData, setExplanationData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync if props change
  useEffect(() => {
    if (initialGridId) setSelectedGridId(initialGridId);
    if (initialDay) setSelectedDay(initialDay);
  }, [initialGridId, initialDay]);

  useEffect(() => {
    let isMounted = true;
    async function loadExplanation() {
      setLoading(true);
      const res = await explanationService.getExplanation(selectedGridId, selectedDay, 'Rainfall');
      if (isMounted) {
        setExplanationData(res);
        setLoading(false);
      }
    }
    loadExplanation();
    return () => { isMounted = false; };
  }, [selectedGridId, selectedDay]);

  const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Combined selectable locations list
  const availableLocations = RAW_GRID_CELLS.length > 0 ? RAW_GRID_CELLS : ALL_INDIA_GRID_CELLS.slice(0, 30);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          Explainable AI & Meteorological Reasoning
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
          Trace how NWP forecast differences against observational truth trigger the bust detection model
        </p>
      </div>

      {/* Target Selector Bar */}
      <div className="scientific-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Location Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={18} style={{ color: 'var(--primary-accent)' }} />
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Target NWP Grid Cell / Location
              </label>
              <select
                value={selectedGridId}
                onChange={(e) => setSelectedGridId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-neutral)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {availableLocations.map((cell) => (
                  <option key={cell.id} value={cell.id}>
                    {cell.code}: {cell.district}, {cell.state} [{cell.lat}°N, {cell.lon}°E]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lead Day Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} style={{ color: 'var(--secondary-accent)' }} />
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Forecast Lead Time
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: selectedDay === day ? 'var(--primary-accent)' : 'var(--border-neutral)',
                      backgroundColor: selectedDay === day ? 'var(--primary-accent)' : '#FFFFFF',
                      color: selectedDay === day ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: selectedDay === day ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary "Why is this forecast risky?" Explainability Section */}
      <div style={{ marginBottom: '24px' }}>
        <WhyRiskyExplainabilitySection
          explanationData={explanationData}
          loading={loading}
          onOpenMapAnalysis={(gridId, day) => onNavigateToMapAnalysis && onNavigateToMapAnalysis(gridId, day)}
        />
      </div>

      {/* Secondary Detailed Deep Dive Charts */}
      {explanationData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* Feature Importance SHAP Chart */}
          <div className="scientific-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Normalized Feature Contributions
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Relative contribution of each atmospheric parameter to the model bust prediction
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {explanationData.contributing_variables.map((v) => (
                <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '100px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {v.name}
                  </span>
                  <div style={{ flex: 1, height: '10px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${v.percentage}%`,
                      height: '100%',
                      backgroundColor: v.name === 'Temperature' ? '#EF4444' : (v.name === 'Wind' ? '#06B6D4' : (v.name === 'Pressure' ? '#F59E0B' : '#3B82F6'))
                    }} />
                  </div>
                  <span style={{ width: '40px', fontSize: '0.8125rem', fontWeight: 800, textAlign: 'right' }}>
                    {v.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Pipeline Trace Summary */}
          <div className="scientific-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              NWP Verification & Residuals
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Observed ground truth reference values vs model forecast for Day {selectedDay}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Temperature Residual:</span>
                <strong>{explanationData.pipeline_trace.forecast_data.temperature_c}°C vs {explanationData.pipeline_trace.reference_data.temperature_c}°C ({explanationData.pipeline_trace.forecast_error.temp_error_c}°C)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Precipitation Residual:</span>
                <strong>{explanationData.pipeline_trace.forecast_data.rainfall_mm} mm vs {explanationData.pipeline_trace.reference_data.rainfall_mm} mm (±{explanationData.pipeline_trace.forecast_error.rainfall_error_mm} mm)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wind Speed Residual:</span>
                <strong>{explanationData.pipeline_trace.forecast_data.wind_speed_ms} m/s vs {explanationData.pipeline_trace.reference_data.wind_speed_ms} m/s (±{explanationData.pipeline_trace.forecast_error.wind_error_ms} m/s)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Surface Pressure Residual:</span>
                <strong>{explanationData.pipeline_trace.forecast_data.pressure_hpa} hPa vs {explanationData.pipeline_trace.reference_data.pressure_hpa} hPa (±{explanationData.pipeline_trace.forecast_error.pressure_error_hpa} hPa)</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Explainability;
