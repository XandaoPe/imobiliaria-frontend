import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Typography, Button, Paper, Tooltip, IconButton, Chip,
    TextField, InputAdornment, CircularProgress, Menu, MenuItem, ListSubheader
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import HandshakeIcon from '@mui/icons-material/Handshake';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DoneIcon from '@mui/icons-material/Done';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import api from '../services/api';
import { Negociacao, getStatusLabel, StatusNegociacao } from '../types/negociacao';
import { NegociacaoDetailsModal } from '../components/NegociacaoDetailsModal';
import { NegociacaoFormModal } from '../components/NegociacaoFormModal';

const DEBOUNCE_DELAY = 300;

interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
    const textToDisplay = text ?? '';
    if (!textToDisplay.trim() || !highlight.trim()) {
        return <>{textToDisplay}</>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = textToDisplay.split(regex);

    return (
        <Typography component="span" variant="inherit">
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </Typography>
    );
};

export const NegociacaoPage = () => {
    const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
    const [openDetails, setOpenDetails] = useState(false);
    const [openForm, setOpenForm] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<StatusNegociacao | 'TODOS'>('TODOS');
    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const fetchNegociacoes = useCallback(async (search: string, status: string) => {
        try {
            setLoading(true);
            const params: any = {};
            if (search) params.search = search;
            if (status !== 'TODOS') params.status = status;

            const response = await api.get('/negociacoes', { params });
            setNegociacoes(response.data);
        } catch (err: any) {
            console.error('Falha ao carregar negociações.', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [searchText]);

    useEffect(() => {
        fetchNegociacoes(debouncedSearchText, filterStatus);
    }, [fetchNegociacoes, debouncedSearchText, filterStatus]);

    useEffect(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
    }, []);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorElFilter(event.currentTarget);
    const handleMenuClose = () => setAnchorElFilter(null);

    const handleSetStatus = (status: StatusNegociacao | 'TODOS') => {
        setFilterStatus(status);
        handleMenuClose();
    };

    const handleOpenDetails = useCallback((negociacao: Negociacao) => {
        setSelectedNegociacao(negociacao);
        setOpenDetails(true);
    }, []);

    const getStatusColor = (status: StatusNegociacao): "success" | "error" | "warning" | "secondary" | "primary" => {
        switch (status) {
            case 'FECHADO': return 'success';
            case 'PERDIDO': return 'error';
            case 'PROPOSTA': return 'warning';
            case 'VISITA': return 'secondary';
            default: return 'primary';
        }
    };

    const columns: GridColDef<Negociacao>[] = useMemo(() => [
        {
            field: 'codigo',
            headerName: 'Código',
            width: 220, // Aumentado significativamente (de 170 para 220)
            renderCell: (params) => (
                params.row.codigo && (
                    <Chip
                        icon={<ReceiptLongIcon sx={{ fontSize: '1.1rem !important' }} />}
                        label={params.row.codigo}
                        size="medium"
                        color="primary"
                        variant="filled"
                        sx={{
                            fontSize: '0.95rem',
                            fontWeight: '800', // Extra bold para o código
                            height: 34,
                            borderRadius: '8px',
                            px: 1.5,
                            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                )
            )
        },
        {
            field: 'cliente',
            headerName: 'Cliente / Lead',
            flex: 0.7, // Ajustado para dar mais espaço ao código
            minWidth: 170,
            renderCell: (params) => (
                <Box
                    onClick={() => handleOpenDetails(params.row)}
                    sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%'
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'primary.main',
                            fontWeight: '700',
                            lineHeight: 1.2,
                            '&:hover': { textDecoration: 'underline' }
                        }}
                    >
                        <HighlightedText
                            text={params.row.cliente?.nome}
                            highlight={debouncedSearchText}
                        />
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {params.row.cliente?.email || 'Sem e-mail'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'imovel',
            headerName: 'Imóvel e Localização',
            flex: 1, // Ajustado para equilibrar com o novo código
            minWidth: 220,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.1, fontSize: '0.8rem' }}>
                        <HighlightedText
                            text={params.row.imovel?.titulo}
                            highlight={debouncedSearchText}
                        />
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1, fontSize: '0.7rem' }}>
                        <HighlightedText
                            text={params.row.imovel?.endereco}
                            highlight={debouncedSearchText}
                        />
                    </Typography>
                </Box>
            )
        },
        {
            field: 'tipo',
            headerName: 'Interesse',
            width: 90,
            renderCell: (params) => (
                <Chip
                    label={params.row.tipo}
                    variant="outlined"
                    size="small"
                    color={params.row.tipo === 'VENDA' ? 'success' : 'info'}
                    sx={{ fontSize: '0.65rem', height: 18 }}
                />
            )
        },
        {
            field: 'status',
            headerName: 'Fase do Funil',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={getStatusLabel(params.row.status)}
                    color={getStatusColor(params.row.status)}
                    size="small"
                    sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 22 }}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 60,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Tooltip title="Ver Detalhes / Histórico">
                    <IconButton color="primary" onClick={() => handleOpenDetails(params.row)} size="small">
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )
        }
    ], [handleOpenDetails, debouncedSearchText]);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        Negociações
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie seus leads e o progresso das vendas/aluguéis
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={<HandshakeIcon />}
                    onClick={() => setOpenForm(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Nova Negociação
                </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        label="Pesquisar por Código, Cliente ou Imóvel"
                        variant="outlined"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        inputRef={searchInputRef}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {loading && searchText ? <CircularProgress size={20} /> : <SearchIcon />}
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <Button
                    variant="outlined"
                    onClick={handleMenuOpen}
                    startIcon={<FilterListIcon />}
                    sx={{ height: 56, flexShrink: 0 }}
                >
                    {filterStatus === 'TODOS' ? 'Todas as Fases' : `Fase: ${getStatusLabel(filterStatus as StatusNegociacao)}`}
                </Button>

                <Menu
                    anchorEl={anchorElFilter}
                    open={Boolean(anchorElFilter)}
                    onClose={handleMenuClose}
                >
                    <ListSubheader sx={{ fontWeight: 'bold' }}>Filtrar por Fase</ListSubheader>
                    <MenuItem onClick={() => handleSetStatus('TODOS')} selected={filterStatus === 'TODOS'}>
                        {filterStatus === 'TODOS' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'TODOS' ? '24px' : 0 }}>Todas as Fases</Box>
                    </MenuItem>
                    {(['PROSPECCAO', 'VISITA', 'PROPOSTA', 'FECHADO', 'PERDIDO'] as StatusNegociacao[]).map((s) => (
                        <MenuItem key={s} onClick={() => handleSetStatus(s)} selected={filterStatus === s}>
                            {filterStatus === s && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                            <Box sx={{ ml: filterStatus !== s ? '24px' : 0 }}>{getStatusLabel(s)}</Box>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>

            <Paper elevation={4} sx={{ height: 650, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
                <DataGrid
                    rows={negociacoes}
                    columns={columns}
                    getRowId={(row) => row._id || Math.random()}
                    loading={loading}
                    disableRowSelectionOnClick
                    rowHeight={85} // Aumentado para acomodar o código maior
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'bold'
                        }
                    }}
                />
            </Paper>

            <NegociacaoDetailsModal
                open={openDetails}
                negociacao={selectedNegociacao}
                onClose={() => {
                    setOpenDetails(false);
                    setSelectedNegociacao(null);
                }}
                onUpdate={() => fetchNegociacoes(debouncedSearchText, filterStatus)}
            />

            <NegociacaoFormModal
                open={openForm}
                onClose={() => setOpenForm(false)}
                onSuccess={() => {
                    setOpenForm(false);
                    fetchNegociacoes(debouncedSearchText, filterStatus);
                }}
            />
        </Box>
    );
};