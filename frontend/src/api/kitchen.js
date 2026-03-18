import apiClient from './client';

export const fetchActiveOrders = async () => {
  const { data } = await apiClient.get('/kitchen/active-orders');
  return data;
};

export const updateItemStatus = async (itemId, status) => {
  const { data } = await apiClient.patch(`/kitchen/items/${itemId}/status`, null, { params: { status } });
  return data;
};

// Legacy batch endpoints (keeping for compatibility during transition if needed)
export const fetchBatches = async (params = {}) => {
  const { data } = await apiClient.get('/kitchen/batches', { params });
  return data;
};

