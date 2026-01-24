import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, CircularProgress, Container, useTheme,
    TextField, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImovelCard from '../components/ImovelCard';
import { ImovelDetailsModal } from '../components/ImovelDetailsModal';
import { LeadModal } from '../components/LeadModal';
import { API_URL } from '../services/api';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const token = user?.token || null;

    const [imoveis, setImoveis] = useState([]);
    const [loading, setLoading] = useState(true); // Loading inicial do sistema
    const [searching, setSearching] = useState(false); // Loading apenas do input de busca
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('TODOS');
    const [selectedImovel, setSelectedImovel] = useState<any | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [leadModalOpen, setLeadModalOpen] = useState(false);
    const [imovelParaLead, setImovelParaLead] = useState<any | null>(null);

    const handleOpenInteresse = (imovel: any) => {
        setImovelParaLead(imovel);
        setLeadModalOpen(true);
    };

    const handleOpenModal = (imovel: any) => {
        setSelectedImovel(imovel);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedImovel(null);
    };

    const fetchImoveis = useCallback(async () => {
        setSearching(true);
        try {
            const url = token ? `${API_URL}/imoveis` : `${API_URL}/imoveis/publico`;
            const response = await axios.get(url, {
                params: { search: searchTerm },
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            setImoveis(response.data);
        } catch (err) {
            console.error("Erro ao buscar imóveis:", err);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }, [token, searchTerm]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchImoveis();
        }, 600);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchImoveis]);

    const filteredImoveis = useMemo(() => {
        return imoveis.filter((im: any) => {
            if (filter === 'DISPONIVEIS') return im.disponivel === true;
            if (filter === 'INDISPONIVEIS') return im.disponivel === false;
            return true;
        });
    }, [imoveis, filter]);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* CABEÇALHO E BUSCA */}
            <Box sx={{
                bgcolor: 'background.paper',
                pt: 4,
                pb: 3,
                mb: 4,
                borderBottom: '1px solid',
                borderColor: 'divider' 
            }}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 3
                    }}>
                        <Tooltip title="Voltar para a página inicial" arrow>
                            <IconButton
                                onClick={() => navigate('/')}
                                sx={{
                                    bgcolor: 'action.hover',
                                    '&:hover': {
                                        bgcolor: 'action.selected'
                                    }
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>

                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            Catálogo
                        </Typography>

                        <TextField
                            placeholder="Buscar cidade, título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                width: { xs: '100%', md: '450px' },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                    bgcolor: 'action.hover',
                                    '&.Mui-focused': {
                                        bgcolor: 'background.paper'
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {searching ? <CircularProgress size={20} /> : <SearchIcon color="primary" />}
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <IconButton onClick={() => setSearchTerm('')}>
                                        <ClearIcon />
                                    </IconButton>
                                )
                            }}
                        />
                    </Box>
                </Container>
            </Box>

            {/* CONTEÚDO PRINCIPAL */}
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                {loading ? (
                    /* ⭐️ ESTADO DE CARREGAMENTO COM MENSAGEM PARA O RENDER/VERCEL */
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '40vh',
                        textAlign: 'center',
                        gap: 2
                    }}>
                        <CircularProgress size={60} thickness={4} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                Carregando Imóveis...
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mt: 1 }}>
                                Nossos servidores gratuitos estão "acordando".
                                Isso pode levar até 50 segundos no primeiro acesso do dia.
                                Agradecemos a paciência!
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        justifyContent: { xs: 'center', sm: 'flex-start' }
                    }}>
                        {filteredImoveis.length > 0 ? (
                            filteredImoveis.map((imovel: any) => (
                                <Box
                                    key={imovel._id}
                                    sx={{
                                        // Responsividade: 1 card (xs), 2 cards (sm), 3 cards (md+)
                                        flex: {
                                            xs: '0 0 100%',
                                            sm: '0 0 calc(50% - 12px)',
                                            md: '0 0 calc(33.333% - 16px)'
                                        }
                                    }}
                                >
                                    <ImovelCard
                                        imovel={imovel}
                                        onClick={() => handleOpenModal(imovel)}
                                        onInteresse={() => handleOpenInteresse(imovel)}
                                        searchTerm={searchTerm}
                                    />
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 10 }}>
                                <Typography variant="h6" color="text.secondary">
                                    Nenhum imóvel encontrado para sua busca.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Container>

            {/* MODAIS */}
            {selectedImovel && (
                <ImovelDetailsModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    imovel={selectedImovel}
                    onInteresse={() => {
                        handleCloseModal();
                        handleOpenInteresse(selectedImovel);
                    }}
                />
            )}
            <LeadModal
                open={leadModalOpen}
                onClose={() => setLeadModalOpen(false)}
                imovel={imovelParaLead}
            />
        </Box>
    );
};