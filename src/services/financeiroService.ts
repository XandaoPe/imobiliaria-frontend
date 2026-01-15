import api from './api';

export const financeiroService = {
    /**
     * GET /financeiro
     * Lista os lançamentos usando os filtros (tipo, status, datas, negociacaoCodigo)
     */
    listar: (filtros: any) => {
        return api.get('/financeiro', { params: filtros });
    },

    /**
     * GET /financeiro/resumo
     * Pega os totais (Receitas, Despesas, Pendentes) filtrados por data
     */
    getResumo: (params?: { dataInicio?: string; dataFim?: string }) => {
        return api.get('/financeiro/resumo', { params });
    },

    /**
     * PATCH /financeiro/:id/pagar
     * Aciona a função registrarPagamento no Back-end
     */
    registrarPagamento: (id: string) => {
        return api.patch(`/financeiro/${id}/pagar`);
    },

    /**
     * GET /financeiro/:id/recibo
     * Baixa o PDF gerado pelo FinanceiroPdfService
     */
    baixarRecibo: async (id: string) => {
        try {
            const response = await api.get(`/financeiro/${id}/recibo`, {
                responseType: 'blob',
            });

            // Cria o link para download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Sugestão: Nome do arquivo mais amigável
            link.setAttribute('download', `recibo_${id.substring(0, 8)}.pdf`);

            document.body.appendChild(link);
            link.click();

            // Limpeza
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao baixar recibo:", error);
            alert("Não foi possível gerar o recibo agora.");
        }
    }
};