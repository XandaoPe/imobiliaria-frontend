import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, AccessTime, AccountBalanceWallet } from '@mui/icons-material';

interface SummaryProps {
    receitas: number;
    despesas: number;
    pendentes: number;
    layout?: 'horizontal' | 'vertical';
}

export const FinanceiroSummary: React.FC<SummaryProps> = ({ receitas, despesas, pendentes, layout = 'vertical' }) => {
    // Cálculo do Saldo Real (O que já passou/está no caixa)
    const saldo = receitas - despesas;

    // Cálculo sugerido: Se 'pendentes' é o bruto a receber, 
    // e considerando a taxa de administração de 10% (conforme vimos no seu Service),
    // o Saldo Pendente a Receber (Líquido) seria 10% do bruto pendente.
    // Se o seu backend já enviar o repasse pendente, a conta seria (pendentesReceita - pendentesRepasse).
    // Por enquanto, usaremos a lógica de margem sobre o pendente bruto:
    const saldoPendenteAReceber = pendentes * 0.10;

    const isVertical = layout === 'vertical';

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            flexWrap: 'wrap',
            gap: 2,
            '& > *': { flex: isVertical ? '1 1 auto' : { xs: '1 1 100%', sm: '1 1 calc(20% - 16px)' } }
        }}>
            {/* CARD RECEITOS BRUTO */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #2e7d32', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">TOTAL PARCELAS (Bruto)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="success.main">
                        {formatCurrency(receitas)}
                    </Typography>
                    <TrendingUp color="success" fontSize="small" />
                </Box>
            </Paper>

            {/* CARD REPASSES BRUTO */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #d32f2f', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">TOTAL REPASSE (Bruto)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="error.main">
                        {formatCurrency(despesas)}
                    </Typography>
                    <TrendingDown color="error" fontSize="small" />
                </Box>
            </Paper>

            {/* CARD PENDENTES BRUTO */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #ed6c02', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">PENDENTE (Recebimento Bruto)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="warning.main">
                        {formatCurrency(pendentes)}
                    </Typography>
                    <AccessTime color="warning" fontSize="small" />
                </Box>
            </Paper>

            {/* NOVO CARD: SALDO PENDENTE A RECEBER (LÍQUIDO/COMISSÃO) */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #9c27b0', bgcolor: '#fdf7ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">COMISSÃO PENDENTE (Líquido)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="secondary.main">
                        {formatCurrency(saldoPendenteAReceber)}
                    </Typography>
                    <AccountBalanceWallet color="secondary" fontSize="small" />
                </Box>
            </Paper>

            {/* CARD SALDO LÍQUIDO ATUAL */}
            <Paper sx={{ p: 2, borderLeft: '4px solid #1976d2', bgcolor: '#f8fbff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">SALDO EM CAIXA (Atual)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant={isVertical ? "h6" : "h5"} fontWeight="bold" color="primary.main">
                        {formatCurrency(saldo)}
                    </Typography>
                    <AccountBalance color="primary" fontSize="small" />
                </Box>
            </Paper>
        </Box>
    );
};