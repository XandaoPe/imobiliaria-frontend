// src/types/empresa.ts

// Mapeia o DTO de Criação do Backend (CreateEmpresaDto)
export interface CreateEmpresaFormData {
    nome: string;
    cnpj: string;
    isAdmGeral?: boolean;
    ativa?: boolean;
}

// Mapeia o DTO de Atualização (UpdateEmpresaDto - PartialType de Create)
export interface UpdateEmpresaFormData extends Partial<CreateEmpresaFormData> { }

// Interface principal da Empresa (EmpresaSchema no backend)
export interface Empresa {
    _id: string; // Mongoose ID
    nome: string;
    cnpj: string;
    isAdmGeral: boolean; // Se é a empresa de administração geral do sistema
    ativa: boolean;
    createdAt: string;
    updatedAt: string;
}

// O tipo de input para o React Hook Form
export type EmpresaFormInputs = CreateEmpresaFormData;

// Tipos para os Filtros da Página
export type EmpresaStatusFilter = 'TODAS' | 'true' | 'false';
export type EmpresaAdmFilter = 'TODAS' | 'true' | 'false';