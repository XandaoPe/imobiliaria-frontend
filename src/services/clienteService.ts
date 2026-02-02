// src/services/clienteService.ts (NOVO)
import api from './api';
import { Cliente } from '../types/cliente';
import { ChavePixDto, ValidarChavePixDto } from '../types/pix.dto';

export const clienteService = {
    /**
     * Listar todos os clientes
     */
    listar: (params?: { search?: string; status?: string }) => {
        return api.get('/clientes', { params });
    },

    /**
     * Buscar cliente por ID
     */
    buscarPorId: (id: string) => {
        return api.get(`/clientes/${id}`);
    },

    /**
     * Criar novo cliente
     */
    criar: (dados: any) => {
        return api.post('/clientes', dados);
    },

    /**
     * Atualizar cliente
     */
    atualizar: (id: string, dados: any) => {
        return api.put(`/clientes/${id}`, dados);
    },

    /**
     * Remover cliente
     */
    remover: (id: string) => {
        return api.delete(`/clientes/${id}`);
    },

    // 🔑 MÉTODOS PIX PARA CLIENTE
    adicionarChavePix: (clienteId: string, chavePixDto: ChavePixDto) => {
        return api.post(`/clientes/${clienteId}/chave-pix`, chavePixDto);
    },

    removerChavePix: (clienteId: string) => {
        return api.delete(`/clientes/${clienteId}/chave-pix`);
    },

    validarChavePix: (clienteId: string, validarDto: ValidarChavePixDto) => {
        return api.post(`/clientes/${clienteId}/validar-chave-pix`, validarDto);
    },

    temChavePixValida: (clienteId: string) => {
        return api.get(`/clientes/${clienteId}/tem-chave-pix`);
    },

    listarComChavePixValida: () => {
        return api.get('/clientes/com-chave-pix/validada');
    },

    // Método auxiliar para verificar se cliente tem PIX configurado
    verificarPixConfigurado: (cliente: Cliente): boolean => {
        return !!(cliente.chavePix?.chave && cliente.chavePix.validado);
    }
};