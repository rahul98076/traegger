import apiClient from './client';

export const fetchCustomers = async (params = {}) => {
  const { data } = await apiClient.get('/customers', { params });
  return data;
};

export const createCustomer = async (customerData) => {
  const { data } = await apiClient.post('/customers', customerData);
  return data;
};

export const getCustomer = async (id) => {
  const { data } = await apiClient.get(`/customers/${id}`);
  return data;
};

export const updateCustomer = async (id, customerData) => {
  const { data } = await apiClient.put(`/customers/${id}`, customerData);
  return data;
};

export const deactivateCustomer = async (id) => {
  const { data } = await apiClient.patch(`/customers/${id}/deactivate`);
  return data;
};
