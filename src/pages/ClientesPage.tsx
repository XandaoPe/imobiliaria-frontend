import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper,
    TextField, InputAdornment, Tooltip, IconButton,
    Menu, MenuItem, ListSubheader
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel,
    GridRenderCellParams
} from '@mui/x-data-grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ClienteFormModal } from '../components/ClienteFormModal';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// ⭐️ Ajuste a importação se necessário, mas mantenha normalizeCPF e normalizeStatus
import { Cliente, normalizeCPF, normalizeStatus } from '../types/cliente';
import SearchIcon from '@mui/icons-material/Search';

import FilterListIcon from '@mui/icons-material/FilterList';
import DoneIcon from '@mui/icons-material/Done';
import api, { API_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DEBOUNCE_DELAY = 300;

type StatusFilter = 'TODOS' | 'ATIVO' | 'INATIVO';

interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

// Componente para Destaque (inalterado)
const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
    const textToDisplay = text ?? '';
    if (!textToDisplay.trim() || !highlight.trim()) {
        return <>{textToDisplay}</>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = textToDisplay.split(regex);

    return (
        <Typography component="span" variant="body2">
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

export const ClientesPage = () => {
    const { isAuthenticated, user } = useAuth();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    const [filterStatus, setFilterStatus] = useState<StatusFilter>('TODOS');

    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        cpf: false,
        perfil: false,
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    // ⭐️ NOVA FUNÇÃO: Máscara para Telefone (a ser usada na DataGrid)
    const formatTelefoneForDisplay = (telefone: string | null | undefined): string => {
        if (!telefone) return '';
        const cleaned = telefone.replace(/\D/g, '');

        // (XX) XXXXX-XXXX (11 dígitos: celular com 9º dígito)
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }

        // (XX) XXXX-XXXX (10 dígitos: fixo ou celular antigo)
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }

        return telefone; // Retorna o valor original se não for 10 ou 11 dígitos
    };


    const fetchClientes = useCallback(async (search: string, status: StatusFilter) => {
        try {
            setLoading(true);

            const params: { search?: string; status?: string } = {};
            if (search) {
                params.search = search;
            }
            if (status !== 'TODOS') {
                params.status = status;
            }

            const response = await api.get('/clientes', { params });
            const clientesNormalizados = response.data.map((cliente: any) => ({
                ...cliente,
                // Garantir que os campos que aceitam null/undefined sejam tratados
                status: normalizeStatus(cliente.status || 'ATIVO'),
                cpf: normalizeCPF(cliente.cpf || ''),
                telefone: cliente.telefone || null, // Manter o telefone limpo (só dígitos) aqui
            }));

            setClientes(clientesNormalizados as Cliente[]);
            setError(null);
        } catch (err: any) {
            let errorMessage = 'Falha ao carregar clientes.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setError(errorMessage);
            console.error("Erro ao buscar clientes:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // ⭐️ Só busca se estiver autenticado para evitar disparar 401 desnecessário
        if (isAuthenticated && user) {
            fetchClientes(debouncedSearchText, filterStatus);
        }
    }, [fetchClientes, debouncedSearchText, filterStatus, isAuthenticated, user]);

    // ... (Efeitos de Debounce e Busca inalterados)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    useEffect(() => {
        fetchClientes(debouncedSearchText, filterStatus);
    }, [fetchClientes, debouncedSearchText, filterStatus]);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    });


    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElFilter(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorElFilter(null);
    };

    const handleSetStatus = (newStatus: StatusFilter) => {
        setFilterStatus(newStatus);
        handleMenuClose();
    };

    const getFilterSummary = () => {
        const statusMap: Record<StatusFilter, string> = {
            'TODOS': 'Todos Status',
            'ATIVO': 'Ativos',
            'INATIVO': 'Inativos',
        };
        const statusLabel = statusMap[filterStatus] || 'Status';

        return filterStatus === 'TODOS' ? 'Filtros (Status: Todos)' : `Filtros (Status: ${statusLabel})`;
    }

    const handleOpenCreate = () => {
        setClienteToEdit(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (cliente: Cliente) => {
        setClienteToEdit(cliente);
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setClienteToEdit(null);
    };

    const handleDelete = async (clienteId: string, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o cliente "${nome}"?`)) {
            return;
        }

        try {
            await api.delete(`/clientes/${clienteId}`);
            fetchClientes(debouncedSearchText, filterStatus);
            alert(`Cliente ${nome} excluído com sucesso!`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir cliente.');
        }
    };

    const renderCellWithHighlight = (params: any, field: keyof Cliente) => (
        <HighlightedText
            text={params.row[field]}
            highlight={debouncedSearchText}
        />
    );

    const columns: GridColDef[] = useMemo(() => [
        { field: '_id', headerName: 'ID', width: 90 },
        {
            field: 'nome',
            headerName: 'Nome Completo',
            width: 250,
            editable: false,
            renderCell: (params) => (
                <Typography
                    component="span"
                    variant="body2"
                    onClick={() => handleOpenEdit(params.row as Cliente)}
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                            textDecoration: 'underline'
                        }
                    }}
                >
                    {renderCellWithHighlight(params, 'nome')}
                </Typography>
            ),
        },
        {
            field: 'cpf',
            headerName: 'CPF',
            width: 150,
            renderCell: (params) => {
                const rawCpf = params.row.cpf || '';
                // Máscara simples: 000.000.000-00
                const formattedCpf = rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

                return (
                    <HighlightedText
                        text={formattedCpf}
                        highlight={debouncedSearchText}
                    />
                );
            }
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'email')
        },
        {
            field: 'telefone',
            headerName: 'Telefone',
            width: 150,
            editable: false,
            // ⭐️ IMPLEMENTAÇÃO DA MÁSCARA AQUI
            renderCell: (params) => {
                const rawPhone = params.row.telefone; // Deve ser só dígitos
                const formattedPhone = formatTelefoneForDisplay(rawPhone);

                // Aplicamos o highlight no número LIMPO, mas exibimos o formatado.
                // Isso requer um ajuste no HighlightedText ou aceitar que o highlight será no texto formatado.
                // Para simplificar e manter o HighlightedText, vamos passá-lo formatado:
                return (
                    <HighlightedText
                        text={formattedPhone}
                        highlight={debouncedSearchText}
                    />
                );
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'status'),
            valueGetter: (value) => value === 'ATIVO' ? 'ATIVO' : 'INATIVO',
            cellClassName: (params) => {
                return params.row.status === 'ATIVO' ? 'status-disponivel' : 'status-indisponivel';
            }
        },
        {
            field: 'perfil',
            headerName: 'Tipo',
            width: 130,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'perfil')
        },
        {
            field: 'observacoes',
            headerName: 'Observações',
            width: 200,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'observacoes')
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 150,
            sortable: false,
            filterable: false,
            type: 'actions',
            renderCell: (params: GridRenderCellParams<Cliente>) => {
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%'
                        }}
                    >

                        {/* TOOLTIP para EDIÇÃO */}
                        <Tooltip title={`Editar: ${params.row.nome}`} arrow>
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenEdit(params.row as Cliente)}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'primary.main',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    }
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>

                        {/* TOOLTIP para EXCLUSÃO */}
                        <Tooltip title={`Excluir: ${params.row.nome}`} arrow>
                            <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(params.row._id, params.row.nome)}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'error.main',
                                    '&:hover': {
                                        bgcolor: 'error.dark',
                                    }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ], [debouncedSearchText, handleDelete]);

    if (loading && !debouncedSearchText && filterStatus === 'TODOS') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button
                    variant="contained"
                    onClick={() => fetchClientes(debouncedSearchText, filterStatus)}
                >
                    Tentar Novamente
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gerenciamento de Clientes
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenCreate}
                >
                    Novo Cliente
                </Button>
            </Box>

            {/* ⭐️ ÁREA DE BUSCA E FILTROS ATUALIZADA */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        label="Pesquisar Clientes por Nome, CPF, Email, Telefone ou Observação"
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
                        disabled={loading && !searchText}
                    />
                </Box>

                {/* ⭐️ Botão de Filtro Único */}
                <Button
                    variant="outlined"
                    onClick={handleMenuOpen}
                    startIcon={<FilterListIcon />}
                    sx={{ height: 56, flexShrink: 0 }}
                >
                    {getFilterSummary()}
                </Button>

                {/* ⭐️ Menu Dropdown Único para Status */}
                <Menu
                    anchorEl={anchorElFilter}
                    open={Boolean(anchorElFilter)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >

                    <ListSubheader disableSticky sx={{ fontWeight: 'bold' }}>
                        Filtrar por Status
                    </ListSubheader>

                    <MenuItem
                        onClick={() => handleSetStatus('TODOS')}
                        selected={filterStatus === 'TODOS'}
                    >
                        {filterStatus === 'TODOS' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'TODOS' ? '24px' : 0 }}>Todos os Status</Box>
                    </MenuItem>

                    <MenuItem
                        onClick={() => handleSetStatus('ATIVO')}
                        selected={filterStatus === 'ATIVO'}
                    >
                        {filterStatus === 'ATIVO' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'ATIVO' ? '24px' : 0 }}>Ativos</Box>
                    </MenuItem>

                    <MenuItem
                        onClick={() => handleSetStatus('INATIVO')}
                        selected={filterStatus === 'INATIVO'}
                    >
                        {filterStatus === 'INATIVO' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'INATIVO' ? '24px' : 0 }}>Inativos</Box>
                    </MenuItem>

                </Menu>
                {/* Fim da área de busca e filtros */}

            </Box>

            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={clientes}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    checkboxSelection
                    disableRowSelectionOnClick
                    getRowId={(row) => row._id}
                    loading={loading}
                    sx={{
                        '& .status-disponivel': {
                            color: 'success.main',
                            fontWeight: 'bold',
                        },
                        '& .status-indisponivel': {
                            color: 'error.main',
                            fontWeight: 'bold',
                        }
                    }}
                />
            </Paper>

            <ClienteFormModal
                open={openModal}
                onClose={handleClose}
                clienteToEdit={clienteToEdit}
                onSuccess={() => fetchClientes(debouncedSearchText, filterStatus)}
            />
        </Box>
    );
};