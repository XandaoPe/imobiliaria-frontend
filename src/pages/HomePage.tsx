import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, CircularProgress, Alert, ToggleButtonGroup,
    ToggleButton, Button, Container, useTheme, TextField, InputAdornment, IconButton
} from '@mui/material';
import {
    Home as HomeIcon,
    FilterList as FilterIcon,
    Search as SearchIcon,
    Clear as ClearIcon
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

    // Estados
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false); // Novo: específico para o debounce da busca
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para Modais
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [leadModalOpen, setLeadModalOpen] = useState(false);
    const [selectedImovelLead, setSelectedImovelLead] = useState<Imovel | null>(null);

    // Função de busca no Backend
    const fetchImoveis = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        setSearching(true);

        try {
            const url = token
                ? 'http://localhost:5000/imoveis'
                : 'http://localhost:5000/imoveis/publico';

            const response = await axios.get(url, {
                params: { search: searchTerm },
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            setImoveis(response.data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError('Falha ao carregar imóveis do servidor.');
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }, [token, searchTerm]);

    // Lógica de Debounce: evita requisições excessivas e mantém o foco
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchImoveis();
        }, 600); // 600ms após o usuário parar de digitar

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchImoveis]);

    // Filtro local (Status Disponível/Indisponível)
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
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', md: 'center' },
                        gap: 3
                    }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
                                Catálogo de Imóveis
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {user ? `Bem-vindo, ${user.nome}!` : 'Encontre o imóvel dos seus sonhos.'}
                            </Typography>
                        </Box>

                        {/* BUSCA (Query no Back) */}
                        <TextField
                            placeholder="Cidade, título ou valor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            variant="outlined"
                            size="medium"
                            sx={{
                                width: { xs: '100%', md: '450px' },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                    bgcolor: '#f1f3f4',
                                    '& fieldset': { border: 'none' },
                                    '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 2px ' + theme.palette.primary.main }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {searching ? <CircularProgress size={20} /> : <SearchIcon color="primary" />}
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setSearchTerm('')} edge="end">
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {!user && (
                            <Button
                                variant="contained"
                                startIcon={<HomeIcon />}
                                onClick={() => navigate('/')}
                                sx={{ borderRadius: '50px', px: 4, fontWeight: 600 }}
                            >
                                Início
                            </Button>
                        )}
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* --- FILTROS DE STATUS (Apenas Logado) --- */}
                {user && (
                    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FilterIcon color="action" />
                        <ToggleButtonGroup
                            value={filter}
                            exclusive
                            onChange={(_e, v) => v && setFilter(v)}
                            size="small"
                            sx={{ bgcolor: 'white', borderRadius: '12px' }}
                        >
                            <ToggleButton value="TODOS">Todos ({imoveis.length})</ToggleButton>
                            <ToggleButton value="DISPONIVEIS" color="success">Disponíveis</ToggleButton>
                            <ToggleButton value="INDISPONIVEIS" color="error">Indisponíveis</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

                {/* --- LISTAGEM --- */}
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }} color="text.secondary">Carregando catálogo...</Typography>
                    </Box>
                ) : filteredImoveis.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <Typography variant="h6" color="text.secondary">
                            Nenhum imóvel encontrado para "{searchTerm}".
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
                                    onInteresse={!user ? () => {
                                        setSelectedImovelLead(imovel);
                                        setLeadModalOpen(true);
                                    } : undefined}
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

type FilterStatus = 'TODOS' | 'DISPONIVEIS' | 'INDISPONIVEIS';