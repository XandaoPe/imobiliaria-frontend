// src/utils/pixValidation.ts
export const podeGerarPIX = (transacao: any): { pode: boolean; motivo?: string } => {
    // Verifica status
    if (transacao.status !== 'PENDENTE') {
        return { pode: false, motivo: 'Somente transações pendentes podem gerar PIX' };
    }

    // Verifica tipo e categoria
    const tiposPermitidos = ['RECEITA', 'COMISSAO'];
    if (!tiposPermitidos.includes(transacao.tipo) && transacao.categoria !== 'COMISSAO') {
        return { pode: false, motivo: 'Somente receitas e comissões podem gerar PIX' };
    }

    // Verifica valor positivo
    if (transacao.valor <= 0) {
        return { pode: false, motivo: 'Valor deve ser maior que zero' };
    }

    return { pode: true };
};