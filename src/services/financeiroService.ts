import api from './api';

export const financeiroService = {
    /**
     * GET /financeiro
     * Lista os lançamentos usando os filtros (tipo, status, datas, negociacaoCodigo)
     */
    listar: (filtros: any) => {
        // Converter arrays para strings separadas por vírgula
        const params = { ...filtros };

        if (Array.isArray(params.status)) {
            params.status = params.status.filter((s: any) => s !== 'TODOS').join(',');
            if (params.status === '') {
                delete params.status;
            }
        }

        if (Array.isArray(params.categoria)) {
            params.categoria = params.categoria.filter((c: any) => c !== 'TODOS').join(',');
            if (params.categoria === '') {
                delete params.categoria;
            }
        }

        return api.get('/financeiro', { params });
    },

    /**
     * GET /financeiro/resumo
     * Pega os totais (Receitas, Despesas, Pendentes) filtrados por data
     */
    getResumo: (params: any) => {
        // Mesma lógica para o resumo
        const processedParams = { ...params };

        if (Array.isArray(processedParams.status)) {
            processedParams.status = processedParams.status.filter((s: any) => s !== 'TODOS').join(',');
            if (processedParams.status === '') {
                delete processedParams.status;
            }
        }

        if (Array.isArray(processedParams.categoria)) {
            processedParams.categoria = processedParams.categoria.filter((c: any) => c !== 'TODOS').join(',');
            if (processedParams.categoria === '') {
                delete processedParams.categoria;
            }
        }

        return api.get('/financeiro/resumo', { params: processedParams });
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

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `recibo_${id.substring(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao baixar recibo:", error);
            alert("Não foi possível gerar o recibo agora.");
        }
    }
};