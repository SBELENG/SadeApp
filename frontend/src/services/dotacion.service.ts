import api from './api';

export const dotacionService = {
  calculate: async (data: any) => {
    const response = await api.post('/dotacion/calculate', data);
    return response.data;
  }
};
