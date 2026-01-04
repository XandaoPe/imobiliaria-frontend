import { Cliente } from './cliente';
import { Imovel } from './imovel';

export type StatusNegociacao = 'PROSPECCAO' | 'VISITA' | 'PROPOSTA' | 'FECHADO' | 'PERDIDO';

export interface HistoricoNegociacao {
    data: string;
    descricao: string;
    usuario_nome?: string;
}

export interface Negociacao {
    _id: string;
    cliente: Cliente; // Populado pelo backend
    imovel: Imovel;   // Populado pelo backend
    tipo: 'VENDA' | 'ALUGUEL';
    status: StatusNegociacao;
    valor_negociado?: number;
    historico: HistoricoNegociacao[];
    createdAt: string;
    updatedAt: string;
}

export const getStatusLabel = (status: StatusNegociacao) => {
    const labels: Record<StatusNegociacao, string> = {
        PROSPECCAO: 'Prospecção',
        VISITA: 'Visita Agendada',
        PROPOSTA: 'Proposta Feita',
        FECHADO: 'Fechado (Ganhou)',
        PERDIDO: 'Perdido',
    };
    return labels[status] || status;
};