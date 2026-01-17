import React from 'react';
import { Box, Tooltip, Typography, Stack, Paper } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

interface ImovelImageTooltipProps {
    images?: string[]; // Array de URLs das imagens
    titulo: string;
    children: React.ReactElement;
}

export const ImovelImageTooltip: React.FC<ImovelImageTooltipProps> = ({ images, titulo, children }) => {
    // Se não houver imagens, mostramos apenas o conteúdo original sem tooltip ou com aviso
    const hasImages = images && images.length > 0;

    const renderContent = (
        <Box sx={{ p: 1, maxWidth: 300 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', borderBottom: '1px solid #eee', pb: 0.5 }}>
                {titulo}
            </Typography>

            {!hasImages ? (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1, color: 'text.secondary' }}>
                    <ImageNotSupportedIcon fontSize="small" />
                    <Typography variant="caption">Nenhuma imagem cadastrada</Typography>
                </Stack>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: images.length === 1 ? '1fr' : '1fr 1fr',
                        gap: 0.5,
                        maxHeight: 400,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '4px' }
                    }}
                >
                    {images.map((url, index) => (
                        <Paper
                            key={index}
                            elevation={0}
                            variant="outlined"
                            sx={{
                                overflow: 'hidden',
                                borderRadius: 1,
                                height: images.length === 1 ? 180 : 100,
                                position: 'relative'
                            }}
                        >
                            <img
                                src={url}
                                alt={`Foto ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                                // Fallback para erro de carregamento de imagem
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Erro+na+Imagem';
                                }}
                            />
                        </Paper>
                    ))}
                </Box>
            )}

            {hasImages && (
                <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block', textAlign: 'right', fontSize: '0.65rem' }}>
                    {images.length} {images.length === 1 ? 'imagem' : 'imagens'} disponível(is)
                </Typography>
            )}
        </Box>
    );

    return (
        <Tooltip
            title={renderContent}
            arrow
            placement="right"
            enterDelay={300}
            componentsProps={{
                tooltip: {
                    sx: {
                        backgroundColor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: '0px 10px 30px rgba(0,0,0,0.3)',
                        border: '1px solid',
                        borderColor: 'divider',
                        padding: 0,
                        borderRadius: 2,
                    },
                },
            }}
        >
            {children}
        </Tooltip>
    );
};