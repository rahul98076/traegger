import apiClient from "./client";

export const fetchMenu = async (params = {}) => {
  const { data } = await apiClient.get('/menu', { params });
  return data;
};

export const createMenuItem = async (menuData) => {
  const { data } = await apiClient.post('/menu', menuData);
  return data;
};

export const updateMenuItem = async (id, menuData) => {
  const { data } = await apiClient.put(`/menu/${id}`, menuData);
  return data;
};

export const toggleItemAvailability = async (id, isAvailable) => {
  const { data } = await apiClient.patch(`/menu/${id}/availability`, {
    is_available: isAvailable
  });
  return data;
};
