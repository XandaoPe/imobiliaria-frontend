import api from "./api";

// services/comissaoRegraService.ts
export const comissaoRegraService = {
    async listarRegras(empresaId: string) {
        const response = await api.get(`/comissao-regras?empresaId=${empresaId}`);
        return response.data;
    }
};
