import api from './api';

export const staffService = {
  getAll: async () => {
    const response = await api.get('/staff');
    return response.data;
  }
};
