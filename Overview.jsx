import React, { useState, useEffect } from 'react';
import { DashboardMapCard } from '../components/dashboard/DashboardMapCard';
import { AttentionTable } from '../components/map/AttentionTable';
import { MetricCard } from '../components/common/MetricCard';
import { forecastService } from '../services/forecastService';
import { confidenceService } from '../services/confidenceService';
import { bustService } from '../services/bustService';
import { LAYER_MODES } from '../types';

export function Overview({ onNavigateToExplainability, onNavigateToMapAnalysis }) {
  const [currentDay, setCurrentDay] = useState(5);
  const [currentLayer, setCurrentLayer] = useState(LAYER_MODES.CONFIDENCE);
  const [gridCells, setGridCells] = useState([]);
  const [domainMetrics, setDomainMetrics] = useState({
    confidence_pct: 68,
    bust_probability_pct: 32,
    high_risk_count: 5,
    total_cells: 12
  });
  const [highRiskCells, setHighRiskCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data on day change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const [gridRes, metricsRes, highRiskRes] = await Promise.all([
        forecastService.getGridData(currentDay),
        confidenceService.getDomainMetrics(currentDay),
        bustService.getHighRiskRegions(currentDay, 0.50)
      ]);

      if (isMounted) {
        setGridCells(gridRes.grid_cells);
        setDomainMetrics(metricsRes);
        setHighRiskCells(highRiskRes);

        // Keep current selected cell updated with new day metrics
        if (selectedCell) {
          const updated = gridRes.grid_cells.find(c => c.id === selectedCell.id);
          if (updated) setSelectedCell(updated);
        }
        setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [currentDay]);

  const handleSelectLocation = (cell) => {
    setSelectedCell(cell);
  };

  return (
    <div className="page-wrapper">
      {/* Page Header per Section 14 */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Forecast Intelligence Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Medium-range forecast reliability assessment across India
        </p>
      </div>

      {/* Clean & Informative Compact Dashboard Map Card */}
      <div style={{ marginBottom: '24px' }}>
        <DashboardMapCard
          gridCells={gridCells}
          currentDay={currentDay}
          currentLayer={currentLayer}
          onOpenMapAnalysis={onNavigateToMapAnalysis}
        />
      </div>

      {/* Exactly THREE Major Summary Metrics per Section 14 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          label="Forecast Confidence"
          value={domainMetrics.confidence_pct}
          unit="%"
          subtext={`Domain-averaged reliability for Day ${currentDay} (+${currentDay * 24}h)`}
          accentColor={domainMetrics.confidence_pct < 50 ? 'var(--highlight)' : 'var(--primary-accent)'}
        />

        <MetricCard
          label="Bust Probability"
          value={domainMetrics.bust_probability_pct}
          unit="%"
          subtext={`Mean likelihood of forecast absolute error exceeding climatological threshold`}
          accentColor={domainMetrics.bust_probability_pct >= 50 ? 'var(--high-risk)' : 'var(--low-risk)'}
        />

        <MetricCard
          label="High-Risk Areas"
          value={domainMetrics.high_risk_count}
          unit={`/ ${domainMetrics.total_cells}`}
          subtext="Dynamically detected NWP grid cells where error probability exceeds 50%"
          accentColor="var(--high-risk)"
        />
      </div>

      {/* Areas Requiring Attention Dynamic Table per Section 19 */}
      <AttentionTable
        highRiskCells={highRiskCells}
        onSelectLocation={handleSelectLocation}
        selectedCellId={selectedCell ? selectedCell.id : null}
        onOpenMapAnalysis={(gridId, day) => onNavigateToMapAnalysis && onNavigateToMapAnalysis(gridId, day || currentDay)}
        onInspectExplainability={onNavigateToExplainability}
      />
    </div>
  );
}
