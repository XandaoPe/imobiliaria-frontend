// src/pages/HomePage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, CircularProgress, Alert, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { Imovel } from '../types/imovel';
import ImovelCard from '../components/ImovelCard'; // Importa o Card
import PhotoGalleryModal from '../components/PhotoGalleryModal'; // Importa o Modal
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:5000/imoveis';

type FilterStatus = 'TODOS' | 'DISPONIVEIS' | 'INDISPONIVEIS';

export const HomePage: React.FC = () => {
    const { token } = useAuth();
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('TODOS');

    // Estado para o Modal de Galeria
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

    const fetchImoveis = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });
            setImoveis(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Falha ao carregar a lista de imóveis.';
            setError(errorMessage);
            console.error("Erro ao buscar imóveis:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchImoveis();
    }, [fetchImoveis]);

    // Lógica de filtragem dos imóveis
    const filteredImoveis = useMemo(() => {
        return imoveis.filter(imovel => {
            if (filter === 'DISPONIVEIS') {
                return imovel.disponivel === true;
            }
            if (filter === 'INDISPONIVEIS') {
                return imovel.disponivel === false;
            }
            return true; // TODOS
        });
    }, [imoveis, filter]);

    // Função chamada ao clicar em um Card
    const handleCardClick = (imovel: Imovel) => {
        if (imovel.fotos && imovel.fotos.length > 0) {
            setSelectedPhotos(imovel.fotos);
            setModalOpen(true);
        } else {
            // Em um ambiente de produção, este alerta seria substituído por uma notificação mais amigável
            alert('Este imóvel não possui fotos cadastradas.');
        }
    };

    const handleFilterChange = (
        event: React.MouseEvent<HTMLElement>,
        newFilter: FilterStatus | null,
    ) => {
        if (newFilter !== null) {
            setFilter(newFilter);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Catálogo de Imóveis
            </Typography>

            {/* Filtros de Status */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
                <ToggleButtonGroup
                    value={filter}
                    exclusive
                    onChange={handleFilterChange}
                    aria-label="Status do Imóvel"
                    size="small"
                >
                    <ToggleButton value="TODOS">Todos ({imoveis.length})</ToggleButton>
                    <ToggleButton value="DISPONIVEIS" color="success">
                        Disponíveis ({imoveis.filter(i => i.disponivel).length})
                    </ToggleButton>
                    <ToggleButton value="INDISPONIVEIS" color="error">
                        Indisponíveis ({imoveis.filter(i => !i.disponivel).length})
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Listagem dos Imóveis (Usando Box com Flexbox para Layout Responsivo) */}
            {filteredImoveis.length === 0 ? (
                <Alert severity="info">
                    Nenhum imóvel encontrado com o status "{filter === 'DISPONIVEIS' ? 'Disponível' : filter === 'INDISPONIVEIS' ? 'Indisponível' : 'Todos'}".
                </Alert>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3, // Espaçamento entre os cards
                        // Responsividade para os Cards:
                        // O cálculo `calc(X - Gap)` é necessário para garantir que o gap não quebre a linha.
                        '& > div': {
                            // 1 coluna (xs)
                            flex: '1 1 100%',
                            // 2 colunas (sm)
                            '@media (min-width: 600px)': {
                                flex: '1 1 calc(50% - 12px)', // 12px = metade do gap de 3 (3 * 8px = 24px)
                            },
                            // 3 colunas (md)
                            '@media (min-width: 960px)': {
                                flex: '1 1 calc(33.333% - 16px)', // 16px = (2/3) do gap de 3
                            },
                            // 4 colunas (lg)
                            '@media (min-width: 1280px)': {
                                flex: '1 1 calc(25% - 18px)', // 18px = (3/4) do gap de 3
                            },
                        },
                    }}
                >
                    {filteredImoveis.map((imovel) => (
                        <Box key={imovel._id}>
                            <ImovelCard imovel={imovel} onClick={handleCardClick} />
                        </Box>
                    ))}
                </Box>
            )}

            {/* Modal de Galeria de Fotos */}
            <PhotoGalleryModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                photos={selectedPhotos}
            />
        </Box>
    );
};