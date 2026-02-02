// src/types/pix.dto.ts (NOVO)
export enum TipoChavePix {
    CPF = 'CPF',
    CNPJ = 'CNPJ',
    EMAIL = 'EMAIL',
    TELEFONE = 'TELEFONE',
    CHAVE_ALEATORIA = 'CHAVE_ALEATORIA'
}

export interface ChavePixDto {
    tipo: TipoChavePix;
    validado?: boolean;
    chave: string;
    preferencial?: boolean;
}

export interface ValidarChavePixDto {
    codigoValidacao: string;
}