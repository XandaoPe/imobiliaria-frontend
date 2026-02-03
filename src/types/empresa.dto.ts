// src/types/empresa.dto.ts (NOVO)
export type TipoChavePixEmpresa = 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA';

export interface ChavePixEmpresaDto {
    tipo?: TipoChavePixEmpresa;
    chave: string;
    preferencial?: boolean;
}

// Interface para chave PIX da empresa (para exibição)
export interface ChavePixEmpresaFrontend {
    tipo: TipoChavePixEmpresa;
    chave: string;
    preferencial: boolean;
    dataCadastro: string;
}