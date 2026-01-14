import { Cliente } from './cliente';
import { Imovel } from './imovel';

export type StatusNegociacao =
    | 'PROSPECCAO'
    | 'VISITA'
    | 'PROPOSTA'
    | 'ANALISE_DOCUMENTACAO'
    | 'CONTRATO_EM_REVISAO'
    | 'ASSINADO'
    | 'FECHADO'
    | 'PERDIDO'
    | 'CANCELADO';

export interface HistoricoNegociacao {
    data: string;
    descricao: string;
    usuario_nome?: string;
}

export interface Negociacao {
    _id: string;
    cliente: {
        _id: string;
        nome: string;
        telefone: string;
        email: string;
        endereco?: string;
        cidade?: string;
    };
    imovel: {
        _id: string;
        titulo: string;
        endereco: string;
        cidade: string;
        preco?: number; // Adicionado para o Modal ler o valor sugerido
        proprietario?: any;
    };
    tipo: 'VENDA' | 'ALUGUEL';
    status: StatusNegociacao;
    valor_acordado: number;
    valor_negociado?: number; // Adicionado para o Dashboard parar de dar erro
    historico: HistoricoNegociacao[];
    createdAt: string;
    updatedAt: string;
}

export const getStatusLabel = (status: StatusNegociacao) => {
    const labels: Record<StatusNegociacao, string> = {
        PROSPECCAO: 'Prospecção',
        VISITA: 'Visita Agendada',
        PROPOSTA: 'Proposta Recebida',
        ANALISE_DOCUMENTACAO: 'Análise de Documentos',
        CONTRATO_EM_REVISAO: 'Contrato em Revisão',
        ASSINADO: 'Contrato Assinado',
        FECHADO: 'Concluído 🎉',
        PERDIDO: 'Perdido ❌',
        CANCELADO: 'Cancelado ⚠️',
    };
    return labels[status] || status;
};