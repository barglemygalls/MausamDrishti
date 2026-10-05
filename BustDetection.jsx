import React, { useState, useEffect } from 'react';
import { Map, AlertTriangle, ArrowUpRight, HelpCircle, ShieldAlert, Sparkles, Calendar } from 'lucide-react';
import { BustRiskRanking } from '../components/bust/BustRiskRanking';
import { BustThresholdConfig } from '../components/bust/BustThresholdConfig';
import { MetricCard } from '../components/common/MetricCard';
import { WhyRiskyExplainabilitySection } from '../components/explainability/WhyRiskyExplainabilitySection';
import { forecastService } from '../services/forecastService';
import { bustService } from '../services/bustService';
import { explanationService } from '../services/explanationService';

export function BustDetection({ onNavigateToExplainability, onNavigateToMapAnalysis }) {
  const [currentDay, setCurrentDay] = useState(5);
  const [rankedCells, setRankedCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [explanationData, setExplanationData] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  // Load ranked risk regions for the active lead day
  useEffect(() => {
    async function loadData() {
      const rankedRes = await bustService.getAllRankedRegions(currentDay);
      setRankedCells(rankedRes);

      // Default selection to the #1 highest risk cell or keep current if valid
      if (rankedRes.length > 0) {
        const found = selectedCell ? rankedRes.find(c => c.id === selectedCell.id) : null;
        setSelectedCell(found || rankedRes[0]);
      }
    }
    loadData();
  }, [currentDay]);

  // Load meteorological explainability when selected cell or day changes
  useEffect(() => {
    let isMounted = true;
    async function loadExplanation() {
      if (!selectedCell) return;
      setExplanationLoading(true);
      const res = await explanationService.getExplanation(selectedCell.id, currentDay, selectedCell.variable || 'Rainfall');
      if (isMounted) {
        setExplanationData(res);
        setExplanationLoading(false);
      }
    }
    loadExplanation();
    return () => { isMounted = false; };
  }, [selectedCell, currentDay]);

  const highRiskCount = rankedCells.filter(c => c.bust_probability >= 0.50).length;
  const criticalCount = rankedCells.filter(c => c.bust_probability >= 0.70).length;

  return (
    <div className="page-wrapper">
      {/* Header and Day Switcher */}
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
            Forecast Bust Detection & Risk Ranking
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Identify where and when NWP model predictions are most likely to experience breakdown errors
          </p>
        </div>

        {/* Lead Day Pills */}
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

      {/* 3 Major Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <MetricCard
          label={`Day ${currentDay} Max Bust Probability`}
          value={rankedCells[0] ? `${Math.round(rankedCells[0].bust_probability * 100)}` : '0'}
          unit="%"
          subtext={rankedCells[0] ? `Highest risk at ${rankedCells[0].code} (${rankedCells[0].district})` : 'Evaluating...'}
          accentColor="var(--high-risk)"
        />
        <MetricCard
          label="High-Risk Grid Count (≥50%)"
          value={highRiskCount}
          unit={`/ ${rankedCells.length}`}
          subtext="Cells where error likelihood exceeds standard operational threshold"
          accentColor="var(--highlight)"
        />
        <MetricCard
          label="Critical Bust Warnings (≥70%)"
          value={criticalCount}
          unit="Cells"
          subtext="Severe probability of forecast breakdown requiring manual forecaster review"
          accentColor="var(--high-risk)"
        />
      </div>

      {/* Central Map Action Callout Banner (Replaces redundant full map) */}
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
              Central Geographical Map Workspace
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#0284C7', margin: '2px 0 0 0' }}>
              Inspect subcontinent continuous bust risk contours, wind streamlines, and EPSgram plumes on OpenStreetMap
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToMapAnalysis && onNavigateToMapAnalysis(selectedCell?.id, currentDay, 'bust_risk')}
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
          <span>Open Day {currentDay} in Map Analysis</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Highest-Risk Locations Table */}
      <div style={{ marginBottom: '24px' }}>
        <BustRiskRanking
          rankedCells={rankedCells}
          selectedCellId={selectedCell ? selectedCell.id : null}
          onInspectCell={(cell) => setSelectedCell(cell)}
          onInspectExplainability={(cellId, day) => {
            const cell = rankedCells.find(c => c.id === cellId);
            if (cell) setSelectedCell(cell);
          }}
          onOpenMapAnalysis={(cellId, day) => {
            if (onNavigateToMapAnalysis) onNavigateToMapAnalysis(cellId, day || currentDay, 'bust_risk');
          }}
        />
      </div>

      {/* Dedicated Contextual Explainability Section ("Why is this forecast risky?") */}
      {selectedCell && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={18} style={{ color: 'var(--primary-accent)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Meteorological Explainability: Why is this forecast risky?
            </h2>
          </div>

          <WhyRiskyExplainabilitySection
            explanationData={explanationData}
            loading={explanationLoading}
            onOpenMapAnalysis={(gridId, day) => onNavigateToMapAnalysis && onNavigateToMapAnalysis(gridId, day, 'bust_risk')}
          />
        </div>
      )}

      {/* Dynamic Threshold Configuration */}
      <BustThresholdConfig />
    </div>
  );
}

export default BustDetection;
