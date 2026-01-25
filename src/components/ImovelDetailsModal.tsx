import React, { useRef } from 'react';
import {
    Dialog, DialogContent, DialogTitle, IconButton, Typography,
    Box, Divider, Chip, Button, useTheme
} from '@mui/material';
import {
    Close as CloseIcon,
    BedOutlined, BathtubOutlined, HomeWorkOutlined,
    DriveEtaOutlined, Business as BusinessIcon,
    LandscapeOutlined,
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
                borderBottom: `1px solid ${theme.palette.divider}`
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
                <Box sx={{ position: 'relative', bgcolor: '#000' }}>
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

                {/* --- INFORMAÇÕES DO IMÓVEL --- */}
                <Box sx={{ p: 3 }}>
                    {/* CABEÇALHO: IMOBILIÁRIA E STATUS */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            // mb: 0.5 // Reduzido para aproximar dos itens abaixo
                        }}>
                            <Chip
                                icon={<BusinessIcon sx={{ fontSize: '16px' }} />}
                                label={imovel.empresa?.nome || 'Imobiliária'}
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    height: 26
                                }}
                            />
                            <Chip
                                label={imovel.cidade || 'Cidade não informada'}
                                size="small"
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: '1.5rem',
                                    height: 24
                                }}
                            />
                            <Chip
                                label={imovel.disponivel ? 'Disponível' : 'Indisponível'}
                                color={imovel.disponivel ? 'success' : 'error'}
                                size="small"
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    height: 24
                                }}
                            />
                        </Box>

                    </Box>

                    {/* ENDEREÇO - subtitulo 2 (requisito 3) */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="subtitle2" color="text.secondary" >
                            {imovel.endereco || 'Endereço não informado'}
                        </Typography>
                    </Box>

                    {/* TIPO E TÍTULO - subtitulo 2 (requisito 4) */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {imovel.tipo || 'Tipo não informado'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {imovel.titulo || 'Título não informado'}
                        </Typography>

                    </Box>

                    {/* DESCRIÇÃO */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {imovel.descricao || 'Sem descrição disponível.'}
                        </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />

                    {/* VALORES DE VENDA E ALUGUEL */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                    }}>
                        {imovel.para_venda && imovel.valor_venda && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Chip
                                    label="Venda"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ mb: 0.5, fontSize: '0.75rem', height: 22 }}
                                />
                                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>
                                    {imovel.valor_venda.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    })}
                                </Typography>
                            </Box>
                        )}

                        {imovel.para_aluguel && imovel.valor_aluguel && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Chip
                                    label="Aluguel"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ mb: 0.5, fontSize: '0.75rem', height: 22 }}
                                />
                                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>
                                    {imovel.valor_aluguel.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    })}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* CARACTERÍSTICAS COM ÍCONES MENORES (requisito 5) */}
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        mb: 3,
                        py: 1.5,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        borderBottom: `1px solid ${theme.palette.divider}`
                    }}>
                        {[
                            { icon: <BedOutlined sx={{ fontSize: '18px' }} />, label: 'Quartos', value: imovel.quartos },
                            { icon: <BathtubOutlined sx={{ fontSize: '18px' }} />, label: 'Banheiros', value: imovel.banheiros },
                            { icon: <LandscapeOutlined sx={{ fontSize: '18px' }} />, label: 'Área Terreno', value: `${imovel.area_terreno || 0}m²` },
                            { icon: <HomeWorkOutlined sx={{ fontSize: '18px' }} />, label: 'Área Construída', value: `${imovel.area_construida || 0}m²` },
                            { icon: <DriveEtaOutlined sx={{ fontSize: '18px' }} />, label: 'Garagem', value: imovel.garagem ? 'Sim' : 'Não' }
                        ].map((item, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    minWidth: { xs: 'calc(50% - 12px)', sm: '100px' },
                                    p: 1,
                                }}
                            >
                                <Box sx={{ color: 'primary.main', mb: 0.25 }}>
                                    {item.icon}
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {item.label}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                    {item.value || 0}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* BOTÃO DE INTERESSE */}
                    <Button
                        variant="contained"
                        fullWidth
                        size="medium"
                        startIcon={<SendIcon />}
                        onClick={onInteresse}
                        disabled={!imovel.disponivel}
                        sx={{
                            borderRadius: 2,
                            py: 1.25,
                            fontWeight: 'bold',
                            fontSize: '1rem',
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