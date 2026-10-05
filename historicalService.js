/**
 * MausamDrishti Service: Historical Forecast-Error Archives & Verification
 */
import { HISTORICAL_ARCHIVES } from '../data/mock/historicalEventsData';

export const historicalService = {
  getAllEvents: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HISTORICAL_ARCHIVES);
      }, 30);
    });
  },

  getEventById: async (eventId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const event = HISTORICAL_ARCHIVES.find(e => e.event_id === eventId) || HISTORICAL_ARCHIVES[0];
        resolve(event);
      }, 35);
    });
  },

  getAnalogueMatchSummary: async (cellId = 'grid_4821', day = 5) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const event = HISTORICAL_ARCHIVES[0];
        const dayStat = event.error_distribution_by_lead_time.find(d => d.day === day) || event.error_distribution_by_lead_time[4];
        resolve({
          matched_event_name: event.event_name,
          analogues_found: event.total_analogues_found,
          average_forecast_error_mm: dayStat.mean_abs_error_mm,
          historical_bust_frequency_pct: dayStat.bust_rate_pct,
          p90_error_threshold_mm: dayStat.p90_error_mm,
          model_tendency: event.nwp_model_tendency
        });
      }, 30);
    });
  }
};
