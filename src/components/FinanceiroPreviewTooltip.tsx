import React from 'react';
import { Popover, Box, Typography, Divider, Chip, Stack, useTheme } from '@mui/material';
import { Person, HomeWork, Phone, LocationOn, Visibility } from '@mui/icons-material';

interface PreviewProps {
    anchorEl: HTMLElement | null;
    handleClose: () => void;
    data: any;
}

export const FinanceiroPreviewTooltip: React.FC<PreviewProps> = ({ anchorEl, handleClose, data }) => {
    const theme = useTheme();
    const open = Boolean(anchorEl);

    if (!data) return null;

    return (
        <Popover
            sx={{
                pointerEvents: 'none',
                '& .MuiPopover-paper': {
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.shadows[6]
                }
            }}
            open={open}
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            onClose={handleClose}
            disableRestoreFocus
        >
            <Box sx={{ p: 2, width: 320 }}>

                {/* AVISO DE CLIQUE (NOVO) */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 1.5,
                    p: 0.5,
                    bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                    borderRadius: 1,
                    opacity: 0.9
                }}>
                    <Visibility sx={{ fontSize: '0.9rem', color: 'white' }} />
                    <Typography variant="caption" fontWeight="600" sx={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        color: 'white' // Cor clara fixa
                    }}>
                        Clique no olho para visualização completa
                    </Typography>
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: 'primary.main' }}>
                        {data.negociacaoCodigo || 'LANÇAMENTO'}
                    </Typography>
                    <Chip
                        label={data.status}
                        size="small"
                        color={data.status === 'PAGO' ? 'success' : 'warning'}
                        sx={{
                            fontSize: '0.6rem',
                            height: 20,
                            fontWeight: 'bold',
                            color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
                        }}
                    />
                </Stack>

                <Divider sx={{
                    mb: 1.5,
                    borderColor: 'divider'
                }} />

                {/* SEÇÃO CLIENTE - DADOS EMPILHADOS */}
                <Stack spacing={0.5} mb={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" sx={{ color: 'primary.main' }} />
                        <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                            Cliente:
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.primary' }}>
                            {data.cliente?.nome || 'Lançamento Avulso'}
                        </Typography>
                    </Box>
                    {data.cliente?.telefone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3 }}>
                            <Phone sx={{ fontSize: '0.8rem', color: 'action.active' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {data.cliente.telefone}
                            </Typography>
                        </Box>
                    )}
                </Stack>

                {/* SEÇÃO IMÓVEL - DADOS EMPILHADOS */}
                <Stack spacing={0.5} mb={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HomeWork fontSize="small" sx={{ color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.primary' }}>
                            {data.imovel?.titulo || 'Sem imóvel vinculado'}
                        </Typography>
                    </Box>
                    {data.imovel?.endereco && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pl: 3 }}>
                            <LocationOn sx={{
                                fontSize: '0.8rem',
                                mt: 0.3,
                                color: 'action.active'
                            }} />
                            <Typography variant="caption" sx={{
                                color: 'text.secondary',
                                lineHeight: 1.2
                            }}>
                                {data.imovel.endereco}
                                {data.imovel.cidade && `, ${data.imovel.cidade}`}
                            </Typography>
                        </Box>
                    )}
                    {data.imovel?.proprietario?.nome && (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3 }}>
                                <Person fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                                    Proprietário:
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.primary' }}>
                                    {data.imovel?.proprietario?.nome}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Stack>

                {/* DESCRIÇÃO */}
                <Box sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                    borderRadius: 1,
                    borderLeft: `3px solid ${theme.palette.primary.main}`
                }}>
                    <Typography
                        variant="caption"
                        display="block"
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 'bold'
                        }}
                    >
                        DESCRIÇÃO:
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontStyle: 'italic',
                            color: 'text.primary'
                        }}
                    >
                        {data.descricao}
                    </Typography>
                </Box>

                {/* VALOR TOTAL */}
                <Box sx={{
                    mt: 2,
                    pt: 1,
                    borderTop: `1px dashed ${theme.palette.divider}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary' }}>
                        Total do Título:
                    </Typography>
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                            fontSize: '1rem',
                            color: data.tipo === 'RECEITA' ? 'success.main' : 'error.main'
                        }}
                    >
                        R$ {data.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                </Box>
            </Box>
        </Popover>
    );
};