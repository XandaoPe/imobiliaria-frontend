// src/services/empresaService.ts (NOVO)
import api from './api';
import { Empresa } from '../types/empresa';
import { ChavePixEmpresaDto } from '../types/empresa.dto';


export const empresaService = {
    /**
     * Listar todas as empresas
     */
    listar: (params?: { search?: string; ativa?: string; isAdmGeral?: string }) => {
        return api.get('/empresas', { params });
    },

    /**
     * Buscar empresa por ID
     */
    buscarPorId: (id: string) => {
        return api.get(`/empresas/${id}`);
    },

    /**
     * Criar nova empresa
     */
    criar: (dados: any) => {
        return api.post('/empresas', dados);
    },

    /**
     * Atualizar empresa
     */
    atualizar: (id: string, dados: any) => {
        return api.put(`/empresas/${id}`, dados);
    },

    /**
     * Remover empresa
     */
    remover: (id: string) => {
        return api.delete(`/empresas/${id}`);
    },

    /**
     * Upload de logo
     */
    uploadLogo: (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/empresas/${id}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Upload de assinatura
     */
    uploadAssinatura: (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/empresas/${id}/assinatura`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // 🔑 MÉTODOS PIX PARA EMPRESA
    atualizarChavePix: (empresaId: string, chavePixDto: ChavePixEmpresaDto) => {
        return api.patch(`/empresas/${empresaId}/chave-pix`, chavePixDto);
    },

    removerChavePix: (empresaId: string) => {
        return api.delete(`/empresas/${empresaId}/chave-pix`);
    },

    adicionarChaveAlternativa: (empresaId: string, chave: string) => {
        return api.post(`/empresas/${empresaId}/chaves-alternativas`, { chave });
    },

    obterChavePixPreferencial: (empresaId: string) => {
        return api.get(`/empresas/${empresaId}/chave-pix-preferencial`);
    },

    // Método auxiliar para verificar se empresa tem PIX configurado
    verificarPixConfigurado: (empresa: Empresa): boolean => {
        return !!(empresa.chavePix?.chave);
    }
};