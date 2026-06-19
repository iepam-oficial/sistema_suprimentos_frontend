import { SupplyRequest } from '../types';
import { fetchRequests } from './requestUtils';

export const loadMyRequests = async (token: string): Promise<SupplyRequest[]> => {
    if (!token) {
        throw new Error('Token não encontrado');
    }
    return await fetchRequests(token);
}; 