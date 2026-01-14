import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';

interface SummaryProps {
    receitas: number;
    despesas: number;
}

export const FinanceiroSummary: React.FC<SummaryProps> = ({ receitas, despesas }) => {
    const saldo = receitas - despesas;

    return (
        <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            mb: 4,
            '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(33.33% - 16px)' } }
        }}>
            <Paper sx={{ p: 2.5, borderLeft: '6px solid #2e7d32', boxShadow: 2 }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">TOTAL RECEBIDO</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                        {receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                    <TrendingUp color="success" />
                </Box>
            </Paper>

            <Paper sx={{ p: 2.5, borderLeft: '6px solid #d32f2f', boxShadow: 2 }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">TOTAL PAGO</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="error.main">
                        {despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                    <TrendingDown color="error" />
                </Box>
            </Paper>

            <Paper sx={{ p: 2.5, borderLeft: '6px solid #1976d2', bgcolor: '#f8fbff', boxShadow: 2 }}>
                <Typography color="textSecondary" variant="caption" fontWeight="bold">SALDO EM CONTA</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                    <AccountBalance color="primary" />
                </Box>
            </Paper>
        </Box>
    );
};