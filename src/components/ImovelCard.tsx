import React from 'react';
import { Card, CardContent, CardMedia, Typography, Chip, Box, Tooltip, Button, CardActions } from '@mui/material';
import { Business as BusinessIcon, BathtubOutlined, BedOutlined, DriveEtaOutlined, HomeWorkOutlined, LandscapeOutlined, SendOutlined } from '@mui/icons-material';
import { Imovel } from '../types/imovel';
import HighlightText from './HighlightText';
const PHOTO_BASE_URL = 'http://localhost:5000/uploads/imoveis';

interface ImovelCardProps {
    imovel: Imovel;
    onClick: (imovel: Imovel) => void;
    onInteresse?: () => void;
    searchTerm?: string; // Prop necessária para o highlight
}

const getTipoDisplay = (tipo: string): string => {
    const tipoMap: Record<string, string> = { 'CASA': 'Casa', 'APARTAMENTO': 'Apartamento', 'TERRENO': 'Terreno', 'COMERCIAL': 'Comercial' };
    return tipoMap[tipo] || tipo;
};

const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onClick, onInteresse, searchTerm = '' }) => {
    const firstPhoto = imovel.fotos && imovel.fotos.length > 0 ? imovel.fotos[0] : null;
    const imageUrl = firstPhoto ? `${PHOTO_BASE_URL}/${firstPhoto}` : '/images/placeholder.png';
    const nomeEmpresa = typeof imovel.empresa === 'object'
        ? imovel.empresa.nome
        : 'Imobiliária Geral';

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: '0.3s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' } }} onClick={() => onClick(imovel)}>
            <CardMedia component="img" height="190" image={imageUrl} sx={{ objectFit: 'cover' }} />
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                    <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', textTransform: 'uppercase' }}>
                        <HighlightText text={nomeEmpresa} highlight={searchTerm} />
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {getTipoDisplay(imovel.tipo)} | <HighlightText text={imovel.cidade || ''} highlight={searchTerm} />
                    </Typography>
                    <Chip label={imovel.disponivel ? 'Disponível' : 'Indisponível'} color={imovel.disponivel ? 'success' : 'error'} size="small" />
                </Box>

                <Typography variant="h6" component="div" gutterBottom noWrap>
                    <HighlightText text={imovel.titulo || 'Imóvel sem Título'} highlight={searchTerm} />
                </Typography>

                <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mb: 1 }}>
                    {(imovel.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>

                {/* Opcional: Highlight no endereço também */}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    <HighlightText text={imovel.endereco || ''} highlight={searchTerm} />
                </Typography>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                {onInteresse && (
                    <Button variant="contained" size="small" startIcon={<SendOutlined />} fullWidth onClick={(e) => { e.stopPropagation(); onInteresse(); }} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}>
                        Tenho Interesse
                    </Button>
                )}
            </CardActions>
        </Card>
    );
};

export default ImovelCard;