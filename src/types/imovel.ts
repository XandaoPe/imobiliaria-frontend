// src/types/imovel.ts
import * as yup from 'yup';

// Tipos baseados no backend
export type ImovelTipo = 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'COMERCIAL';

// Interface para dados do formulário (todos os campos obrigatórios do backend + opcionais)
export interface ImovelFormData {
    titulo: string;
    tipo: ImovelTipo;
    endereco: string;
    valor: number;
    disponivel: boolean;
    // Campos opcionais com valores padrão
    cidade: string;
    descricao: string | null;
    detalhes: string | null;
    quartos: number | null;
    banheiros: number | null;
    garagem: boolean;
}

// Interface principal do Imóvel (compatível com backend)
export interface Imovel extends ImovelFormData {
    _id: string;
    fotos: string[];
    empresa: string;
    createdAt?: string;
    updatedAt?: string;
}

// Função para normalizar tipo (converte para UPPERCASE)
export const normalizeTipoImovel = (tipo: string): ImovelTipo => {
    const upperTipo = tipo.toUpperCase() as ImovelTipo;
    if (['CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL'].includes(upperTipo)) {
        return upperTipo;
    }
    return 'CASA'; // Valor padrão
};

// Schema de Validação (compatível com backend)
export const imovelValidationSchema = yup.object().shape({
    // Campos obrigatórios do backend
    titulo: yup
        .string()
        .required('O título do imóvel é obrigatório.')
        .min(3, 'O título deve ter pelo menos 3 caracteres.')
        .max(100, 'O título não pode exceder 100 caracteres.'),

    tipo: yup
        .mixed<ImovelTipo>()
        .oneOf(['CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL'], 'Tipo de imóvel inválido.')
        .required('O tipo é obrigatório.')
        .transform((value) => normalizeTipoImovel(value)),

    endereco: yup
        .string()
        .required('O endereço é obrigatório.')
        .min(10, 'O endereço deve ter pelo menos 10 caracteres.'),

    valor: yup
        .number()
        .typeError('O valor deve ser um número.')
        .required('O valor é obrigatório.')
        .min(0, 'O valor não pode ser negativo.')
        .test('valor-minimo', 'O valor deve ser maior que 0', (value) => value > 0),

    disponivel: yup
        .boolean()
        .required('A disponibilidade é obrigatória.')
        .default(true),

    // Campos opcionais (todos com valores padrão)
    cidade: yup
        .string()
        .default('')
        .transform((value) => value === undefined || value === null ? '' : value),

    descricao: yup
        .string()
        .nullable()
        .default(null)
        .optional()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    detalhes: yup
        .string()
        .nullable()
        .default(null)
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    quartos: yup
        .number()
        .nullable()
        .typeError('Quartos deve ser um número.')
        .min(0, 'O número de quartos não pode ser negativo.')
        .integer('O número de quartos deve ser um número inteiro.')
        .default(null)
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    banheiros: yup
        .number()
        .nullable()
        .typeError('Banheiros deve ser um número.')
        .min(0, 'O número de banheiros não pode ser negativo.')
        .integer('O número de banheiros deve ser um número inteiro.')
        .default(null)
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    garagem: yup
        .boolean()
        .default(false),
});