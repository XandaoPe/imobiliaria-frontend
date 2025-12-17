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
import { LeadModal } from '../components/LeadModal'; // Importe o novo modal

const API_URL = 'http://localhost:5000/imoveis';

type FilterStatus = 'TODOS' | 'DISPONIVEIS' | 'INDISPONIVEIS';

export const HomePage: React.FC = () => {
    const { user } = useAuth();
    const token = user?.token || null;
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('TODOS');

    // Estado para o Modal de Galeria
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    // ⭐️ NOVOS ESTADOS PARA O LEAD
    const [leadModalOpen, setLeadModalOpen] = useState(false);
    const [selectedImovelLead, setSelectedImovelLead] = useState<Imovel | null>(null);

    const handleInteresseClick = (imovel: Imovel) => {
        setSelectedImovelLead(imovel);
        setLeadModalOpen(true);
    };

    const fetchImoveis = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Lógica de URL Dinâmica
            const url = token
                ? 'http://localhost:5000/imoveis'
                : 'http://localhost:5000/imoveis/publico';

            const response = await axios.get(url, {
                // Só envia o header se o token existir
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            setImoveis(response.data);
        } catch (err: any) {
            setError('Falha ao carregar imóveis.');
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, flexGrow: 1 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Catálogo de Imóveis
            </Typography>

            {user && (
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
            )}

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
                        '& > div': {
                            // 1 coluna (xs)
                            // Utilizamos 'flex: 0 0 100%' para que o card não cresça e ocupe mais que o necessário
                            flex: '0 0 100%',
                            // 2 colunas (sm)
                            '@media (min-width: 600px)': {
                                // MUDANÇA: flex-grow agora é 0 (não cresce)
                                flex: '0 0 calc(50% - 12px)',
                            },
                            // 3 colunas (md)
                            '@media (min-width: 960px)': {
                                // MUDANÇA: flex-grow agora é 0 (não cresce)
                                flex: '0 0 calc(33.333% - 16px)',
                            },
                            // 4 colunas (lg)
                            '@media (min-width: 1280px)': {
                                // MUDANÇA: flex-grow agora é 0 (não cresce)
                                flex: '0 0 calc(25% - 18px)',
                            },
                        },
                    }}
                >

                        {filteredImoveis.map((imovel) => (
                            <Box key={imovel._id}>
                                <ImovelCard
                                    imovel={imovel}
                                    onClick={handleCardClick}
                                    // ⭐️ PASSE A FUNÇÃO DE INTERESSE SE NÃO ESTIVER LOGADO
                                    onInteresse={!user ? () => handleInteresseClick(imovel) : undefined}
                                />
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

            <LeadModal
                open={leadModalOpen}
                onClose={() => setLeadModalOpen(false)}
                imovel={selectedImovelLead}
            />
        </Box>
    );
};