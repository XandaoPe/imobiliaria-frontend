import api from "./api";

export const usuarioService = {
    async buscarUsuariosAtivos(empresaId: string) {
        const response = await api.get(`/usuarios?empresaId=${empresaId}&ativo=true`);
        return response.data;
    }
};