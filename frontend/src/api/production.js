import apiClient from './client';

export const fetchProductionSummary = async (params = {}) => {
  const { data } = await apiClient.get('/production/summary', { params });
  return data;
};
