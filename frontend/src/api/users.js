import client from './client';

export const fetchAllUsers = async () => {
    const response = await client.get('/users');
    return response.data;
};

export const createUser = async (userData) => {
    const response = await client.post('/users', userData);
    return response.data;
};

export const updateUser = async (userId, userData) => {
    const response = await client.put(`/users/${userId}`, userData);
    return response.data;
};

export const resetUserPassword = async (userId, password) => {
    const response = await client.post(`/users/${userId}/reset-password`, { password });
    return response.data;
};

export const forceLogoutUser = async (userId) => {
    const response = await client.post(`/users/${userId}/force-logout`);
    return response.data;
};
