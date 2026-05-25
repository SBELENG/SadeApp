import api from './api';

export const gridService = {
  getGrid: async (year: number, month: number, serviceId: string) => {
    const response = await api.get(`/grid/${year}/${month}/${serviceId}`);
    return response.data;
  }
};
