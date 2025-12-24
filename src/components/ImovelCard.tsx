import React from 'react';
import {
    Card, CardContent, CardMedia, Typography, Chip, Box, Tooltip, Button, CardActions
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
                height="190"
                image={imageUrl}
                sx={{ objectFit: 'cover' }}
            />

            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                {/* Cabeçalho: Empresa e Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
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

                {/* Tipo e Cidade */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {getTipoDisplay(imovel.tipo)} | <HighlightText text={imovel.cidade || ''} highlight={searchTerm} />
                </Typography>

                {/* Título */}
                <Typography variant="h6" component="div" sx={{ mb: 1, lineHeight: 1.2, height: '3.2em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    <HighlightText text={imovel.titulo || 'Imóvel sem Título'} highlight={searchTerm} />
                </Typography>

                {/* aluguel */}
                <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mb: 1.5 }}>
                    {(imovel.aluguel || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>

                {/* valor */}
                <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mb: 1.5 }}>
                    {(imovel.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>

                {/* --- CARACTERÍSTICAS DO IMÓVEL --- */}
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    py: 1.5,
                    borderTop: '1px solid #f0f0f0',
                    mb: 1
                }}>
                    {imovel.quartos && (
                        <Tooltip title="Quartos">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <BedOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{imovel.quartos}</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.banheiros && (
                        <Tooltip title="Banheiros">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <BathtubOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{imovel.banheiros}</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.area_construida && (
                        <Tooltip title="Área Construída">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <HomeWorkOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{imovel.area_construida}m²</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.area_terreno && !imovel.area_construida && (
                        <Tooltip title="Área do Terreno">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LandscapeOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{imovel.area_terreno}m²</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.garagem && (
                        <Tooltip title="Possui Garagem">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <DriveEtaOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                            </Box>
                        </Tooltip>
                    )}
                </Box>

                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                    <HighlightText text={imovel.endereco || ''} highlight={searchTerm} />
                </Typography>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
                {onInteresse && imovel.disponivel && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<SendOutlined />}
                        fullWidth
                        onClick={(e) => { e.stopPropagation(); onInteresse(); }}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
                    >
                        Tenho Interesse
                    </Button>
                )}
            </CardActions>
        </Card>
    );
};

export default ImovelCard;