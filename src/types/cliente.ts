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
    status: 'ATIVO' | 'INATIVO' | 'ativo' | 'inativo'; // Aceita maiúsculas e minúsculas
    perfil?: string;
}

// Interface para dados do formulário
export interface ClienteFormData {
    nome: string;
    cpf: string;
    telefone: string | null;
    email: string;
    observacoes: string | null;
    status: 'ATIVO' | 'INATIVO';
}

// Função para normalizar CPF (remove pontos e traço)
export const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
};

// Função para normalizar status (converte para maiúsculas)
export const normalizeStatus = (status: string): 'ATIVO' | 'INATIVO' => {
    const upperStatus = status.toUpperCase();
    return upperStatus === 'ATIVO' ? 'ATIVO' : 'INATIVO';
};

// ⭐️ Schema de Validação ATUALIZADO
export const clienteValidationSchema = yup.object().shape({
    nome: yup.string().required('O nome é obrigatório.'),

    cpf: yup
        .string()
        .required('O CPF é obrigatório.')
        .transform((value) => normalizeCPF(value)) // Remove formatação
        .matches(/^\d{11}$/, 'O CPF deve conter exatamente 11 dígitos numéricos.'),

    telefone: yup
        .string()
        .nullable()
        .transform((value) => value === '' ? null : value) // Converte string vazia para null
        .default(null),

    email: yup
        .string()
        .email('O email deve ser válido.')
        .required('O email é obrigatório.')
        .transform((value) => value.toLowerCase()), // Normaliza email

    observacoes: yup
        .string()
        .nullable()
        .transform((value) => value === '' ? null : value) // Converte string vazia para null
        .default(null),

    status: yup
        .mixed<'ATIVO' | 'INATIVO'>()
        .oneOf(['ATIVO', 'INATIVO'], 'Status inválido.')
        .required('O status é obrigatório.')
        .default('ATIVO'), // ⭐️ Valor padrão ATIVO
});