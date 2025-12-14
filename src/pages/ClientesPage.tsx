import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper,
    TextField, InputAdornment, Tooltip, IconButton
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
import { Cliente, normalizeCPF, normalizeStatus } from '../types/cliente';
import SearchIcon from '@mui/icons-material/Search';

// ⭐️ NOVAS IMPORTAÇÕES PARA O FILTRO SEGMENTADO
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// ⚠️ Ajuste a URL base da sua API
const API_URL = 'http://localhost:5000/clientes';
const DEBOUNCE_DELAY = 300;

// Tipos para o filtro de status
type StatusFilter = 'TODOS' | 'ATIVO' | 'INATIVO';

interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

// Componente para Destaque
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
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    // ⭐️ NOVO ESTADO: Status de filtro
    const [filterStatus, setFilterStatus] = useState<StatusFilter>('TODOS');

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        cpf: false,
        perfil: false,
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    // ⭐️ ATUALIZAÇÃO: Receber o termo de busca e o status de filtro
    const fetchClientes = useCallback(async (search: string, status: StatusFilter) => {
        try {
            setLoading(true);

            // Monta os parâmetros de consulta
            const params: { search?: string; status?: string } = {};
            if (search) {
                params.search = search;
            }
            // Envia o status para a API, exceto se for 'TODOS'
            if (status !== 'TODOS') {
                params.status = status; // A API deve esperar 'ATIVO' ou 'INATIVO'
            }

            // Faz a requisição com os parâmetros
            const response = await axios.get(API_URL, { params });

            const clientesNormalizados = response.data.map((cliente: any) => ({
                ...cliente,
                status: normalizeStatus(cliente.status || 'ATIVO'),
                cpf: normalizeCPF(cliente.cpf || ''),
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

    // Efeito para debounce do campo de busca
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    // Efeito para buscar clientes quando o termo de busca OU o status de filtro muda
    useEffect(() => {
        fetchClientes(debouncedSearchText, filterStatus);
    }, [fetchClientes, debouncedSearchText, filterStatus]); // Depende do debouncedSearchText E do filterStatus

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    });

    // ⭐️ NOVO HANDLER: Atualiza o status e dispara a busca via useEffect
    const handleStatusChange = (
        event: React.MouseEvent<HTMLElement>,
        newStatus: StatusFilter | null,
    ) => {
        if (newStatus !== null) {
            setFilterStatus(newStatus);
        }
    };

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
            await axios.delete(`${API_URL}/${clienteId}`);
            // Recarrega com o termo de busca e o status atuais
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
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'cpf')
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
            renderCell: (params) => renderCellWithHighlight(params, 'telefone')
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

            {/* ⭐️ NOVO: Área de busca e filtros */}
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

                {/* ⭐️ NOVO COMPONENTE: ToggleButtonGroup para Filtro de Status */}
                <ToggleButtonGroup
                    value={filterStatus}
                    exclusive
                    onChange={handleStatusChange}
                    aria-label="Filtro de Status do Cliente"
                    size="medium"
                    sx={{ height: 56, borderColor: 'rgba(0, 0, 0, 0.23)' }} // Altura para alinhar com o TextField
                >
                    <ToggleButton value="TODOS" aria-label="Todos">
                        Todos
                    </ToggleButton>
                    <ToggleButton value="ATIVO" aria-label="Ativos">
                        Ativos
                    </ToggleButton>
                    <ToggleButton value="INATIVO" aria-label="Inativos">
                        Inativos
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            {/* Fim da área de busca e filtros */}

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
                    // Mostrar loading apenas se houver busca ou filtro
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