// src/types/usuario.ts

// Enum para mapear os perfis do back-end (usuario.schema.ts)
export enum PerfisEnum {
    ADM_GERAL = 'ADM_GERAL',
    GERENTE = 'GERENTE',
    CORRETOR = 'CORRETOR',
    SUPORTE = 'SUPORTE',
}

// Interface de dados que vem do backend (Mongoose Document)
export interface Usuario {
    _id: string;
    email: string;
    nome: string;
    perfil: PerfisEnum;
    ativo: boolean;
    // Note: A senha nunca deve vir na resposta GET/PUT
    createdAt: string;
    updatedAt: string;
}

// Interface para o formulário de CRIAÇÃO
export interface CreateUsuarioFormData {
    email: string;
    senha: string; // Obrigatória na criação
    nome: string;
    perfil: PerfisEnum;
    ativo: boolean;
    // Na criação via o Controller de Usuários, o empresaId é injetado, mas no DTO ele é exigido.
    // Para simplificar o front-end, vamos remover 'empresaId' daqui
}

// Interface para o formulário de ATUALIZAÇÃO
export interface UpdateUsuarioFormData {
    email: string;
    senha?: string; // Opcional na atualização
    nome: string;
    perfil: PerfisEnum;
    ativo: boolean;
}

export interface UsuarioLogado extends Usuario {
    token: string;
}