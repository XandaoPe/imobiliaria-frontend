// src/types/empresa.ts

export interface CreateEmpresaFormData {
    nome: string;
    cnpj: string;
    fone?: string;
    isAdmGeral?: boolean;
    ativa?: boolean;
}

export interface UpdateEmpresaFormData extends Partial<CreateEmpresaFormData> { }

export interface Empresa {
    _id: string;
    nome: string;
    cnpj: string;
    fone?: string;
    isAdmGeral: boolean;
    ativa: boolean;
    logo?: string;            // Adicionado: URL da imagem da logo
    assinatura_url?: string;  // Adicionado: URL da imagem da assinatura
    createdAt: string;
    updatedAt: string;
}

export type EmpresaFormInputs = CreateEmpresaFormData;

export type EmpresaStatusFilter = 'TODAS' | 'true' | 'false';
export type EmpresaAdmFilter = 'TODAS' | 'true' | 'false';