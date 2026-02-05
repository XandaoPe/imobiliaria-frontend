// src/services/pixService.ts
import api from './api';

export const pixService = {
    // Gerar QR Code PIX
    async gerarQRCode(dados: {
        lancamentoId: string;
        descricaoPersonalizada?: string;
        valorPersonalizado?: number;
    }) {
        const response = await api.post('/pix/gerar-qrcode', dados);
        return response.data;
    },

    // Buscar transação PIX
    async buscarTransacao(transacaoId: string) {
        const response = await api.get(`/pix/transacoes/${transacaoId}`);
        return response.data;
    },

    // Listar transações PIX
    async listarTransacoes(filtros?: {
        status?: string;
        dataInicio?: string;
        dataFim?: string;
        limit?: number;
    }) {
        const params = new URLSearchParams();
        if (filtros?.status) params.append('status', filtros.status);
        if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
        if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
        if (filtros?.limit) params.append('limit', filtros.limit.toString());

        const response = await api.get(`/pix/transacoes?${params.toString()}`);
        return response.data;
    },

    // Cancelar transação PIX
    async cancelarTransacao(transacaoId: string, motivo?: string) {
        const response = await api.delete(`/pix/transacoes/${transacaoId}/cancelar`, {
            data: { motivo }
        });
        return response.data;
    },

    // Reenviar QR Code
    async reenviarQRCode(transacaoId: string) {
        const response = await api.post(`/pix/transacoes/${transacaoId}/reenviar`);
        return response.data;
    },

    // Obter estatísticas
    async obterEstatisticas() {
        const response = await api.get('/pix/estatisticas');
        return response.data;
    }
};