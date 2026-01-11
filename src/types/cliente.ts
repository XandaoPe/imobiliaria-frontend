// src/types/cliente.ts
import * as yup from 'yup';

// Interface principal do Cliente
export interface Cliente {
    _id: string;
    nome: string;
    cpf: string;
    telefone: string | null;
    email: string;
    observacoes: string | null;
    status: 'ATIVO' | 'INATIVO' | 'ativo' | 'inativo';
    perfil?: string;
    endereco?: string;
    cidade?: string;
}

// Interface para dados do formulário
export interface ClienteFormData {
    nome: string;
    cpf: string;
    telefone: string | null;
    email: string;
    observacoes: string | null;
    status: 'ATIVO' | 'INATIVO';
    endereco?: string;
    cidade?: string;
}

// Funções de Normalização
export const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
};

export const normalizeTelefone = (telefone: string | null): string | null => {
    if (!telefone) return null;
    const cleaned = telefone.replace(/\D/g, '');
    return cleaned === '' ? null : cleaned;
};

// ⭐️ ADICIONADO: Função que estava faltando
export const normalizeStatus = (status: string): 'ATIVO' | 'INATIVO' => {
    const upperStatus = status.toUpperCase();
    return upperStatus === 'INATIVO' ? 'INATIVO' : 'ATIVO';
};

// Schema de Validação Yup
export const clienteValidationSchema = yup.object().shape({
    nome: yup.string().required('O nome é obrigatório.'),

    cpf: yup
        .string()
        .required('O CPF é obrigatório.')
        .transform((value) => normalizeCPF(value))
        .matches(/^\d{11}$/, 'O CPF deve conter exatamente 11 dígitos numéricos.'),

    telefone: yup
        .string()
        .nullable()
        .transform((value) => normalizeTelefone(value))
        .test('is-valid-phone', 'Número de telefone inválido.', (value) => {
            if (!value) return true;
            return value.length === 10 || value.length === 11;
        })
        .default(null),

    email: yup
        .string()
        .email('O email deve ser válido.')
        .required('O email é obrigatório.')
        .transform((value) => value.toLowerCase()),

    observacoes: yup
        .string()
        .nullable()
        .transform((value) => value === '' ? null : value)
        .default(null),

    status: yup
        .mixed<'ATIVO' | 'INATIVO'>()
        .oneOf(['ATIVO', 'INATIVO'], 'Status inválido.')
        .required('O status é obrigatório.')
        .default('ATIVO'),

    // Campos de endereço adicionados para não serem filtrados pelo Yup
    endereco: yup.string().nullable().default(''),
    cidade: yup.string().nullable().default(''),
});