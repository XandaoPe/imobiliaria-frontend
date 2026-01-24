import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    AccountBalance,
    AccessTime,
    AccountBalanceWallet,
    MoneyOff
} from '@mui/icons-material';

interface SummaryProps {
    receitas: number;
    despesas: number;
    pendentes: number;
    layout?: 'horizontal' | 'vertical';
}

export const FinanceiroSummary: React.FC<SummaryProps> = ({
    receitas,
    despesas,
    pendentes,
    layout = 'vertical'
}) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const totalParcelasBruto = receitas;
    const totalRepasseBruto = despesas;
    const totalPendentesAReceber = pendentes;
    const totalPendentesAPagar = despesas * (pendentes / receitas || 0);
    const comissaoPendenteBruto = totalPendentesAReceber - totalPendentesAPagar;
    const saldoAtualPeriodo = totalParcelasBruto - totalRepasseBruto;

    const isVertical = layout === 'vertical';

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Cores adaptadas para tema escuro
    const cardStyles = [
        {
            title: 'TOTAL PARCELAS (Bruto)',
            value: totalParcelasBruto,
            icon: <TrendingUp />,
            borderColor: isDarkMode ? '#4caf50' : '#2e7d32',
            bgColor: isDarkMode ? '#1b5e20' : '#e8f5e9',
            textColor: isDarkMode ? '#e8f5e9' : '#2e7d32',
            iconColor: 'success'
        },
        {
            title: 'TOTAL REPASSE (Bruto)',
            value: totalRepasseBruto,
            icon: <TrendingDown />,
            borderColor: isDarkMode ? '#f44336' : '#d32f2f',
            bgColor: isDarkMode ? '#c62828' : '#ffebee',
            textColor: isDarkMode ? '#ffebee' : '#d32f2f',
            iconColor: 'error'
        },
        {
            title: 'PENDENTE (À Receber)',
            value: totalPendentesAReceber,
            icon: <AccessTime />,
            borderColor: isDarkMode ? '#ff9800' : '#ed6c02',
            bgColor: isDarkMode ? '#ef6c00' : '#fff3e0',
            textColor: isDarkMode ? '#fff3e0' : '#ed6c02',
            iconColor: 'warning'
        },
        {
            title: 'PENDENTE (À Pagar)',
            value: totalPendentesAPagar,
            icon: <MoneyOff />,
            borderColor: isDarkMode ? '#f44336' : '#c62828',
            bgColor: isDarkMode ? '#b71c1c' : '#fff5f5',
            textColor: isDarkMode ? '#ffcdd2' : '#c62828',
            iconColor: 'error'
        },
        {
            title: 'COMISSÃO PENDENTE',
            value: comissaoPendenteBruto,
            icon: <AccountBalanceWallet />,
            borderColor: isDarkMode ? '#9c27b0' : '#9c27b0',
            bgColor: isDarkMode ? '#7b1fa2' : '#fdf7ff',
            textColor: isDarkMode ? '#f3e5f5' : '#9c27b0',
            iconColor: 'secondary'
        },
        {
            title: 'SALDO DO PERÍODO',
            value: saldoAtualPeriodo,
            icon: <AccountBalance />,
            borderColor: isDarkMode ? '#2196f3' : '#1976d2',
            bgColor: isDarkMode ? '#1565c0' : '#f8fbff',
            textColor: isDarkMode ? '#e3f2fd' : '#1976d2',
            iconColor: 'primary'
        }
    ];

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            flexWrap: 'wrap',
            gap: 2,
            '& > *': {
                flex: isVertical ? '1 1 auto' : { xs: '1 1 100%', sm: '1 1 calc(30% - 16px)', md: '1 1 calc(16.6% - 16px)' }
            }
        }}>
            {cardStyles.map((card, index) => (
                <Paper
                    key={index}
                    sx={{
                        p: 2,
                        borderLeft: `4px solid ${card.borderColor}`,
                        backgroundColor: isDarkMode ? 'background.paper' : card.bgColor,
                        boxShadow: isDarkMode ? theme.shadows[2] : '0 2px 12px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isDarkMode ? theme.shadows[4] : '0 4px 20px rgba(0,0,0,0.1)'
                        }
                    }}
                >
                    <Typography
                        color={isDarkMode ? "text.secondary" : "textSecondary"}
                        variant="caption"
                        fontWeight="bold"
                        sx={{ opacity: isDarkMode ? 0.8 : 1 }}
                    >
                        {card.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography
                            variant={isVertical ? "h6" : "h5"}
                            fontWeight="bold"
                            color={isDarkMode ? card.textColor : `${card.iconColor}.main`}
                            sx={{ color: card.textColor }}
                        >
                            {formatCurrency(card.value)}
                        </Typography>
                        <Box sx={{
                            color: isDarkMode ? card.textColor : undefined,
                            '& .MuiSvgIcon-root': {
                                fontSize: 'small',
                                color: isDarkMode ? card.textColor : `${card.iconColor}.main`
                            }
                        }}>
                            {card.icon}
                        </Box>
                    </Box>
                </Paper>
            ))}
        </Box>
    );
};