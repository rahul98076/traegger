import client from './client';

export const fetchAuditLogs = async (limit = 100, offset = 0) => {
    const response = await client.get(`/admin/audit?limit=${limit}&offset=${offset}`);
    return response.data;
};

export const forceFirebaseSync = async () => {
    const response = await client.post('/admin/backup/firebase-sync');
    return response.data;
};

export const exportDatabase = async () => {
    const response = await client.get('/admin/backup/export', { responseType: 'blob' });
    return response.data;
};

export const importDatabase = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/admin/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
