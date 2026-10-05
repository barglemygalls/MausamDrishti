/**
 * MausamDrishti Service: Confidence & Reliability Evaluation
 */
import { getDomainMetrics, getLeadTimeProfile } from '../data/mock/forecastGridData';

export const confidenceService = {
  getDomainMetrics: async (day = 5) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getDomainMetrics(day));
      }, 30);
    });
  },

  getLeadTimeProfile: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getLeadTimeProfile());
      }, 40);
    });
  }
};
