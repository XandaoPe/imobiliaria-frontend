import React from 'react';
import {
    Dialog, DialogContent, DialogTitle, IconButton, Typography,
    Box, Divider, Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    BedOutlined, BathtubOutlined, HomeWorkOutlined,
    DriveEtaOutlined, Business as BusinessIcon,
    LocationOnOutlined
} from '@mui/icons-material';

const PHOTO_BASE_URL = 'http://localhost:5000/uploads/imoveis';

interface ImovelDetailsModalProps {
    open: boolean;
    onClose: () => void;
    imovel: any;
}

export const ImovelDetailsModal: React.FC<ImovelDetailsModalProps> = ({ open, onClose, imovel }) => {
    if (!imovel) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="body"
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Detalhes do Imóvel
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}> {/* Padding 0 para a galeria encostar nas bordas se desejar */}

                {/* GALERIA DE FOTOS (BOX FLEX) */}
                <Box sx={{
                    display: 'flex',
                    gap: 1.5,
                    overflowX: 'auto',
                    p: 2,
                    bgcolor: '#f1f3f4',
                    '&::-webkit-scrollbar': { height: 8 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 4 },
                    scrollSnapType: 'x mandatory'
                }}>
                    {imovel.fotos && imovel.fotos.length > 0 ? (
                        imovel.fotos.map((foto: string, index: number) => (
                            <Box
                                key={index}
                                component="img"
                                src={`${PHOTO_BASE_URL}/${foto}`}
                                sx={{
                                    height: { xs: 250, md: 350 },
                                    borderRadius: 2,
                                    objectFit: 'cover',
                                    minWidth: { xs: '85%', md: '60%' },
                                    scrollSnapAlign: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                        ))
                    ) : (
                        <Box sx={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Nenhuma foto disponível</Typography>
                        </Box>
                    )}
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* CABEÇALHO: Empresa e Valor */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Chip
                            icon={<BusinessIcon />}
                            label={imovel.empresa?.nome || 'Imobiliária'}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                            {imovel.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Typography>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{imovel.titulo}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                        {imovel.descricao}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {/* CARACTERÍSTICAS (BOX FLEX RESPONSIVO) */}
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: 2,
                        mb: 4
                    }}>
                        {[
                            { icon: <BedOutlined />, label: 'Quartos', value: imovel.quartos },
                            { icon: <BathtubOutlined />, label: 'Banheiros', value: imovel.banheiros },
                            { icon: <HomeWorkOutlined />, label: 'Área Const.', value: `${imovel.area_construida}m²` },
                            { icon: <DriveEtaOutlined />, label: 'Garagem', value: imovel.garagem ? 'Sim' : 'Não' }
                        ].map((item, i) => (
                            <Box key={i} sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: { xs: 'calc(50% - 16px)', sm: '100px' },
                                p: 2,
                                borderRadius: 2,
                                bgcolor: '#f8f9fa'
                            }}>
                                <Box sx={{ color: 'primary.main', mb: 0.5 }}>{item.icon}</Box>
                                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.value || 0}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* LOCALIZAÇÃO */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <LocationOnOutlined />
                        <Box>
                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Localização:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {imovel.endereco}, {imovel.cidade} - {imovel.estado}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};