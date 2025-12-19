// src/types/usuario.ts

// Enum para mapear os perfis do back-end (usuario.schema.ts)
export enum PerfisEnum {
    ADM_GERAL = 'ADM_GERAL',
    GERENTE = 'GERENTE',
    CORRETOR = 'CORRETOR',
    SUPORTE = 'SUPORTE',
}

export interface EmpresaVinculada {
    _id: string;
    nome: string;
}

// Interface de dados que vem do backend (Mongoose Document)
export interface Usuario {
    id: string;
    email: string;
    nome: string;
    perfil: PerfisEnum;
    ativo: boolean;
    // ADICIONE ESTA LINHA:
    empresa?: EmpresaVinculada | string;
    createdAt: string;
    updatedAt: string;
}

export interface UsuarioLogado extends Usuario {
    token: string;
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
