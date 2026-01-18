// src/services/configuracaoService.ts
import api from './api';

export interface Configuracao {
    _id?: string;
    chave: string;
    valor: number;
    tipo: string;
    descricao?: string;
}

export const configuracaoService = {
    // Busca todas as configurações cadastradas para a empresa
    getConfigs: async (): Promise<Configuracao[]> => {
        const response = await api.get('/configuracoes');
        return response.data;
    },

    // Salva ou atualiza uma configuração (Upsert)
    upsertConfig: async (data: Configuracao): Promise<Configuracao> => {
        const response = await api.post('/configuracoes', data);
        return response.data;
    }
};