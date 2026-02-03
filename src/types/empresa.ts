// src/types/empresa.ts

export type TipoChavePix = 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA';

export interface ChavePix {
    tipo: TipoChavePix;
    chave: string;
    preferencial: boolean;
    dataCadastro: string;
}
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
    logo?: string;
    assinatura_url?: string;
    createdAt: string;
    updatedAt: string;

    // 🔑 CAMPOS PIX ADICIONADOS
    chavePix?: ChavePix;
    chavesPixAlternativas?: string[];

    // 🔑 DADOS BANCÁRIOS ADICIONADOS
    banco?: string;
    agencia?: string;
    conta?: string;
    tipoConta?: string;
}

export type EmpresaFormInputs = CreateEmpresaFormData;

export type EmpresaStatusFilter = 'TODAS' | 'true' | 'false';
export type EmpresaAdmFilter = 'TODAS' | 'true' | 'false';