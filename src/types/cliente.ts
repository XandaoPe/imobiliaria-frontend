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

// ⭐️ NOVA FUNÇÃO: Remove todos os caracteres não numéricos do telefone
export const normalizeTelefone = (telefone: string | null): string | null => {
    if (!telefone) return null;
    const cleaned = telefone.replace(/\D/g, '');
    return cleaned === '' ? null : cleaned;
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
        .transform((value) => normalizeTelefone(value)) // Normaliza aqui também para validar
        .test('is-valid-phone', 'Número de telefone inválido. Deve ter 10 ou 11 dígitos (com DDD).', (value) => {
            if (!value) return true; // Permite nulo/vazio
            return value.length === 10 || value.length === 11;
        })
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