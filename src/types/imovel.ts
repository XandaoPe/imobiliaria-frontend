import * as yup from 'yup';

// Tipos baseados no backend
export type ImovelTipo = 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'COMERCIAL';

// Interface para dados do formulário
export interface ImovelFormData {
    titulo: string;
    tipo: ImovelTipo;
    endereco: string;
    para_venda: boolean;
    para_aluguel: boolean;
    valor_venda: number | null;
    valor_aluguel: number | null;
    disponivel: boolean;
    cidade: string;
    descricao: string | null;
    detalhes: string | null;
    quartos: number | null;
    banheiros: number | null;
    area_terreno: number | null;
    area_construida: number | null;
    garagem: boolean;
}

export interface EmpresaInfo {
    _id: string;
    nome: string;
    fone?: string;
}

// Interface principal do Imóvel
export interface Imovel extends ImovelFormData {
    _id: string;
    fotos: string[];
    empresa: string | EmpresaInfo;
    createdAt?: string;
    updatedAt?: string;
}

// Função para normalizar tipo
export const normalizeTipoImovel = (tipo: string): ImovelTipo => {
    const upperTipo = tipo.toUpperCase() as ImovelTipo;
    if (['CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL'].includes(upperTipo)) {
        return upperTipo;
    }
    return 'CASA';
};

// Schema de Validação atualizado - SIMPLIFICADO
export const imovelValidationSchema = yup.object().shape({
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

    // ⭐️ NOVOS CAMPOS BOOLEANOS
    para_venda: yup
        .boolean()
        .default(false),

    para_aluguel: yup
        .boolean()
        .default(false),

    valor_venda: yup
        .number()
        .nullable()
        .typeError('O valor de venda deve ser um número.')
        .min(0, 'O valor de venda não pode ser negativo.') // ⭐️ PERMITE 0
        .when('para_venda', {
            is: true,
            then: (schema) => schema.required('Valor de venda é obrigatório quando "Para Venda" está marcado.'),
            otherwise: (schema) => schema.nullable()
        })
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    valor_aluguel: yup
        .number()
        .nullable()
        .typeError('O valor de aluguel deve ser um número.')
        .min(0, 'O valor de aluguel não pode ser negativo.') // ⭐️ PERMITE 0
        .when('para_aluguel', {
            is: true,
            then: (schema) => schema.required('Valor de aluguel é obrigatório quando "Para Aluguel" está marcado.'),
            otherwise: (schema) => schema.nullable()
        })
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),


    disponivel: yup
        .boolean()
        .required('A disponibilidade é obrigatória.')
        .default(true),

    // Campos opcionais
    cidade: yup
        .string()
        .transform((value) => value === undefined || value === null ? '' : value),

    descricao: yup
        .string()
        .nullable()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    detalhes: yup
        .string()
        .nullable()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    quartos: yup
        .number()
        .nullable()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    banheiros: yup
        .number()
        .nullable()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    area_terreno: yup
        .number()
        .nullable()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    area_construida: yup
        .number()
        .nullable()
        .transform((value, originalValue) =>
            originalValue === '' || originalValue === undefined ? null : value
        ),

    garagem: yup
        .boolean()
        .default(false),
});