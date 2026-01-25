import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, CircularProgress, Container, useTheme,
    TextField, InputAdornment, IconButton, Tooltip,
    ToggleButtonGroup, ToggleButton, Chip, Button, Collapse
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    ArrowBack as ArrowBackIcon,
    FilterList as FilterListIcon,
    Sell as SellIcon,
    Home as HomeIcon,
    AllInclusive as AllInclusiveIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
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
    const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'VENDA' | 'ALUGUEL'>('TODOS');
    const [selectedImovel, setSelectedImovel] = useState<any | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [leadModalOpen, setLeadModalOpen] = useState(false);
    const [imovelParaLead, setImovelParaLead] = useState<any | null>(null);
    const [filtersExpanded, setFiltersExpanded] = useState(false); // Estado para expandir/colapsar filtros

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

            // Filtro de tipo (VENDA/ALUGUEL)
            let tipoFilterPass = true;
            if (tipoFilter === 'VENDA') {
                tipoFilterPass = im.para_venda === true;
            } else if (tipoFilter === 'ALUGUEL') {
                tipoFilterPass = im.para_aluguel === true;
            }

            return disponivelFilter && tipoFilterPass;
        });
    }, [imoveis, filter, tipoFilter]);

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

    const toggleFilters = () => {
        setFiltersExpanded(!filtersExpanded);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* CABEÇALHO E BUSCA */}
            <Box sx={{
                bgcolor: 'background.paper',
                pt: 4,
                pb: filtersExpanded ? 3 : 3,
                mb: 4,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Container maxWidth="lg">
                    {/* Primeira linha: Voltar, Título e Search */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 3,
                        mb: 3
                    }}>
                        {/* Lado esquerdo: Voltar + Título */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            width: { xs: '100%', md: 'auto' }
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

                            <Typography variant="h4" sx={{
                                fontWeight: 800,
                                color: 'primary.main',
                                flexGrow: 1
                            }}>
                                Catálogo
                            </Typography>
                        </Box>

                        {/* Lado direito: Search + Botão de Filtros */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            width: { xs: '100%', md: 'auto' }
                        }}>
                            <TextField
                                placeholder="Buscar cidade, título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{
                                    flexGrow: 1,
                                    minWidth: 250,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '20px',
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
                                        <IconButton onClick={() => setSearchTerm('')} size="small">
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                            />

                            {/* Botão para expandir/colapsar filtros */}
                            <Tooltip title={filtersExpanded ? "Ocultar filtros" : "Mostrar filtros"}>
                                <IconButton
                                    onClick={toggleFilters}
                                    sx={{
                                        bgcolor: filtersExpanded ? 'primary.main' : 'action.hover',
                                        color: filtersExpanded ? 'white' : 'inherit',
                                        '&:hover': {
                                            bgcolor: filtersExpanded ? 'primary.dark' : 'action.selected'
                                        }
                                    }}
                                >
                                    {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    <FilterListIcon sx={{ ml: 0.5 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Filtros expandíveis */}
                    <Collapse in={filtersExpanded}>
                        <Box sx={{
                            mt: 3,
                            p: 3,
                            bgcolor: 'action.hover',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 3
                        }}>
                            {/* Coluna dos filtros */}
                            <Box sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                {/* Filtro de Tipo (VENDA/ALUGUEL) */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap'
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 80 }}>
                                        Tipo:
                                    </Typography>
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
                                                borderRadius: '16px !important',
                                                px: 2,
                                                textTransform: 'none',
                                                fontSize: '0.85rem',
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
                                            <AllInclusiveIcon sx={{ mr: 1, fontSize: 14 }} />
                                            Todos
                                        </ToggleButton>
                                        <ToggleButton value="VENDA">
                                            <SellIcon sx={{ mr: 1, fontSize: 14 }} />
                                            Venda
                                        </ToggleButton>
                                        <ToggleButton value="ALUGUEL">
                                            <HomeIcon sx={{ mr: 1, fontSize: 14 }} />
                                            Aluguel
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>

                                {/* Filtro de Disponibilidade */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap'
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 80 }}>
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
                                                borderRadius: '16px !important',
                                                px: 2,
                                                textTransform: 'none',
                                                fontSize: '0.85rem',
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
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                        <Button
                                            onClick={handleClearFilters}
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            sx={{
                                                borderRadius: '16px',
                                                textTransform: 'none',
                                                mt: 1
                                            }}
                                        >
                                            Limpar Filtros
                                        </Button>
                                    </Box>
                                )}
                            </Box>

                            {/* Coluna dos contadores (vertical) */}
                            <Box sx={{
                                width: { xs: '100%', md: 'auto' },
                                minWidth: { md: 180 },
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                                    Estatísticas
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box component="span" sx={{ color: 'text.secondary' }}>Total:</Box>
                                        <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            {filteredImoveis.length}
                                        </Box>
                                    </Typography>

                                    {tipoFilter === 'TODOS' && (
                                        <>
                                            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Box component="span" sx={{ color: 'text.secondary' }}>Venda:</Box>
                                                <Box component="span" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                    {counters.vendas}
                                                </Box>
                                            </Typography>

                                            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Box component="span" sx={{ color: 'text.secondary' }}>Aluguel:</Box>
                                                <Box component="span" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                                                    {counters.alugueis}
                                                </Box>
                                            </Typography>
                                        </>
                                    )}

                                    {filter !== 'TODOS' && (
                                        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Box component="span" sx={{ color: 'text.secondary' }}>Status:</Box>
                                            <Box component="span" sx={{
                                                fontWeight: 'bold',
                                                color: filter === 'DISPONIVEIS' ? 'success.main' : 'warning.main'
                                            }}>
                                                {filter === 'DISPONIVEIS' ? 'Disponíveis' : 'Indisponíveis'}
                                            </Box>
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        {/* Resumo dos filtros ativos (abaixo do painel) */}
                        {hasActiveFilters && (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                                mt: 2,
                                pt: 2,
                                borderTop: '1px dashed',
                                borderColor: 'divider'
                            }}>
                                <Typography variant="caption" color="text.secondary">
                                    Filtros ativos:
                                </Typography>
                                {tipoFilter !== 'TODOS' && (
                                    <Chip
                                        label={`Tipo: ${tipoFilter === 'VENDA' ? 'Venda' : 'Aluguel'}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        onDelete={() => setTipoFilter('TODOS')}
                                    />
                                )}
                                {filter !== 'TODOS' && (
                                    <Chip
                                        label={`Status: ${filter === 'DISPONIVEIS' ? 'Disponíveis' : 'Indisponíveis'}`}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        onDelete={() => setFilter('TODOS')}
                                    />
                                )}
                                {searchTerm && (
                                    <Chip
                                        label={`Busca: "${searchTerm}"`}
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                        onDelete={() => setSearchTerm('')}
                                    />
                                )}
                            </Box>
                        )}
                    </Collapse>
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