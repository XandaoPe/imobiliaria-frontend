import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    AccountBalance,
    AccessTime,
    AccountBalanceWallet,
    MoneyOff
} from '@mui/icons-material';

interface SummaryProps {
    receitas: number;    // Soma de todas as RECEITAS (Pagas + Pendentes) no período
    despesas: number;    // Soma de todas as DESPESAS/REPASSES (Pagos + Pendentes) no período
    pendentes: number;   // Bruto total das RECEITAS com status PENDENTE
    // Nota: Para as novas métricas, assumiremos que seu backend envie ou que calcularemos 
    // com base no fluxo de caixa padrão do período selecionado.
    layout?: 'horizontal' | 'vertical';
}

// Estendendo a interface para cobrir os novos requisitos caso você decida enviar os dados detalhados do backend
// Se o backend enviar apenas receitas, despesas e pendentes brutos, calcularemos as derivações abaixo:
export const FinanceiroSummary: React.FC<SummaryProps> = ({ receitas, despesas, pendentes, layout = 'vertical' }) => {

    // 1. Total de Parcelas (Bruto): Já é o 'receitas' (Soma de tudo o que há no período: pagas e pendentes)
    const totalParcelasBruto = receitas;

    // 2. Total de Repasse (Bruto): Já é o 'despesas' (Soma de todos os REPASSES no período)
    const totalRepasseBruto = despesas;

    // 3. Total de Pendentes (À RECEBER): Já é o 'pendentes' (Total de RECEITAS PENDENTES na tela)
    const totalPendentesAReceber = pendentes;

    // 4. Total de Pendentes (À PAGAR): 
    // Em um sistema de imobiliária, o repasse costuma ser proporcional. 
    // Se o backend não enviar o 'pendentesDespesa' separadamente, 
    // estimamos que 90% da receita pendente seja repasse pendente (conforme sua taxa de 10%).
    // Caso o backend envie esse dado, substitua por 'props.pendentesDespesa'.
    const totalPendentesAPagar = despesas * (pendentes / receitas || 0);

    // 5. Comissão Pendente (Bruto): Diferença entre VENDAS PENDENTES e REPASSES PENDENTES.
    const comissaoPendenteBruto = totalPendentesAReceber - totalPendentesAPagar;

    // 6. Saldo Atual (Gerado no Período): Saldo total de tudo que foi movimentado (Bruto Receita - Bruto Repasse)
    const saldoAtualPeriodo = totalParcelasBruto - totalRepasseBruto;

    const isVertical = layout === 'vertical';

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            flexWrap: 'wrap',
            gap: 2,
            '& > *': { flex: isVertical ? '1 1 auto' : { xs: '1 1 100%', sm: '1 1 calc(30% - 16px)', md: '1 1 calc(16.6% - 16px)' } }
        }}>
            {/* 1. TOTAL PARCELAS (BRUTO) */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #2e7d32', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">TOTAL PARCELAS (Bruto)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="success.main">
                        {formatCurrency(totalParcelasBruto)}
                    </Typography>
                    <TrendingUp color="success" fontSize="small" />
                </Box>
            </Paper>

            {/* 2. TOTAL REPASSE (BRUTO) */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #d32f2f', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">TOTAL REPASSE (Bruto)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="error.main">
                        {formatCurrency(totalRepasseBruto)}
                    </Typography>
                    <TrendingDown color="error" fontSize="small" />
                </Box>
            </Paper>

            {/* 3. TOTAL PENDENTES (À RECEBER) */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #ed6c02', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">PENDENTE (À Receber)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="warning.main">
                        {formatCurrency(totalPendentesAReceber)}
                    </Typography>
                    <AccessTime color="warning" fontSize="small" />
                </Box>
            </Paper>

            {/* 4. TOTAL PENDENTES (À PAGAR) */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #c62828', bgcolor: '#fff5f5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">PENDENTE (À Pagar)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="#c62828">
                        {formatCurrency(totalPendentesAPagar)}
                    </Typography>
                    <MoneyOff sx={{ color: '#c62828' }} fontSize="small" />
                </Box>
            </Paper>

            {/* 5. COMISSÃO PENDENTE (BRUTO) */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #9c27b0', bgcolor: '#fdf7ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">COMISSÃO PENDENTE</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="secondary.main">
                        {formatCurrency(comissaoPendenteBruto)}
                    </Typography>
                    <AccountBalanceWallet color="secondary" fontSize="small" />
                </Box>
            </Paper>

            {/* 6. SALDO ATUAL (PERÍODO) */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #1976d2', bgcolor: '#f8fbff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">SALDO DO PERÍODO</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="primary.main">
                        {formatCurrency(saldoAtualPeriodo)}
                    </Typography>
                    <AccountBalance color="primary" fontSize="small" />
                </Box>
            </Paper>
        </Box>
    );
};