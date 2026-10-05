import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Map,
  ArrowUpRight,
  HelpCircle,
  Thermometer,
  CloudRain,
  Wind,
  Gauge,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { LeadTimeChart } from '../components/forecast/LeadTimeChart';
import { forecastService } from '../services/forecastService';
import { confidenceService } from '../services/confidenceService';
import { RiskBadge } from '../components/common/Badge';

export function Forecast({ onNavigateToExplainability, onNavigateToMapAnalysis }) {
  const [currentDay, setCurrentDay] = useState(5);
  const [gridCells, setGridCells] = useState([]);
  const [leadTimeProfile, setLeadTimeProfile] = useState([]);
  const [domainMetrics, setDomainMetrics] = useState({
    confidence_pct: 68,
    bust_probability_pct: 32,
    high_risk_count: 5
  });

  useEffect(() => {
    async function loadData() {
      const [gridRes, metricsRes, profileRes] = await Promise.all([
        forecastService.getGridData(currentDay),
        confidenceService.getDomainMetrics(currentDay),
        confidenceService.getLeadTimeProfile()
      ]);
      setGridCells(gridRes.grid_cells);
      setDomainMetrics(metricsRes);
      setLeadTimeProfile(profileRes);
    }
    loadData();
  }, [currentDay]);

  return (
    <div className="page-wrapper">
      {/* Header with Title and Day Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Day 1–Day 10 Forecast Evolution & Verification
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Analyze lead-time predictability decay, multi-variable forecasts, and ground truth reference verification
          </p>
        </div>

        {/* Lead Day Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#FFFFFF',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-neutral)'
        }}>
          <Calendar size={15} style={{ color: 'var(--text-muted)', marginLeft: '6px' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>Lead:</span>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
            <button
              key={d}
              onClick={() => setCurrentDay(d)}
              style={{
                width: '30px',
                height: '28px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentDay === d ? 'var(--primary-accent)' : 'transparent',
                color: currentDay === d ? '#FFFFFF' : 'var(--text-primary)',
                fontWeight: currentDay === d ? 700 : 500,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              D{d}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Summary Metrics for Active Lead Day */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <MetricCard
          label={`Day ${currentDay} Mean Confidence`}
          value={domainMetrics.confidence_pct}
          unit="%"
          subtext={`Subcontinent domain mean for Day ${currentDay} (+${currentDay * 24}h)`}
          accentColor={domainMetrics.confidence_pct < 50 ? 'var(--highlight)' : 'var(--primary-accent)'}
        />
        <MetricCard
          label={`Day ${currentDay} Bust Probability`}
          value={domainMetrics.bust_probability_pct}
          unit="%"
          subtext="Risk of forecast error exceeding local 90th percentile"
          accentColor={domainMetrics.bust_probability_pct >= 50 ? 'var(--high-risk)' : 'var(--low-risk)'}
        />
        <MetricCard
          label="High-Risk Grid Count"
          value={domainMetrics.high_risk_count}
          unit={`/ ${gridCells.length || 24}`}
          subtext="Active grid cells flagged with critical error probability"
          accentColor="var(--high-risk)"
        />
      </div>

      {/* Map Analysis Integration Banner */}
      <div style={{
        padding: '14px 20px',
        backgroundColor: '#F0F9FF',
        border: '1px solid #BAE6FD',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Map size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0369A1', margin: 0 }}>
              Inspect Day {currentDay} On Central Map Analysis
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#0284C7', margin: '2px 0 0 0' }}>
              Explore continuous temperature isotherms, rainfall plumes, and 21-member EPSgrams on OpenStreetMap
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToMapAnalysis && onNavigateToMapAnalysis(null, currentDay, 'temperature')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--primary-accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span>Open Day {currentDay} Map</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Lead Time Decay Curve Visualization */}
      <div style={{ marginBottom: '24px' }}>
        <LeadTimeChart
          profileData={leadTimeProfile}
          currentDay={currentDay}
          onSelectDay={setCurrentDay}
        />
      </div>

      {/* Forecast vs Reference Ground Truth Regional Comparison Table */}
      <div className="scientific-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-neutral)',
          backgroundColor: 'var(--surface-card-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              FORECAST VS REFERENCE VERIFICATION (DAY {currentDay})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Comparing NWP predicted variables against observational reference across representative sub-regions
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Grid sample across 0.25° NWP geometry
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#FAF9F7' }}>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>REGION / DISTRICT</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>TEMPERATURE (F vs O)</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>RAINFALL (F vs O)</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>WIND SPEED</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>PRESSURE</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>BUST PROB</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {gridCells.slice(0, 10).map((cell, idx) => {
                const tempFcst = cell.temperature_c ?? 27.0;
                const tempAct = cell.actual_temperature_c ?? 28.5;
                const tempDiff = Math.abs(tempFcst - tempAct).toFixed(1);

                const rainFcst = cell.nwp_rainfall ?? 30.0;
                const rainAct = cell.actual_rainfall ?? 18.0;
                const rainDiff = Math.abs(rainFcst - rainAct).toFixed(1);

                const probPct = Math.round(cell.bust_probability * 100);

                return (
                  <tr
                    key={cell.id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFCFB'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cell.district}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {cell.state} [{cell.lat}°N, {cell.lon}°E]
                      </div>
                    </td>

                    {/* Temperature comparison */}
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#DC2626' }}>{tempFcst}°C</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>vs</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>{tempAct}°C</span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                        Δ {tempDiff}°C
                      </span>
                    </td>

                    {/* Rainfall comparison */}
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#2563EB' }}>{rainFcst} mm</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>vs</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>{rainAct} mm</span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: rainDiff > 20 ? 'var(--high-risk)' : 'var(--text-secondary)', fontWeight: rainDiff > 20 ? 700 : 400 }}>
                        Δ ±{rainDiff} mm
                      </span>
                    </td>

                    {/* Wind speed */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      <strong>{cell.wind_speed_ms || 6.5} m/s</strong>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {cell.wind_direction_deg || 240}°
                      </div>
                    </td>

                    {/* Surface pressure */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {cell.surface_pressure_hpa || 1008.0} hPa
                    </td>

                    {/* Bust probability */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.9375rem',
                          color: probPct >= 70 ? 'var(--high-risk)' : (probPct >= 50 ? 'var(--highlight)' : 'var(--low-risk)')
                        }}>
                          {probPct}%
                        </span>
                        <RiskBadge probability={cell.bust_probability} />
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onNavigateToMapAnalysis && onNavigateToMapAnalysis(cell.id, currentDay, 'temperature')}
                          title="Inspect on Central Map"
                        >
                          <span>Map</span>
                          <ArrowUpRight size={13} />
                        </button>

                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--primary-accent)' }}
                          onClick={() => onNavigateToExplainability && onNavigateToExplainability(cell.id, currentDay)}
                          title="View explainability"
                        >
                          <span>Why?</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Forecast;
