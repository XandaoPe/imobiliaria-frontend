import React from 'react';
import {
    Card, CardContent, CardMedia, Typography, Chip, Box, Tooltip, Button, CardActions,
    Divider
} from '@mui/material';
import {
    Business as BusinessIcon,
    BathtubOutlined,
    BedOutlined,
    DriveEtaOutlined,
    HomeWorkOutlined,
    LandscapeOutlined,
    SendOutlined
} from '@mui/icons-material';
import { Imovel } from '../types/imovel';
import HighlightText from './HighlightText';
import { API_URL } from '../services/api';

const PHOTO_BASE_URL = `${API_URL}/uploads/imoveis`;

interface ImovelCardProps {
    imovel: Imovel;
    onClick: (imovel: Imovel) => void;
    onInteresse?: () => void;
    searchTerm?: string;
}

const getTipoDisplay = (tipo: string): string => {
    const tipoMap: Record<string, string> = {
        'CASA': 'Casa',
        'APARTAMENTO': 'Apartamento',
        'TERRENO': 'Terreno',
        'COMERCIAL': 'Comercial'
    };
    return tipoMap[tipo] || tipo;
};

const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onClick, onInteresse, searchTerm = '' }) => {
    const firstPhoto = imovel.fotos && imovel.fotos.length > 0 ? imovel.fotos[0] : null;

    // Lógica inteligente: se a string começar com "http", usa ela direto. 
    // Caso contrário, anexa o PHOTO_BASE_URL local.
    const imageUrl = firstPhoto
        ? (firstPhoto.startsWith('http') ? firstPhoto : `${PHOTO_BASE_URL}/${firstPhoto}`)
        : '/images/placeholder.png';

    const nomeEmpresa = typeof imovel.empresa === 'object'
        ? imovel.empresa.nome
        : 'Imobiliária Geral';

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: '0.3s',
                '&:hover': {
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    transform: 'translateY(-4px)'
                }
            }}
            onClick={() => onClick(imovel)}
        >
            <CardMedia
                component="img"
                height="200" // Reduzido para compactar o card
                image={imageUrl}
                sx={{ objectFit: 'cover' }}
            />

            <CardContent sx={{ flexGrow: 1, pb: 1, pt: 1.5 }}>
                {/* Cabeçalho: Empresa e Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', textTransform: 'uppercase' }}>
                            <HighlightText text={nomeEmpresa} highlight={searchTerm} />
                        </Typography>
                    </Box>
                    <Chip
                        label={imovel.disponivel ? 'Disponível' : 'Indisponível'}
                        color={imovel.disponivel ? 'success' : 'error'}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center'}}>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                        <HighlightText text={imovel.cidade || ''} highlight={searchTerm} />
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        <HighlightText text={imovel.endereco || ''} highlight={searchTerm} />
                    </Typography>
                </Box>

                {/* Tipo, Cidade e Residencial em uma linha (requisito 1) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        <HighlightText text={getTipoDisplay(imovel.tipo)} highlight={searchTerm} />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        <HighlightText text={imovel.titulo || 'Imóvel sem Título'} highlight={searchTerm} />
                    </Typography>
                </Box>


                {/* Venda e Aluguel lado a lado (requisito 2) */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1.5,
                    gap: 1
                }}>
                    {/* VENDA */}
                    {imovel.para_venda && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <Chip
                                label="Venda"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ mb: 0.5, height: 24, fontSize: '0.8rem' }}
                            />
                            <Typography
                                variant="body1"
                                color="primary.main"
                                fontWeight="bold"
                                sx={{ textAlign: 'center', fontSize: '0.95rem' }}
                            >
                                {(imovel.valor_venda || 0).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                })}
                            </Typography>
                        </Box>
                    )}

                    {/* ALUGUEL */}
                    {imovel.para_aluguel && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <Chip
                                label="Aluguel"
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ mb: 0.5, height: 24, fontSize: '0.8rem' }}
                            />
                            <Typography
                                variant="body1"
                                color="primary.main"
                                fontWeight="bold"
                                sx={{ textAlign: 'center', fontSize: '0.95rem' }}
                            >
                                {(imovel.valor_aluguel || 0).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                })}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Divider */}
                <Divider sx={{ mb: 1, opacity: 0.6 }} />

                {/* Características do imóvel */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    py: 1,
                    borderTop: '1px solid #f0f0f0',
                    borderBottom: '1px solid #f0f0f0',
                    mb: 1
                }}>
                    {imovel.quartos && (
                        <Tooltip title="Quartos">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <BedOutlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{imovel.quartos}</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.banheiros && (
                        <Tooltip title="Banheiros">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <BathtubOutlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{imovel.banheiros}</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.area_terreno && (
                        <Tooltip title="Área do Terreno">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <LandscapeOutlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{imovel.area_terreno}m²</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.area_construida && (
                        <Tooltip title="Área Construída">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <HomeWorkOutlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{imovel.area_construida}m²</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.area_terreno && !imovel.area_construida && (
                        <Tooltip title="Área do Terreno">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <LandscapeOutlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{imovel.area_terreno}m²</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.garagem && (
                        <Tooltip title="Possui Garagem">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <DriveEtaOutlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Garagem</Typography>
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
                {onInteresse && imovel.disponivel && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<SendOutlined />}
                        fullWidth
                        onClick={(e) => { e.stopPropagation(); onInteresse(); }}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            py: 0.75
                        }}
                    >
                        Tenho Interesse
                    </Button>
                )}
            </CardActions>
        </Card>
    );
};

export default ImovelCard;