import * as yup from 'yup';

export interface Transacao {
    _id: string;
    dataVencimento: string;
    tipo: 'RECEITA' | 'DESPESA';
    descricao: string;
    valor: number;
    status: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ATRASADO'; // ✅ Corrigido para valores específicos
    categoria: string; // ✅ Mantém como string (pode ser 'ALUGUEL', 'VENDA', 'COMISSAO', etc.)
    parcelaNumero?: number;
    negociacaoCodigo?: string;
    dataPagamento?: string;
    valorPago?: number;
    observacoes?: string;
    cliente?: {
        _id: string;
        nome: string;
    };
    imovel?: {
        _id: string;
        codigo: string;
        titulo?: string;
        endereco?: string; // ✅ Adicione se precisar
        cidade?: string; // ✅ Adicione se precisar
    };
    comissoesDistribuidas?: boolean; // ✅ Mantém este campo
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