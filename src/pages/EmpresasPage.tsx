// src/pages/EmpresasPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    Container, Typography, Button, Box, Paper, TextField, InputAdornment, Tooltip, IconButton,
    CircularProgress, Alert, Menu, MenuItem, ListSubheader
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel,
    GridRenderCellParams
} from '@mui/x-data-grid';

// Ícones
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneIcon from '@mui/icons-material/Done';

// Tipagens e Componentes
import { Empresa, EmpresaStatusFilter, EmpresaAdmFilter } from '../types/empresa';
import { EmpresaFormModal } from '../components/EmpresaFormModal';
import { useAuth } from '../contexts/AuthContext';
import { PerfisEnum } from '../types/usuario';

// --- Componente HighlightedText (Reutilizado) ---
interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

// Reutilização do componente HighlightedText para busca
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
// FIM - HighlightedText

const API_URL = 'http://localhost:5000/empresas';
const DEBOUNCE_DELAY = 300;

export const EmpresasPage: React.FC = () => {
    const { user } = useAuth();
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [empresaToEdit, setEmpresaToEdit] = useState<Empresa | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    const [filterStatus, setFilterStatus] = useState<EmpresaStatusFilter>('TODAS');
    const [filterAdm, setFilterAdm] = useState<EmpresaAdmFilter>('TODAS');

    // Estado para o Menu de Filtro Único
    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        createdAt: false,
        updatedAt: false,
    });

    // Usuário deve ser ADM_GERAL ou GERENTE para acessar
    const canAccess = user?.perfil === PerfisEnum.ADM_GERAL || user?.perfil === PerfisEnum.GERENTE;
    // Usuário deve ser ADM_GERAL para criar/deletar
    const canCreateAndDelete = user?.perfil === PerfisEnum.ADM_GERAL;

    // Função de busca principal
    const fetchEmpresas = useCallback(async (
        search: string = '',
        status: EmpresaStatusFilter = 'TODAS',
        adm: EmpresaAdmFilter = 'TODAS'
    ) => {
        if (!canAccess) return;

        try {
            setLoading(true);

            const params: { search?: string; ativa?: string; isAdmGeral?: string } = {};

            if (search.trim()) {
                params.search = search; // O backend procura por nome ou CNPJ
            }
            if (status !== 'TODAS') {
                params.ativa = status; // 'true' ou 'false'
            }
            if (adm !== 'TODAS') {
                params.isAdmGeral = adm; // 'true' ou 'false'
            }

            const headers = {
                Authorization: `Bearer ${user?.token}`,
            };

            const response = await axios.get<Empresa[]>(API_URL, {
                params: params,
                headers: headers
            });

            setEmpresas(response.data);
            setError(null);
        } catch (err: any) {
            let errorMessage = 'Falha ao carregar empresas.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setError(errorMessage);
            console.error("Erro ao buscar empresas:", err);
            setEmpresas([]);
        } finally {
            setLoading(false);
        }
    }, [user?.token, canAccess]);

    // Efeitos de debounce e busca
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    useEffect(() => {
        fetchEmpresas(debouncedSearchText, filterStatus, filterAdm);
    }, [fetchEmpresas, debouncedSearchText, filterStatus, filterAdm]);

    // Manipuladores de Filtro
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElFilter(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorElFilter(null);
    };

    const handleSetStatus = (newStatus: EmpresaStatusFilter) => {
        setFilterStatus(newStatus);
        handleMenuClose();
    };

    const handleSetAdm = (newAdm: EmpresaAdmFilter) => {
        setFilterAdm(newAdm);
        handleMenuClose();
    };

    const getFilterSummary = () => {
        const statusLabel = filterStatus === 'TODAS' ? 'Todos Status' : (filterStatus === 'true' ? 'Ativas' : 'Inativas');
        const admLabel = filterAdm === 'TODAS' ? 'Todas Adm.' : (filterAdm === 'true' ? 'Adm. Geral' : 'Adm. Local');

        if (filterStatus === 'TODAS' && filterAdm === 'TODAS') {
            return 'Filtros (Nenhum)';
        }

        return `Status: ${statusLabel} | Tipo: ${admLabel}`;
    }

    // Manipuladores de CRUD
    const handleOpenCreate = () => {
        if (!canCreateAndDelete) {
            alert('Apenas usuários Administradores Gerais podem criar empresas.');
            return;
        }
        setEmpresaToEdit(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (empresa: Empresa) => {
        setEmpresaToEdit(empresa);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEmpresaToEdit(null);
    };

    const handleDelete = async (empresaId: string, nome: string) => {
        if (!canCreateAndDelete) {
            alert('Apenas usuários Administradores Gerais podem excluir empresas.');
            return;
        }

        if (!window.confirm(`Tem certeza que deseja excluir a empresa: "${nome}"?`)) {
            return;
        }

        try {
            const headers = {
                Authorization: `Bearer ${user?.token}`,
            };
            await axios.delete(`${API_URL}/${empresaId}`, { headers });

            fetchEmpresas(debouncedSearchText, filterStatus, filterAdm);
            alert(`Empresa "${nome}" excluída com sucesso!`);

        } catch (err: any) {
            console.error("Erro ao deletar empresa:", err);
            alert(err.response?.data?.message || 'Erro ao excluir empresa.');
        }
    };

    // Definição das colunas da DataGrid
    const columns: GridColDef<Empresa>[] = [
        {
            field: 'nome',
            headerName: 'Nome da Empresa',
            minWidth: 250,
            flex: 1,
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <Typography
                    component="span"
                    variant="body2"
                    onClick={() => handleOpenEdit(params.row)}
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                            textDecoration: 'underline'
                        }
                    }}
                >
                    <HighlightedText
                        text={params.row.nome}
                        highlight={debouncedSearchText}
                    />
                </Typography>
            ),
        },
        {
            field: 'cnpj',
            headerName: 'CNPJ',
            width: 180,
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <HighlightedText
                    text={params.row.cnpj}
                    highlight={debouncedSearchText}
                />
            ),
        },
        {
            field: 'isAdmGeral',
            headerName: 'Tipo',
            width: 150,
            valueGetter: (value, row) => row.isAdmGeral ? "Adm. Geral" : "Local",
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <Tooltip title={params.row.isAdmGeral ? "Empresa de Administração Geral" : "Empresa Local"}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {params.row.isAdmGeral ?
                            <CheckCircleIcon color="primary" fontSize="small" sx={{ mr: 1 }} /> :
                            <CancelIcon color="disabled" fontSize="small" sx={{ mr: 1 }} />
                        }
                        {params.row.isAdmGeral ? "Adm. Geral" : "Local"}
                    </Box>
                </Tooltip>
            )
        },
        {
            field: 'ativa',
            headerName: 'Status',
            width: 150,
            valueGetter: (value, row) => row.ativa ? "Ativa" : "Inativa",
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <Tooltip title={params.row.ativa ? "Empresa Ativa" : "Empresa Inativa"}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {params.row.ativa ?
                            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} /> :
                            <CancelIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                        }
                        {params.row.ativa ? "Ativa" : "Inativa"}
                    </Box>
                </Tooltip>
            )
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Empresa>) => {
                return (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Tooltip title="Editar Empresa" arrow>
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenEdit(params.row)}
                                sx={{
                                    bgcolor: 'primary.light',
                                    '&:hover': { bgcolor: 'primary.main' },
                                    color: 'white'
                                }}
                            >
                                <EditIcon fontSize='small' />
                            </IconButton>
                        </Tooltip>

                        {canCreateAndDelete && (
                            <Tooltip title={`Excluir: ${params.row.nome}`} arrow>
                                <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleDelete(params.row._id, params.row.nome)}
                                    sx={{
                                        bgcolor: 'error.light',
                                        '&:hover': { bgcolor: 'error.main' },
                                        color: 'white'
                                    }}
                                >
                                    <DeleteIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                );
            },
        },
    ];

    if (!canAccess) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Você não tem permissão para visualizar a gestão de empresas.</Alert>
            </Container>
        );
    }

    if (loading && !debouncedSearchText && filterStatus === 'TODAS' && filterAdm === 'TODAS') {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button
                    variant="contained"
                    onClick={() => fetchEmpresas(debouncedSearchText, filterStatus, filterAdm)}
                >
                    Tentar Novamente
                </Button>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            {/* Cabeçalho e Botão Novo */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestão de Empresas
                </Typography>
                {canCreateAndDelete && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                    >
                        Nova Empresa
                    </Button>
                )}
            </Box>

            {/* Área de Busca e Filtros */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>

                {/* Campo de Busca */}
                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        label="Pesquisar Empresas por Nome ou CNPJ"
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
                        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                </Box>

                {/* Botão de Filtro Único */}
                <Button
                    variant="outlined"
                    onClick={handleMenuOpen}
                    startIcon={<FilterListIcon />}
                    sx={{ height: 56, flexShrink: 0 }}
                >
                    {getFilterSummary()}
                </Button>

                {/* Menu Dropdown Único com Subdivisões */}
                <Menu
                    anchorEl={anchorElFilter}
                    open={Boolean(anchorElFilter)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >

                    {/* --- Seção de Filtro por Status --- */}
                    <ListSubheader disableSticky sx={{ fontWeight: 'bold' }}>
                        Filtrar por Status
                    </ListSubheader>

                    <MenuItem onClick={() => handleSetStatus('TODAS')} selected={filterStatus === 'TODAS'}>
                        {filterStatus === 'TODAS' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'TODAS' ? '24px' : 0 }}>Todas as Empresas</Box>
                    </MenuItem>
                    <MenuItem onClick={() => handleSetStatus('true')} selected={filterStatus === 'true'}>
                        {filterStatus === 'true' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'true' ? '24px' : 0 }}>Ativas</Box>
                    </MenuItem>
                    <MenuItem onClick={() => handleSetStatus('false')} selected={filterStatus === 'false'}>
                        {filterStatus === 'false' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'false' ? '24px' : 0 }}>Inativas</Box>
                    </MenuItem>

                    {/* --- Seção de Filtro por Tipo de Administração --- */}
                    <ListSubheader disableSticky sx={{ fontWeight: 'bold', mt: 1 }}>
                        Filtrar por Tipo
                    </ListSubheader>

                    <MenuItem onClick={() => handleSetAdm('TODAS')} selected={filterAdm === 'TODAS'}>
                        {filterAdm === 'TODAS' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterAdm !== 'TODAS' ? '24px' : 0 }}>Todos os Tipos</Box>
                    </MenuItem>
                    <MenuItem onClick={() => handleSetAdm('true')} selected={filterAdm === 'true'}>
                        {filterAdm === 'true' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterAdm !== 'true' ? '24px' : 0 }}>Administração Geral</Box>
                    </MenuItem>
                    <MenuItem onClick={() => handleSetAdm('false')} selected={filterAdm === 'false'}>
                        {filterAdm === 'false' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterAdm !== 'false' ? '24px' : 0 }}>Empresa Local</Box>
                    </MenuItem>

                </Menu>
                {/* Fim da área de busca e filtros */}

            </Box>

            {/* DataGrid */}
            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={empresas}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    checkboxSelection
                    disableRowSelectionOnClick
                    getRowId={(row) => row._id}
                    loading={loading}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 10 },
                        },
                        sorting: {
                            sortModel: [{ field: 'nome', sort: 'asc' }],
                        },
                    }}
                />
            </Paper>

            {/* Modal de Formulário */}
            <EmpresaFormModal
                open={openModal}
                onClose={handleCloseModal}
                empresaToEdit={empresaToEdit}
                onSuccess={() => fetchEmpresas(debouncedSearchText, filterStatus, filterAdm)}
            />
        </Container>
    );
};