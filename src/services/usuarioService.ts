import { ChavePixDto, ValidarChavePixDto } from "../types/pix.dto";
import { Usuario } from "../types/usuario";
import api from "./api";

export const usuarioService = {
    async buscarUsuariosAtivos(empresaId: string) {
        const response = await api.get(`/usuarios?empresaId=${empresaId}&ativo=true`);
        return response.data;
    },

        listar: (params?: { search?: string; perfil?: string; ativo?: string }) => {
        return api.get('/usuarios', { params });
    },

    /**
     * Buscar usuário por ID
     */
    buscarPorId: (id: string) => {
        return api.get(`/usuarios/${id}`);
    },

    /**
     * Criar novo usuário
     */
    criar: (dados: any) => {
        return api.post('/usuarios', dados);
    },

    /**
     * Atualizar usuário
     */
    atualizar: (id: string, dados: any) => {
        return api.put(`/usuarios/${id}`, dados);
    },

    /**
     * Remover usuário
     */
    remover: (id: string) => {
        return api.delete(`/usuarios/${id}`);
    },

    // 🔑 MÉTODOS PIX PARA USUÁRIO (IGUAL AO CLIENTE)
    adicionarChavePix: (usuarioId: string, chavePixDto: ChavePixDto) => {
        return api.post(`/usuarios/${usuarioId}/chave-pix`, chavePixDto);
    },

    removerChavePix: (usuarioId: string) => {
        return api.delete(`/usuarios/${usuarioId}/chave-pix`);
    },

    validarChavePix: (usuarioId: string, validarDto: ValidarChavePixDto) => {
        return api.post(`/usuarios/${usuarioId}/validar-chave-pix`, validarDto);
    },

    temChavePixValida: (usuarioId: string) => {
        return api.get(`/usuarios/${usuarioId}/tem-chave-pix`);
    },

    listarComChavePixValida: () => {
        return api.get('/usuarios/com-chave-pix/validada');
    },

    // Método auxiliar para verificar se usuário tem PIX configurado
    verificarPixConfigurado: (usuario: Usuario): boolean => {
        return !!(usuario.chavePix?.chave && usuario.chavePix.validado);
    }
};