/**
 * MausamDrishti Data Type Definitions & Schemas
 * AI-Based Forecast Reliability Intelligence
 */

/**
 * @typedef {'low' | 'moderate' | 'high' | 'very-high'} RiskLevel
 * @typedef {'confidence' | 'bust-probability' | 'rainfall'} MapLayerMode
 * @typedef {1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} ForecastDay
 */

export const RISK_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very-high'
};

export const LAYER_MODES = {
  CONFIDENCE: 'confidence',
  BUST_PROBABILITY: 'bust-probability',
  RAINFALL: 'rainfall'
};

/**
 * Weather variable supported for bust evaluation
 */
export const WEATHER_VARIABLES = [
  { id: 'rainfall', label: 'Precipitation / Rainfall', unit: 'mm' },
  { id: 'temperature', label: '2m Surface Temperature', unit: '°C' },
  { id: 'wind_speed', label: '10m Wind Speed', unit: 'km/h' }
];
