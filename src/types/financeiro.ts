import * as yup from 'yup';

export interface Transacao {
    _id: string;
    descricao: string;
    valor: number;
    dataVencimento: string;
    dataPagamento?: string;
    tipo: 'RECEITA' | 'DESPESA';
    status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
    categoria: 'ALUGUEL' | 'REPASSE' | 'COMISSAO' | 'OPERACIONAL' | 'OUTROS';
    cliente?: string; // ID do Cliente
    imovel?: string;  // ID do Imóvel
}

export const financeiroValidationSchema = yup.object().shape({
    descricao: yup.string().required('A descrição é obrigatória'),
    valor: yup.number().transform((value) => (isNaN(value) ? undefined : value)).positive('O valor deve ser maior que zero').required('O valor é obrigatório'),
    dataVencimento: yup.string().required('A data é obrigatória'),
    tipo: yup.string().oneOf(['RECEITA', 'DESPESA']).required(),
    categoria: yup.string().required('A categoria é obrigatória'),
    status: yup.string().oneOf(['PENDENTE', 'PAGO', 'CANCELADO']).default('PENDENTE'),
    imovel: yup.string().optional().nullable(),
    cliente: yup.string().optional().nullable(),
});