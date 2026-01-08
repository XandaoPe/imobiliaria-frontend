import api from './api'; // Sua instância do Axios configurada

export const financeiroService = {
    /**
     * GET /financeiro
     * Lista os lançamentos usando os filtros do seu DTO (tipo, status, datas)
     */
    listar: (filtros: any) => {
        return api.get('/financeiro', { params: filtros });
    },

    /**
     * GET /financeiro/resumo
     * Pega os totais (Receitas, Despesas, Pendentes) que seu NestJS calcula
     */
    getResumo: () => {
        return api.get('/financeiro/resumo');
    },

    /**
     * PATCH /financeiro/:id/pagar
     * Aciona a função registrarPagamento que você criou no Back-end
     */
    registrarPagamento: (id: string) => {
        return api.patch(`/financeiro/${id}/pagar`);
    },

    /**
     * GET /financeiro/:id/recibo
     * Baixa o PDF gerado pelo seu FinanceiroPdfService
     */
    baixarRecibo: async (id: string) => {
        try {
            const response = await api.get(`/financeiro/${id}/recibo`, {
                responseType: 'blob', // Obrigatório para arquivos
            });

            // Cria o link para download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `recibo-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erro ao baixar recibo:", error);
            alert("Não foi possível gerar o recibo agora.");
        }
    }
};