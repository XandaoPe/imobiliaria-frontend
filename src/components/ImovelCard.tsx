import React from 'react';
import {
    Card, CardContent, CardMedia, Typography, Chip, Box,
    Tooltip, Button, CardActions // Componentes Adicionados
} from '@mui/material';
import { Imovel } from '../types/imovel';
// Ícones Específicos e Tooltips
import {
    BathtubOutlined,
    BedOutlined,
    DriveEtaOutlined,
    HomeWorkOutlined,
    LandscapeOutlined,
    ListAltOutlined,
    SendOutlined // Ícone para o botão de interesse
} from '@mui/icons-material';

const PHOTO_BASE_URL = 'http://localhost:5000/uploads/imoveis';

interface ImovelCardProps {
    imovel: Imovel;
    onClick: (imovel: Imovel) => void;
    onInteresse?: () => void; // ⭐️ Nova prop opcional
}

const getTipoDisplay = (tipo: string): string => {
    const tipoMap: Record<string, string> = {
        'CASA': 'Casa', 'APARTAMENTO': 'Apartamento',
        'TERRENO': 'Terreno', 'COMERCIAL': 'Comercial'
    };
    return tipoMap[tipo] || tipo;
};

const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// ⭐️ Adicionado onInteresse na desestruturação das props
const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onClick, onInteresse }) => {
    const firstPhoto = imovel.fotos && imovel.fotos.length > 0 ? imovel.fotos[0] : null;
    const imageUrl = firstPhoto ? `${PHOTO_BASE_URL}/${firstPhoto}` : '/images/placeholder.png';

    const statusColor = imovel.disponivel ? 'success' : 'error';
    const statusLabel = imovel.disponivel ? 'Disponível' : 'Indisponível';

    const garagemDisplay = typeof imovel.garagem === 'number' && imovel.garagem > 0
        ? `${imovel.garagem}`
        : 'Sim';

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

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    {imovel.quartos && (
                        <Tooltip title="Número de Quartos" arrow>
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                <BedOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="body2">{imovel.quartos}</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.banheiros && (
                        <Tooltip title="Número de Banheiros" arrow>
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                <BathtubOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="body2">{imovel.banheiros}</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.garagem && (
                        <Tooltip title="Vagas de Garagem" arrow>
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                <DriveEtaOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="body2">{garagemDisplay}</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.area_terreno && (
                        <Tooltip title="Área Total do Terreno (m²)" arrow>
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                <LandscapeOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="body2">{imovel.area_terreno} m²</Typography>
                            </Box>
                        </Tooltip>
                    )}

                    {imovel.area_construida && (
                        <Tooltip title="Área Construída (m²)" arrow>
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                <HomeWorkOutlined sx={{ fontSize: 18, mr: 0.5 }} />
                                <Typography variant="body2">{imovel.area_construida} m²</Typography>
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            </CardContent>

            {/* ⭐️ SEÇÃO ADICIONADA: Ações do Card */}
            <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                {onInteresse && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<SendOutlined />}
                        color="primary"
                        fullWidth
                        onClick={(e) => {
                            e.stopPropagation(); // Impede que abra a galeria de fotos
                            onInteresse();
                        }}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
                    >
                        Tenho Interesse
                    </Button>
                )}
            </CardActions>
        </Card>
    );
}

export default ImovelCard;