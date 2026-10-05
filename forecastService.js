/**
 * MausamDrishti Service: NWP Forecast & Grid Access
 */
import { getGridCellsForDay, RAW_GRID_CELLS, FORECAST_METADATA } from '../data/mock/forecastGridData';

export const forecastService = {
  getMetadata: () => FORECAST_METADATA,

  getGridData: async (day = 5, variable = 'Rainfall') => {
    // Simulated async network delay for prototype API readiness
    return new Promise((resolve) => {
      setTimeout(() => {
        const cells = getGridCellsForDay(day);
        resolve({
          status: 'success',
          metadata: FORECAST_METADATA,
          forecast_day: day,
          variable,
          grid_cells: cells
        });
      }, 40);
    });
  },

  getCellById: async (cellId, day = 5) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cell = RAW_GRID_CELLS.find(c => c.id === cellId) || RAW_GRID_CELLS[0];
        const dayData = cell.days[day] || cell.days[5];
        resolve({
          status: 'success',
          cell: {
            ...cell,
            forecast_day: day,
            confidence: dayData.confidence,
            bust_probability: dayData.bust_probability,
            expected_error: dayData.expected_error,
            nwp_rainfall: dayData.nwp_rainfall,
            risk_level: dayData.risk_level
          }
        });
      }, 30);
    });
  }
};
