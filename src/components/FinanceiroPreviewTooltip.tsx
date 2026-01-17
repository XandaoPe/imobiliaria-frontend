import React from 'react';
import { Popover, Box, Typography, Divider, Chip, Stack } from '@mui/material';
import { Person, HomeWork, Phone, LocationOn, Visibility } from '@mui/icons-material';

interface PreviewProps {
    anchorEl: HTMLElement | null;
    handleClose: () => void;
    data: any;
}

export const FinanceiroPreviewTooltip: React.FC<PreviewProps> = ({ anchorEl, handleClose, data }) => {
    const open = Boolean(anchorEl);

    if (!data) return null;

    return (
        <Popover
            sx={{ pointerEvents: 'none' }}
            open={open}
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            onClose={handleClose}
            disableRestoreFocus
        >
            <Box sx={{ p: 2, width: 320, bgcolor: 'background.paper', boxShadow: 6 }}>

                {/* AVISO DE CLIQUE (NOVO) */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 1.5,
                    p: 0.5,
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    borderRadius: 1,
                    opacity: 0.9
                }}>
                    <Visibility sx={{ fontSize: '0.9rem' }} />
                    <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        Clique no olho para visualização completa
                    </Typography>
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                        {data.negociacaoCodigo || 'LANÇAMENTO'}
                    </Typography>
                    <Chip
                        label={data.status}
                        size="small"
                        color={data.status === 'PAGO' ? 'success' : 'warning'}
                        sx={{ fontSize: '0.6rem', height: 20, fontWeight: 'bold' }}
                    />
                </Stack>

                <Divider sx={{ mb: 1.5 }} />

                {/* SEÇÃO CLIENTE - DADOS EMPILHADOS */}
                <Stack spacing={0.5} mb={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight="bold">
                            {data.cliente?.nome || 'Lançamento Avulso'}
                        </Typography>
                    </Box>
                    {data.cliente?.telefone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3 }}>
                            <Phone sx={{ fontSize: '0.8rem' }} color="action" />
                            <Typography variant="caption" color="text.secondary">
                                {data.cliente.telefone}
                            </Typography>
                        </Box>
                    )}
                </Stack>

                {/* SEÇÃO IMÓVEL - DADOS EMPILHADOS */}
                <Stack spacing={0.5} mb={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HomeWork fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight="bold">
                            {data.imovel?.titulo || 'Sem imóvel vinculado'}
                        </Typography>
                    </Box>
                    {data.imovel?.endereco && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pl: 3 }}>
                            <LocationOn sx={{ fontSize: '0.8rem', mt: 0.3 }} color="action" />
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                {data.imovel.endereco}
                                {data.imovel.cidade && `, ${data.imovel.cidade}`}
                            </Typography>
                        </Box>
                    )}
                </Stack>

                {/* DESCRIÇÃO */}
                <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f4f8', borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">
                        DESCRIÇÃO:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                        {data.descricao}
                    </Typography>
                </Box>

                {/* VALOR TOTAL */}
                <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="bold">Total do Título:</Typography>
                    <Typography variant="h6" fontWeight="bold" color={data.tipo === 'RECEITA' ? 'success.main' : 'error.main'} sx={{ fontSize: '1rem' }}>
                        R$ {data.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                </Box>
            </Box>
        </Popover>
    );
};