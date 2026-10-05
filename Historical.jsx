import React, { useState, useEffect } from 'react';
import { Archive, Filter, History, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';
import { historicalService } from '../services/historicalService';
import { HistoricalErrorChart } from '../components/historical/HistoricalErrorChart';
import { SimilarSituationsTable } from '../components/historical/SimilarSituationsTable';
import { MetricCard } from '../components/common/MetricCard';

export function Historical() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('hist_monsoon_dep_2021');
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedLeadDay, setSelectedLeadDay] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const allEvents = await historicalService.getAllEvents();
      setEvents(allEvents);
      const active = allEvents.find(e => e.event_id === selectedEventId) || allEvents[0];
      setCurrentEvent(active);
      setLoading(false);
    }
    loadEvents();
  }, [selectedEventId]);

  if (loading || !currentEvent) {
    return <div className="page-wrapper">Loading historical verification archives...</div>;
  }

  const activeDayStats = currentEvent.error_distribution_by_lead_time.find(d => d.day === selectedLeadDay) || currentEvent.error_distribution_by_lead_time[4];

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Historical Forecast-Error Archives & Verification
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Compare current atmospheric synoptic patterns against verified historical forecast error archives and bust frequencies
        </p>
      </div>

      {/* Historical Data Disclaimer Notice */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#FAF9F6',
        border: '1px solid var(--border-neutral)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)'
      }}>
        <ShieldAlert size={15} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span>
          <strong>DEMONSTRATION ARCHIVE:</strong> The historical verification cases presented here are calibrated research analogues based on published NCMRWF/IMD medium-range verification metrics. They illustrate the statistical machine-learning input pipeline.
        </span>
      </div>

      {/* Filter / Event Selector Bar per Section 24 */}
      <div className="scientific-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Synoptic Weather Event Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Archive size={18} style={{ color: 'var(--primary-accent)' }} />
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Select Synoptic Weather Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
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
                {events.map((e) => (
                  <option key={e.event_id} value={e.event_id}>
                    {e.event_name} [{e.category}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lead Day Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} style={{ color: 'var(--secondary-accent)' }} />
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Verification Lead Day
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedLeadDay(day)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: selectedLeadDay === day ? 'var(--primary-accent)' : 'var(--border-neutral)',
                      backgroundColor: selectedLeadDay === day ? 'var(--primary-accent)' : '#FFFFFF',
                      color: selectedLeadDay === day ? '#FFFFFF' : 'var(--text-primary)',
                      fontWeight: selectedLeadDay === day ? 700 : 500,
                      fontSize: '0.75rem',
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

      {/* 3 Core Historical Metrics per Section 24 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          label="Similar Situations Found"
          value={currentEvent.total_analogues_found}
          unit="Cases"
          subtext="Verified atmospheric analogues matching current synoptic features"
          accentColor="var(--primary-accent)"
        />

        <MetricCard
          label={`Day ${selectedLeadDay} Mean Error`}
          value={activeDayStats.mean_abs_error_mm}
          unit="mm"
          subtext={`Mean absolute forecast error recorded across historical analogues at Day ${selectedLeadDay}`}
          accentColor="var(--highlight)"
        />

        <MetricCard
          label={`Historical Bust Frequency`}
          value={activeDayStats.bust_rate_pct}
          unit="%"
          subtext="Percentage of analogue forecasts that exceeded the operational bust threshold"
          accentColor="var(--high-risk)"
        />
      </div>

      {/* Historical Forecast Error Curve */}
      <HistoricalErrorChart leadTimeDistribution={currentEvent.error_distribution_by_lead_time} />

      {/* Verified Historical Analogue Cases Table */}
      <SimilarSituationsTable eventData={currentEvent} />
    </div>
  );
}
