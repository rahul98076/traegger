import apiClient from './client';

export const fetchOrders = async (params = {}) => {
  const { data } = await apiClient.get('/orders', { params });
  return data;
};

export const createOrder = async (orderData) => {
  const { data } = await apiClient.post('/orders', orderData);
  return data;
};

export const getOrder = async (id) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data;
};

export const updateOrder = async (id, orderData) => {
  const { data } = await apiClient.put(`/orders/${id}`, orderData);
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
  return data;
};

export const updateOrderPayment = async (id, paymentData) => {
  const { data } = await apiClient.patch(`/orders/${id}/payment`, paymentData);
  return data;
};

export const deleteOrder = async (id) => {
  const { data } = await apiClient.delete(`/orders/${id}`);
  return data;
};

export const restoreOrder = async (id) => {
  const { data } = await apiClient.post(`/orders/${id}/restore`);
  return data;
};

export const duplicateOrder = async (id) => {
  const { data } = await apiClient.post(`/orders/${id}/duplicate`);
  return data;
};

export const fetchOrderAudit = async (id) => {
  const { data } = await apiClient.get(`/orders/${id}/audit`);
  return data;
};
