// src/components/ImovelCard.tsx
import React from 'react';
import {
    Card, CardContent, CardMedia, Typography, Chip, Box
} from '@mui/material';
import { Imovel } from '../types/imovel'; // Certifique-se de que o tipo Imovel está correto
import { BathtubOutlined, BedOutlined, DriveEtaOutlined, SquareFootOutlined } from '@mui/icons-material';

// URL base para as fotos (a mesma que você usou no ImovelPhotosStep)
const PHOTO_BASE_URL = 'http://localhost:5000/uploads/imoveis';

interface ImovelCardProps {
    imovel: Imovel;
    onClick: (imovel: Imovel) => void;
}

// Função para obter o label amigável do tipo
const getTipoDisplay = (tipo: string): string => {
    const tipoMap: Record<string, string> = {
        'CASA': 'Casa', 'APARTAMENTO': 'Apartamento',
        'TERRENO': 'Terreno', 'COMERCIAL': 'Comercial'
    };
    return tipoMap[tipo] || tipo;
};

// Função para formatar o valor como moeda
const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};


const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onClick }) => {
    const firstPhoto = imovel.fotos && imovel.fotos.length > 0 ? imovel.fotos[0] : null;
    const imageUrl = firstPhoto ? `${PHOTO_BASE_URL}/${firstPhoto}` : '/images/placeholder.png'; // Use um placeholder

    const statusColor = imovel.disponivel ? 'success' : 'error';
    const statusLabel = imovel.disponivel ? 'Disponível' : 'Indisponível';

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: '0.3s',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                }
            }}
            onClick={() => onClick(imovel)}
        >
            <CardMedia
                component="img"
                height="190"
                image={imageUrl}
                alt={`Foto principal do imóvel em ${imovel.cidade}`}
                sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {getTipoDisplay(imovel.tipo)} | {imovel.cidade}
                    </Typography>
                    <Chip label={statusLabel} color={statusColor} size="small" />
                </Box>

                <Typography variant="h6" component="div" gutterBottom noWrap>
                    {imovel.titulo || 'Imóvel sem Título'}
                </Typography>

                <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatCurrency(imovel.valor || 0)}
                </Typography>

                {/* Ícones de Características */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    {imovel.quartos && (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <BedOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                            <Typography variant="body2">{imovel.quartos}</Typography>
                        </Box>
                    )}
                    {imovel.banheiros && (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <BathtubOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                            <Typography variant="body2">{imovel.banheiros}</Typography>
                        </Box>
                    )}
                    {imovel.garagem && (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <DriveEtaOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                            <Typography variant="body2">{imovel.garagem}</Typography>
                        </Box>
                    )}
                    {imovel.descricao && (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <SquareFootOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                            <Typography variant="body2">{imovel.descricao} m²</Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

export default ImovelCard;