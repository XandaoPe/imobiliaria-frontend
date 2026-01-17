import React, { useMemo } from 'react';
import { Box, Typography, Tooltip, Divider, Stack } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

interface HistoricoItem {
    data: string;
    descricao: string;
    usuario?: string;
}

interface NegociacaoHistoryTooltipProps {
    historico?: HistoricoItem[];
    children: React.ReactElement;
}

export const NegociacaoHistoryTooltip: React.FC<NegociacaoHistoryTooltipProps> = ({ historico, children }) => {
    // Ordenação decrescente (do mais recente para o mais antigo)
    const sortedHistorico = useMemo(() => {
        if (!historico) return [];
        return [...historico].sort((a, b) =>
            new Date(b.data).getTime() - new Date(a.data).getTime()
        );
    }, [historico]);

    if (!sortedHistorico || sortedHistorico.length === 0) {
        return children;
    }

    const renderContent = (
        <Box sx={{ p: 1.5, width: 320 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <HistoryIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Histórico Completo
                </Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />

            <Box
                sx={{
                    maxHeight: 350,
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: '#bdbdbd', borderRadius: '10px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#9e9e9e' }
                }}
            >
                {sortedHistorico.map((item, index) => (
                    <Box key={index} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                        <Typography
                            variant="caption"
                            display="block"
                            color="primary.main"
                            sx={{ fontWeight: '700', fontSize: '0.7rem' }}
                        >
                            {new Date(item.data).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Typography>

                        {item.usuario && (
                            <Typography variant="caption" sx={{ fontWeight: '600', color: 'text.secondary', display: 'block' }}>
                                Por: {item.usuario}
                            </Typography>
                        )}

                        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.3, mt: 0.5 }}>
                            {item.descricao}
                        </Typography>

                        {index < sortedHistorico.length - 1 && (
                            <Divider light sx={{ mt: 1.5, borderStyle: 'dashed' }} />
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );

    return (
        <Tooltip
            title={renderContent}
            arrow
            placement="right-start"
            enterDelay={400}
            componentsProps={{
                tooltip: {
                    sx: {
                        backgroundColor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: '0px 8px 24px rgba(0,0,0,0.2)',
                        border: '1px solid',
                        borderColor: 'divider',
                        padding: 0,
                        borderRadius: 2
                    },
                },
            }}
        >
            {children}
        </Tooltip>
    );
};