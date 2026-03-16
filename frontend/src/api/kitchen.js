import apiClient from './client';

export const fetchBatches = async (params = {}) => {
  const { data } = await apiClient.get('/kitchen/batches', { params });
  return data;
};

export const createBatch = async (batchData) => {
  const { data } = await apiClient.post('/kitchen/batches', batchData);
  return data;
};

export const updateBatchStage = async (id, stageData) => {
  const { data } = await apiClient.patch(`/kitchen/batches/${id}/stage`, stageData);
  return data;
};

export const assignBatch = async (id, assignData) => {
  const { data } = await apiClient.post(`/kitchen/batches/${id}/assign`, assignData);
  return data;
};

export const getBatchLog = async (id) => {
  const { data } = await apiClient.get(`/kitchen/batches/${id}/log`);
  return data;
};
