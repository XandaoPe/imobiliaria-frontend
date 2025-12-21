import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Alert, ToggleButtonGroup, ToggleButton, Button, Container, useTheme, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Home as HomeIcon, FilterList as FilterIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImovelCard from '../components/ImovelCard';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // Importe o ícone de voltar
import { ImovelDetailsModal } from '../components/ImovelDetailsModal';

export const HomePage: React.FC = () => {
    const navigate = useNavigate(); // Hook para navegação
    const { user } = useAuth();
    const theme = useTheme();
    const token = user?.token || null;

    const [imoveis, setImoveis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('TODOS');
    const [selectedImovel, setSelectedImovel] = useState<any | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

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
            const url = token ? 'http://localhost:5000/imoveis' : 'http://localhost:5000/imoveis/publico';
            const response = await axios.get(url, {
                params: { search: searchTerm },
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            setImoveis(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }, [token, searchTerm]);

    // Lógica de Debounce
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
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
            <Box sx={{ bgcolor: 'background.paper', pt: 4, pb: 3, mb: 4, borderBottom: '1px solid #eee' }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
                        <Tooltip title="Voltar para a página inicial" arrow>
                            <IconButton
                                onClick={() => navigate('/')}
                                sx={{
                                    bgcolor: '#f1f3f4',
                                    '&:hover': { bgcolor: '#e8eaed' }
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>Catálogo</Typography>

                        <TextField
                            placeholder="Buscar cidade, título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                width: { xs: '100%', md: '450px' },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                    bgcolor: '#f1f3f4',
                                    '&.Mui-focused': { bgcolor: 'white' }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {searching ? <CircularProgress size={20} /> : <SearchIcon color="primary" />}
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <IconButton onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>
                                )
                            }}
                        />
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {filteredImoveis.map((imovel: any) => (
                        <Box key={imovel._id} sx={{ flex: '0 0 calc(33.333% - 16px)' }}>
                            <ImovelCard
                                imovel={imovel}
                                onClick={() => handleOpenModal(imovel)} // AGORA CHAMA A MODAL
                                searchTerm={searchTerm} // Passando o termo para o destaque
                            />
                        </Box>
                    ))}
                </Box>
            </Container>
            {selectedImovel && (
                <ImovelDetailsModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    imovel={selectedImovel}
                />
            )}
        </Box>
    );
};