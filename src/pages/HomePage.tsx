import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, CircularProgress, Alert, ToggleButtonGroup,
    ToggleButton, Button, Container, useTheme
} from '@mui/material';
import {
    Home as HomeIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { Imovel } from '../types/imovel';
import ImovelCard from '../components/ImovelCard';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import { useAuth } from '../contexts/AuthContext';
import { LeadModal } from '../components/LeadModal';

export const HomePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    const token = user?.token || null;
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('TODOS');

    // Estado para o Modal de Galeria
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

    // Estados para o Lead
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
            const url = token
                ? 'http://localhost:5000/imoveis'
                : 'http://localhost:5000/imoveis/publico';

            const response = await axios.get(url, {
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

    const filteredImoveis = useMemo(() => {
        return imoveis.filter(imovel => {
            if (filter === 'DISPONIVEIS') return imovel.disponivel === true;
            if (filter === 'INDISPONIVEIS') return imovel.disponivel === false;
            return true;
        });
    }, [imoveis, filter]);

    const handleCardClick = (imovel: Imovel) => {
        if (imovel.fotos && imovel.fotos.length > 0) {
            setSelectedPhotos(imovel.fotos);
            setModalOpen(true);
        } else {
            alert('Este imóvel não possui fotos cadastradas.');
        }
    };

    const handleFilterChange = (
        _event: React.MouseEvent<HTMLElement>,
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

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pb: 8 }}>
            {/* --- HEADER --- */}
            <Box sx={{
                bgcolor: 'background.paper',
                pt: 4, pb: 3, mb: 4,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                borderBottom: '1px solid #eee'
            }}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 2
                    }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
                                Catálogo de Imóveis
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {user ? `Bem-vindo de volta, ${user.nome}!` : 'Explore nossas oportunidades exclusivas.'}
                            </Typography>
                        </Box>

                        {/* RENDERIZAÇÃO CONDICIONAL: Só aparece se NÃO houver usuário logado */}
                        {!user && (
                            <Button
                                variant="contained"
                                startIcon={<HomeIcon />}
                                onClick={() => navigate('/')}
                                sx={{
                                    borderRadius: '50px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 4,
                                    py: 1,
                                    boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                                    '&:hover': {
                                        boxShadow: '0 6px 20px rgba(0,118,255,0.23)',
                                    }
                                }}
                            >
                                Voltar para o Início
                            </Button>
                        )}
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* --- SEÇÃO DE FILTROS (Apenas para Logados) --- */}
                {user && (
                    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FilterIcon color="action" />
                        <ToggleButtonGroup
                            value={filter}
                            exclusive
                            onChange={handleFilterChange}
                            size="small"
                            sx={{
                                bgcolor: 'white',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                '& .MuiToggleButton-root': {
                                    px: 3,
                                    border: '1px solid #e0e0e0',
                                    '&.Mui-selected': {
                                        fontWeight: 'bold'
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="TODOS">Todos ({imoveis.length})</ToggleButton>
                            <ToggleButton value="DISPONIVEIS" color="success">Disponíveis</ToggleButton>
                            <ToggleButton value="INDISPONIVEIS" color="error">Indisponíveis</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

                {/* --- LISTAGEM --- */}
                {filteredImoveis.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <Typography variant="h6" color="text.secondary">
                            Nenhum imóvel encontrado para os critérios selecionados.
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3,
                            '& > div': {
                                flex: '0 0 100%',
                                '@media (min-width: 600px)': { flex: '0 0 calc(50% - 12px)' },
                                '@media (min-width: 960px)': { flex: '0 0 calc(33.333% - 16px)' },
                                '@media (min-width: 1280px)': { flex: '0 0 calc(25% - 18px)' },
                            },
                        }}
                    >
                        {filteredImoveis.map((imovel) => (
                            <Box key={imovel._id}>
                                <ImovelCard
                                    imovel={imovel}
                                    onClick={handleCardClick}
                                    onInteresse={!user ? () => handleInteresseClick(imovel) : undefined}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Container>

            {/* Modais */}
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

// Definição de tipos local para evitar erros de compilação
type FilterStatus = 'TODOS' | 'DISPONIVEIS' | 'INDISPONIVEIS';