import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, CircularProgress, Container, useTheme,
    TextField, InputAdornment, IconButton, Tooltip,
    ToggleButtonGroup, ToggleButton, Chip, Button
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    ArrowBack as ArrowBackIcon,
    FilterList as FilterListIcon,
    Sell as SellIcon,
    Home as HomeIcon,
    AllInclusive as AllInclusiveIcon
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
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('TODOS'); // Filtro de disponibilidade
    const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'VENDA' | 'ALUGUEL'>('TODOS'); // ⭐️ NOVO FILTRO
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
            // Filtro de disponibilidade
            let disponivelFilter = true;
            if (filter === 'DISPONIVEIS') disponivelFilter = im.disponivel === true;
            if (filter === 'INDISPONIVEIS') disponivelFilter = im.disponivel === false;

            // ⭐️ Filtro de tipo (VENDA/ALUGUEL)
            let tipoFilterPass = true;
            if (tipoFilter === 'VENDA') {
                tipoFilterPass = im.para_venda === true;
            } else if (tipoFilter === 'ALUGUEL') {
                tipoFilterPass = im.para_aluguel === true;
            }
            // Se for "TODOS", não filtra por tipo

            return disponivelFilter && tipoFilterPass;
        });
    }, [imoveis, filter, tipoFilter]);

    // ⭐️ Contadores para mostrar quantos imóveis em cada categoria
    const counters = useMemo(() => {
        const total = imoveis.length;
        const vendas = imoveis.filter((im: any) => im.para_venda === true).length;
        const alugueis = imoveis.filter((im: any) => im.para_aluguel === true).length;

        return { total, vendas, alugueis };
    }, [imoveis]);

    const handleTipoFilterChange = (
        event: React.MouseEvent<HTMLElement>,
        newFilter: 'TODOS' | 'VENDA' | 'ALUGUEL'
    ) => {
        if (newFilter !== null) {
            setTipoFilter(newFilter);
        }
    };

    const handleClearFilters = () => {
        setTipoFilter('TODOS');
        setFilter('TODOS');
        setSearchTerm('');
    };

    const hasActiveFilters = tipoFilter !== 'TODOS' || filter !== 'TODOS' || searchTerm !== '';

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

                    {/* ⭐️ FILTROS */}
                    <Box sx={{
                        mt: 4,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: 2
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}>
                            <FilterListIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="body1" sx={{ fontWeight: 600, mr: 1 }}>
                                Filtrar por:
                            </Typography>

                            {/* ⭐️ Toggle Buttons para VENDA/ALUGUEL/TODOS */}
                            <ToggleButtonGroup
                                value={tipoFilter}
                                exclusive
                                onChange={handleTipoFilterChange}
                                aria-label="Tipo de negócio"
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: '20px !important',
                                        px: 2,
                                        textTransform: 'none',
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': {
                                                bgcolor: 'primary.dark'
                                            }
                                        }
                                    }
                                }}
                            >
                                <ToggleButton value="TODOS">
                                    <AllInclusiveIcon sx={{ mr: 1, fontSize: 16 }} />
                                    Todos ({counters.total})
                                </ToggleButton>
                                <ToggleButton value="VENDA">
                                    <SellIcon sx={{ mr: 1, fontSize: 16 }} />
                                    Venda ({counters.vendas})
                                </ToggleButton>
                                <ToggleButton value="ALUGUEL">
                                    <HomeIcon sx={{ mr: 1, fontSize: 16 }} />
                                    Aluguel ({counters.alugueis})
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* Filtro de disponibilidade (existente) */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mr: 1 }}>
                                Status:
                            </Typography>
                            <ToggleButtonGroup
                                value={filter}
                                exclusive
                                onChange={(e, newFilter) => {
                                    if (newFilter !== null) setFilter(newFilter);
                                }}
                                aria-label="Status do imóvel"
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: '20px !important',
                                        px: 2,
                                        textTransform: 'none',
                                        '&.Mui-selected': {
                                            bgcolor: 'secondary.main',
                                            color: 'white',
                                            '&:hover': {
                                                bgcolor: 'secondary.dark'
                                            }
                                        }
                                    }
                                }}
                            >
                                <ToggleButton value="TODOS">Todos</ToggleButton>
                                <ToggleButton value="DISPONIVEIS">Disponíveis</ToggleButton>
                                <ToggleButton value="INDISPONIVEIS">Indisponíveis</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* Botão para limpar filtros */}
                        {hasActiveFilters && (
                            <Button
                                onClick={handleClearFilters}
                                size="small"
                                variant="outlined"
                                color="error"
                                sx={{
                                    borderRadius: '20px',
                                    textTransform: 'none',
                                    ml: 'auto'
                                }}
                            >
                                Limpar Filtros
                            </Button>
                        )}
                    </Box>

                    {/* ⭐️ Contadores ativos */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={`Total: ${filteredImoveis.length} imóveis`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                        {tipoFilter === 'TODOS' && (
                            <>
                                <Chip
                                    label={`Venda: ${counters.vendas}`}
                                    color="success"
                                    variant="outlined"
                                    size="small"
                                />
                                <Chip
                                    label={`Aluguel: ${counters.alugueis}`}
                                    color="info"
                                    variant="outlined"
                                    size="small"
                                />
                            </>
                        )}
                        {tipoFilter === 'VENDA' && (
                            <Chip
                                label={`Filtrado: Venda (${filteredImoveis.length})`}
                                color="success"
                                size="small"
                            />
                        )}
                        {tipoFilter === 'ALUGUEL' && (
                            <Chip
                                label={`Filtrado: Aluguel (${filteredImoveis.length})`}
                                color="info"
                                size="small"
                            />
                        )}
                        {filter === 'DISPONIVEIS' && (
                            <Chip
                                label="Apenas Disponíveis"
                                color="success"
                                size="small"
                            />
                        )}
                        {filter === 'INDISPONIVEIS' && (
                            <Chip
                                label="Apenas Indisponíveis"
                                color="warning"
                                size="small"
                            />
                        )}
                    </Box>
                </Container>
            </Box>

            {/* CONTEÚDO PRINCIPAL */}
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                {loading ? (
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
                                Nossos servidores estão "acordando".
                                Isso pode levar até 50 segundos.
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
                                {hasActiveFilters && (
                                    <Button
                                        onClick={handleClearFilters}
                                        variant="contained"
                                        sx={{ mt: 2 }}
                                    >
                                        Limpar Filtros
                                    </Button>
                                )}
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