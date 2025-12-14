// src/pages/UsuariosPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, TextField, InputAdornment, Tooltip, IconButton,
    Menu, MenuItem, ListSubheader // Importações para o menu
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
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
// ⭐️ NOVO: Ícones para o filtro
import FilterListIcon from '@mui/icons-material/FilterList';
import DoneIcon from '@mui/icons-material/Done';


// Remover importações de ToggleButton e ToggleButtonGroup

// Tipagens e Componente de Modal ATUALIZADOS
import { Usuario, PerfisEnum } from '../types/usuario';
import { UsuarioFormModal } from '../components/UsuarioFormModal';


// --- Componente HighlightedText (Reutilizado) ---
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

// Tipos para os Filtros
type UsuarioPerfilFilter = 'TODOS' | PerfisEnum;
type UsuarioStatusFilter = 'TODOS' | 'true' | 'false';

const API_URL = 'http://localhost:5000/usuarios';
const DEBOUNCE_DELAY = 300;

export const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    const [filterPerfil, setFilterPerfil] = useState<UsuarioPerfilFilter>('TODOS');
    const [filterStatus, setFilterStatus] = useState<UsuarioStatusFilter>('TODOS');

    // ⭐️ NOVO ESTADO: Âncora para o Menu de Filtro Único
    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        createdAt: false,
        updatedAt: false,
    });

    // Função de busca adaptada para Usuários, Perfil e Status (inalterada)
    const fetchUsuarios = useCallback(async (
        search: string = '',
        perfil: UsuarioPerfilFilter = 'TODOS',
        status: UsuarioStatusFilter = 'TODOS'
    ) => {
        try {
            setLoading(true);

            const params: { search?: string; perfil?: PerfisEnum; ativo?: string } = {};

            if (search.trim()) {
                params.search = search;
            }

            if (perfil !== 'TODOS') {
                params.perfil = perfil as PerfisEnum;
            }

            if (status !== 'TODOS') {
                params.ativo = status;
            }

            const response = await axios.get(API_URL, {
                params: params
            });

            setUsuarios(response.data as Usuario[]);
            setError(null);
        } catch (err: any) {
            let errorMessage = 'Falha ao carregar usuários.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setError(errorMessage);
            console.error("Erro ao buscar usuários:", err);
            setUsuarios([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Efeitos de debounce e busca (inalterados, mas agora dependem de filterStatus)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    useEffect(() => {
        fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus);
    }, [fetchUsuarios, debouncedSearchText, filterPerfil, filterStatus]);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    });

    // ⭐️ NOVO HANDLER: Abrir Menu
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElFilter(event.currentTarget);
    };

    // ⭐️ NOVO HANDLER: Fechar Menu
    const handleMenuClose = () => {
        setAnchorElFilter(null);
    };

    // ⭐️ HANDLER ATUALIZADO: Altera Perfil e fecha o menu
    const handleSetPerfil = (newPerfil: UsuarioPerfilFilter) => {
        setFilterPerfil(newPerfil);
        handleMenuClose();
    };

    // ⭐️ HANDLER ATUALIZADO: Altera Status e fecha o menu
    const handleSetStatus = (newStatus: UsuarioStatusFilter) => {
        setFilterStatus(newStatus);
        handleMenuClose();
    };

    // Função auxiliar para obter a descrição do perfil/status para o botão
    const getFilterSummary = () => {
        const perfilLabel = filterPerfil === 'TODOS' ? 'Todos Perfis' : getPerfilDisplay(filterPerfil as PerfisEnum);
        const statusLabel = filterStatus === 'TODOS' ? 'Todos Status' : (filterStatus === 'true' ? 'Ativos' : 'Inativos');

        if (filterPerfil === 'TODOS' && filterStatus === 'TODOS') {
            return 'Filtros (Nenhum)';
        }

        // Exemplo: Perfil: Gerente | Status: Ativos
        return `Perfil: ${perfilLabel.split('.')[0]} | Status: ${statusLabel}`;
    }

    const handleOpenCreate = () => {
        setUsuarioToEdit(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (usuario: Usuario) => {
        setUsuarioToEdit(usuario);
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setUsuarioToEdit(null);
    };

    const handleDelete = async (usuarioId: string, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o usuário: "${nome}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/${usuarioId}`);
            fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus);
            alert('Usuário excluído com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir usuário.');
        }
    };

    // Mapeamento de Perfis para exibição amigável (inalterado)
    const getPerfilDisplay = (perfil: PerfisEnum): string => {
        const perfilMap: Record<PerfisEnum, string> = {
            [PerfisEnum.ADM_GERAL]: 'Adm. Geral',
            [PerfisEnum.GERENTE]: 'Gerente',
            [PerfisEnum.CORRETOR]: 'Corretor',
            [PerfisEnum.SUPORTE]: 'Suporte',
        };
        return perfilMap[perfil] || perfil;
    };

    // Definição das colunas da DataGrid (inalteradas)
    const columns: GridColDef<Usuario>[] = [
        {
            field: '_id',
            headerName: 'ID',
            width: 90,
            hideable: true
        },
        {
            field: 'nome',
            headerName: 'Nome',
            width: 250,
            renderCell: (params: GridRenderCellParams<Usuario>) => (
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
            field: 'email',
            headerName: 'Email',
            width: 250,
            renderCell: (params: GridRenderCellParams<Usuario>) => (
                <HighlightedText
                    text={params.row.email}
                    highlight={debouncedSearchText}
                />
            ),
        },
        {
            field: 'perfil',
            headerName: 'Perfil',
            width: 150,
            valueGetter: (value, row) => getPerfilDisplay(row.perfil)
        },
        {
            field: 'ativo',
            headerName: 'Status',
            width: 130,
            valueGetter: (value, row) => row.ativo ? "Ativo" : "Inativo",
            cellClassName: (params) => {
                return params.row.ativo ? 'status-ativo' : 'status-inativo';
            }
        },
        {
            field: 'createdAt',
            headerName: 'Criação',
            width: 180,
            hideable: true,
            valueGetter: (value, row) => new Date(row.createdAt).toLocaleDateString('pt-BR')
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<Usuario>) => {
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
                        <Tooltip title="Editar Usuário" arrow>
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenEdit(params.row)}
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
    ];

    if (loading && !debouncedSearchText && filterPerfil === 'TODOS' && filterStatus === 'TODOS') {
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
                    onClick={() => fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus)}
                >
                    Tentar Novamente
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Cabeçalho e Botão Novo (inalterados) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gerenciamento de Usuários
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenCreate}
                >
                    Novo Usuário
                </Button>
            </Box>

            {/* ⭐️ ÁREA DE BUSCA E FILTROS ATUALIZADA */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>

                {/* Campo de Busca (inalterado) */}
                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        label="Pesquisar Usuários por Nome ou Email"
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

                {/* ⭐️ NOVO COMPONENTE: Botão de Filtro Único */}
                <Button
                    variant="outlined"
                    onClick={handleMenuOpen}
                    startIcon={<FilterListIcon />}
                    sx={{ height: 56, flexShrink: 0 }}
                >
                    {getFilterSummary()}
                </Button>

                {/* ⭐️ NOVO COMPONENTE: Menu Dropdown Único com Subdivisões */}
                <Menu
                    anchorEl={anchorElFilter}
                    open={Boolean(anchorElFilter)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >

                    {/* --- Seção de Filtro por Perfil --- */}
                    <ListSubheader disableSticky sx={{ fontWeight: 'bold' }}>
                        Filtrar por Perfil
                    </ListSubheader>

                    <MenuItem
                        onClick={() => handleSetPerfil('TODOS')}
                        selected={filterPerfil === 'TODOS'}
                    >
                        {filterPerfil === 'TODOS' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterPerfil !== 'TODOS' ? '24px' : 0 }}>Todos os Perfis</Box>
                    </MenuItem>

                    {Object.values(PerfisEnum).map((perfil) => (
                        <MenuItem
                            key={perfil}
                            onClick={() => handleSetPerfil(perfil)}
                            selected={filterPerfil === perfil}
                        >
                            {filterPerfil === perfil && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                            <Box sx={{ ml: filterPerfil !== perfil ? '24px' : 0 }}>
                                {getPerfilDisplay(perfil)}
                            </Box>
                        </MenuItem>
                    ))}

                    {/* --- Seção de Filtro por Status --- */}
                    <ListSubheader disableSticky sx={{ fontWeight: 'bold', mt: 1 }}>
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
                        onClick={() => handleSetStatus('true')}
                        selected={filterStatus === 'true'}
                    >
                        {filterStatus === 'true' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'true' ? '24px' : 0 }}>Ativo</Box>
                    </MenuItem>
                    <MenuItem
                        onClick={() => handleSetStatus('false')}
                        selected={filterStatus === 'false'}
                    >
                        {filterStatus === 'false' && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />}
                        <Box sx={{ ml: filterStatus !== 'false' ? '24px' : 0 }}>Inativo</Box>
                    </MenuItem>

                </Menu>
                {/* Fim da área de busca e filtros */}

            </Box>

            {/* DataGrid (inalterado) */}
            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={usuarios}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    checkboxSelection
                    disableRowSelectionOnClick
                    getRowId={(row) => row._id}
                    loading={loading}
                    sx={{
                        '& .status-ativo': {
                            color: 'success.main',
                            fontWeight: 'bold',
                        },
                        '& .status-inativo': {
                            color: 'error.main',
                            fontWeight: 'bold',
                        }
                    }}
                />
            </Paper>

            {/* Modal de Formulário */}
            <UsuarioFormModal
                open={openModal}
                onClose={handleClose}
                usuarioToEdit={usuarioToEdit}
                onSuccess={() => fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus)}
            />
        </Box>
    );
};