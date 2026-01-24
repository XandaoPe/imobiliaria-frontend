import React, { useRef } from 'react';
import {
    Dialog, DialogContent, DialogTitle, IconButton, Typography,
    Box, Divider, Chip, Button, useTheme
} from '@mui/material';
import {
    Close as CloseIcon,
    BedOutlined, BathtubOutlined, HomeWorkOutlined,
    DriveEtaOutlined, Business as BusinessIcon,
    LocationOnOutlined,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    SendOutlined as SendIcon
} from '@mui/icons-material';
import { API_URL } from '../services/api';

const PHOTO_BASE_URL = `${API_URL}/uploads/imoveis`;

interface ImovelDetailsModalProps {
    open: boolean;
    onClose: () => void;
    imovel: any;
    onInteresse: () => void;
}

export const ImovelDetailsModal: React.FC<ImovelDetailsModalProps> = ({ open, onClose, imovel, onInteresse }) => {
    const theme = useTheme();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    if (!imovel) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.clientWidth;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="body"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    bgcolor: 'background.paper'
                }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderBottom: `1px solid ${theme.palette.divider}` // Linha divisória para separar visualmente
            }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Detalhes do Imóvel
                </Typography>
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'text.primary',
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* CONTAINER DA GALERIA */}
                <Box sx={{ position: 'relative', bgcolor: '#000' }}> {/* Mantido preto para fotos */}

                    {/* Seta Esquerda */}
                    {imovel.fotos?.length > 1 && (
                        <IconButton
                            onClick={() => scroll('left')}
                            sx={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                zIndex: 10,
                                bgcolor: theme.palette.mode === 'dark'
                                    ? 'rgba(0,0,0,0.6)'
                                    : 'rgba(255,255,255,0.4)',
                                color: theme.palette.mode === 'dark' ? 'white' : 'black',
                                '&:hover': {
                                    bgcolor: theme.palette.mode === 'dark'
                                        ? 'rgba(0,0,0,0.8)'
                                        : 'rgba(255,255,255,0.8)'
                                },
                                boxShadow: 2,
                                display: { xs: 'none', md: 'flex' }
                            }}
                        >
                            <NavigateBeforeIcon />
                        </IconButton>
                    )}

                    {/* GALERIA */}
                    <Box
                        ref={scrollContainerRef}
                        sx={{
                            display: 'flex',
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            '&::-webkit-scrollbar': { height: 8 },
                            '&::-webkit-scrollbar-track': {
                                bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f1f1f1'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: theme.palette.mode === 'dark' ? '#666' : '#888',
                                borderRadius: 4
                            },
                        }}
                    >
                        {imovel.fotos?.map((foto: string, index: number) => (
                            <Box
                                key={index}
                                sx={{
                                    minWidth: '100%',
                                    height: { xs: 300, md: 450 },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    scrollSnapAlign: 'start',
                                    bgcolor: '#000'
                                }}
                            >
                                <Box
                                    component="img"
                                    src={foto.startsWith('http') ? foto : `${PHOTO_BASE_URL}/${foto}`}
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>

                    {/* Seta Direita */}
                    {imovel.fotos?.length > 1 && (
                        <IconButton
                            onClick={() => scroll('right')}
                            sx={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                zIndex: 10,
                                bgcolor: theme.palette.mode === 'dark'
                                    ? 'rgba(0,0,0,0.6)'
                                    : 'rgba(255,255,255,0.4)',
                                color: theme.palette.mode === 'dark' ? 'white' : 'black',
                                '&:hover': {
                                    bgcolor: theme.palette.mode === 'dark'
                                        ? 'rgba(0,0,0,0.8)'
                                        : 'rgba(255,255,255,0.8)'
                                },
                                boxShadow: 2,
                                display: { xs: 'none', md: 'flex' }
                            }}
                        >
                            <NavigateNextIcon />
                        </IconButton>
                    )}
                </Box>

                {/* --- RESTANTE DO CONTEÚDO --- */}
                <Box sx={{ p: 3 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 2
                    }}>
                        <Chip
                            icon={<BusinessIcon />}
                            label={imovel.empresa?.nome || 'Imobiliária'}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                            {imovel.aluguel?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Typography>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                            {imovel.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Typography>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{imovel.titulo}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                        {imovel.descricao}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {/* CARACTERÍSTICAS EM BOX FLEX - CORRIGIDO */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, mb: 4 }}>
                        {[
                            { icon: <BedOutlined />, label: 'Quartos', value: imovel.quartos },
                            { icon: <BathtubOutlined />, label: 'Banheiros', value: imovel.banheiros },
                            { icon: <HomeWorkOutlined />, label: 'Área Const.', value: `${imovel.area_construida}m²` },
                            { icon: <DriveEtaOutlined />, label: 'Garagem', value: imovel.garagem ? 'Sim' : 'Não' }
                        ].map((item, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    minWidth: { xs: 'calc(50% - 16px)', sm: '120px' },
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: theme.palette.mode === 'dark'
                                        ? theme.palette.background.default
                                        : '#f8f9fa',
                                    border: `1px solid ${theme.palette.mode === 'dark'
                                        ? theme.palette.divider
                                        : '#eee'}`
                                }}
                            >
                                <Box sx={{
                                    color: 'primary.main',
                                    mb: 0.5
                                }}>
                                    {item.icon}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {item.label}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {item.value || 0}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* LOCALIZAÇÃO ESTILIZADA - CORRIGIDO */}
                    <Box sx={{
                        p: 2,
                        bgcolor: theme.palette.mode === 'dark'
                            ? theme.palette.primary.dark + '20' // 20 = 12% de opacidade
                            : '#f0f7ff',
                        border: `1px solid ${theme.palette.mode === 'dark'
                            ? theme.palette.primary.dark
                            : '#d0e3ff'}`,
                        color: theme.palette.mode === 'dark'
                            ? theme.palette.primary.light
                            : '#0052cc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <LocationOnOutlined />
                        <Box>
                            <Typography variant="caption" sx={{
                                fontWeight: 'bold',
                                display: 'block',
                                textTransform: 'uppercase'
                            }}>
                                Endereço do Imóvel
                            </Typography>
                            <Typography variant="body2">
                                {imovel.endereco}, {imovel.cidade} - {imovel.estado}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<SendIcon />}
                        onClick={onInteresse}
                        disabled={!imovel.disponivel}
                        sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            boxShadow: theme.palette.mode === 'dark'
                                ? '0 4px 14px rgba(25, 118, 210, 0.5)'
                                : '0 4px 14px rgba(25, 118, 210, 0.3)'
                        }}
                    >
                        {imovel.disponivel ? 'Tenho Interesse neste Imóvel' : 'Imóvel Indisponível'}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};