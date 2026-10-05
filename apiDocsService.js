/**
 * MausamDrishti Interactive API Explorer Service
 * Exposes live prototype API execution and specifications for external systems
 */
import { forecastService } from './forecastService';
import { confidenceService } from './confidenceService';
import { bustService } from './bustService';
import { explanationService } from './explanationService';
import { historicalService } from './historicalService';

export const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/forecast',
    summary: 'Retrieve fine-grained NWP forecast grid cells with base meteorology',
    params: [
      { name: 'day', type: 'integer', default: 5, description: 'Forecast lead day (1 to 10)' },
      { name: 'variable', type: 'string', default: 'rainfall', description: 'Target weather variable (rainfall, temperature, wind_speed)' }
    ],
    execute: async (params) => {
      const res = await forecastService.getGridData(parseInt(params.day || 5), params.variable || 'rainfall');
      return res;
    }
  },
  {
    method: 'GET',
    path: '/api/confidence',
    summary: 'Retrieve domain-wide and grid-level forecast confidence metrics',
    params: [
      { name: 'day', type: 'integer', default: 5, description: 'Forecast lead day (1 to 10)' }
    ],
    execute: async (params) => {
      const metrics = await confidenceService.getDomainMetrics(parseInt(params.day || 5));
      return {
        status: 'success',
        forecast_day: parseInt(params.day || 5),
        metrics
      };
    }
  },
  {
    method: 'GET',
    path: '/api/bust-probability',
    summary: 'Retrieve bust probabilities for all evaluated NWP grid cells',
    params: [
      { name: 'day', type: 'integer', default: 5, description: 'Forecast lead day (1 to 10)' }
    ],
    execute: async (params) => {
      const allRanked = await bustService.getAllRankedRegions(parseInt(params.day || 5));
      return {
        status: 'success',
        forecast_day: parseInt(params.day || 5),
        total_cells_evaluated: allRanked.length,
        grid_bust_probabilities: allRanked.map(c => ({
          location_id: c.id,
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          forecast_day: c.forecast_day,
          bust_probability: c.bust_probability,
          expected_error: c.expected_error,
          risk_level: c.risk_level
        }))
      };
    }
  },
  {
    method: 'GET',
    path: '/api/high-risk-regions',
    summary: 'Filter and rank error-prone geographic grid locations exceeding bust risk threshold',
    params: [
      { name: 'day', type: 'integer', default: 5, description: 'Forecast lead day (1 to 10)' },
      { name: 'threshold', type: 'float', default: 0.50, description: 'Minimum bust probability cutoff (0.0 to 1.0)' }
    ],
    execute: async (params) => {
      const highRisk = await bustService.getHighRiskRegions(parseInt(params.day || 5), parseFloat(params.threshold || 0.50));
      return {
        status: 'success',
        forecast_day: parseInt(params.day || 5),
        threshold_applied: parseFloat(params.threshold || 0.50),
        count: highRisk.length,
        regions: highRisk
      };
    }
  },
  {
    method: 'GET',
    path: '/api/explanation',
    summary: 'Retrieve XAI meteorological drivers and SHAP feature importance for specific grid',
    params: [
      { name: 'location_id', type: 'string', default: 'grid_4821', description: 'Grid cell identifier (e.g. grid_4821, grid_3912)' },
      { name: 'day', type: 'integer', default: 5, description: 'Forecast lead day (1 to 10)' }
    ],
    execute: async (params) => {
      const res = await explanationService.getExplanation(params.location_id || 'grid_4821', parseInt(params.day || 5));
      return res;
    }
  },
  {
    method: 'GET',
    path: '/api/historical-errors',
    summary: 'Retrieve historical forecast verification errors, bust frequencies, and synoptic analogues',
    params: [
      { name: 'event_id', type: 'string', default: 'hist_monsoon_dep_2021', description: 'Historical event archive key' }
    ],
    execute: async (params) => {
      const res = await historicalService.getEventById(params.event_id || 'hist_monsoon_dep_2021');
      return {
        status: 'success',
        archive_data: res
      };
    }
  }
];
