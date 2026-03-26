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

// --- Constituents (Combos) ---

export const fetchConstituents = async (parentId) => {
  const { data } = await apiClient.get(`/menu/${parentId}/constituents`);
  return data;
};

export const addConstituent = async (parentId, childId, quantity) => {
  const { data } = await apiClient.post(`/menu/${parentId}/constituents`, {
    child_item_id: childId,
    quantity: quantity
  });
  return data;
};

export const removeConstituent = async (parentId, childId) => {
  const { data } = await apiClient.delete(`/menu/${parentId}/constituents/${childId}`);
  return data;
};
