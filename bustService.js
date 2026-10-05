/**
 * MausamDrishti Service: Forecast Bust Probability & Risk Evaluation
 */
import { getGridCellsForDay } from '../data/mock/forecastGridData';

export const bustService = {
  getHighRiskRegions: async (day = 5, minProbability = 0.50) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cells = getGridCellsForDay(day);
        const highRisk = cells
          .filter(c => c.bust_probability >= minProbability)
          .sort((a, b) => b.bust_probability - a.bust_probability);
        resolve(highRisk);
      }, 40);
    });
  },

  getAllRankedRegions: async (day = 5) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cells = getGridCellsForDay(day);
        const ranked = [...cells].sort((a, b) => b.bust_probability - a.bust_probability);
        resolve(ranked);
      }, 35);
    });
  },

  /**
   * Configurable Bust Threshold Definitions
   * Demonstrates that thresholds adapt to variable, lead time, and climatology.
   */
  getThresholdSettings: () => {
    return {
      definition: "An operational forecast bust is detected when actual forecast absolute error |F - O| exceeds the lead-time adjusted 90th climatological percentile [P90(Error | Day)]",
      variables: [
        {
          id: "rainfall",
          name: "Precipitation (24h Accumulated)",
          base_operational_threshold: "35 mm to 70 mm (Dynamic orographic scale)",
          percentile_rule: "90th percentile of historical verification distribution",
          lead_time_decay_factor: "+4.5 mm per forecast day",
          regional_adjustment: "Scaled by terrain roughness and local wet-season variance"
        },
        {
          id: "temperature",
          name: "2m Surface Maximum Temperature",
          base_operational_threshold: "±3.5 °C (Day 1-3) to ±5.5 °C (Day 7-10)",
          percentile_rule: "2.5 standard deviations from local climatological mean",
          lead_time_decay_factor: "+0.3 °C per forecast day",
          regional_adjustment: "Higher tolerance in arid Thar desert vs coastal plains"
        },
        {
          id: "wind_speed",
          name: "10m Sustained Wind Speed",
          base_operational_threshold: "20 km/h (Gale threshold)",
          percentile_rule: "Absolute error > 25 knots in cyclonic/monsoon inflow zones",
          lead_time_decay_factor: "+2.0 km/h per forecast day",
          regional_adjustment: "Maritime boundary layer enhancement"
        }
      ]
    };
  }
};
