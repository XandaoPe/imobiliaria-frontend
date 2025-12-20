// src/components/PhotoGalleryModal.tsx - REFATORADO PARA USAR SWIPER
import React from 'react';
import {
    Dialog, DialogContent, IconButton, Box, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ⭐️ Importações do Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Importe os estilos ESSENCIAIS do Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PHOTO_BASE_URL = 'http://localhost:5000/uploads/imoveis';

interface PhotoGalleryModalProps {
    open: boolean;
    onClose: () => void;
    photos: string[];
}

const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({ open, onClose, photos }) => {
    const theme = useTheme();

    if (!photos || photos.length === 0) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                // Estilos para garantir que o modal ocupe a maior parte da tela
                '& .MuiDialog-paper': {
                    maxHeight: '90vh',
                    minHeight: { xs: '70vh', sm: '80vh' },
                    m: 2,
                    p: 0,
                    overflow: 'hidden', // Evita scroll desnecessário no Dialog
                }
            }}
        >
            <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 10,
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }
                }}
            >
                <CloseIcon />
            </IconButton>

            <DialogContent sx={{ p: 0, position: 'relative' }}>
                <Box sx={{ height: { xs: 300, sm: 500, md: 600 } }}>
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={0}
                        slidesPerView={1}
                        navigation // Ativa botões de navegação
                        pagination={{ clickable: true }} // Ativa pontos de paginação
                        loop={photos.length > 1} // Loop se houver mais de uma foto
                        style={{ height: '100%', width: '100%', '--swiper-navigation-color': '#fff', '--swiper-pagination-color': theme.palette.primary.main }}
                    >
                        {photos.map((photo, index) => (
                            <SwiperSlide key={index}>
                                <Box sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: '#222' // Fundo escuro para destacar a foto
                                }}>
                                    <img
                                        src={`${PHOTO_BASE_URL}/${photo}`}
                                        alt={`Foto ${index + 1}`}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Box>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default PhotoGalleryModal;