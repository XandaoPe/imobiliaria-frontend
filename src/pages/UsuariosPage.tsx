import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Button, CircularProgress, Paper, TextField, InputAdornment, IconButton, Menu, MenuItem, ListSubheader
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel,
    GridRenderCellParams,
    GridRowSelectionModel,
    GridRowId
} from '@mui/x-data-grid';

// Ícones
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

// Contexto, Tipagens e Componentes
import { useAuth } from '../contexts/AuthContext';
import { Usuario, PerfisEnum } from '../types/usuario';
import { UsuarioFormModal } from '../components/UsuarioFormModal';
import api from '../services/api';

// --- Componente de Destaque de Texto ---
const HighlightedText: React.FC<{ text: string | null | undefined; highlight: string }> = ({ text, highlight }) => {
    const textToDisplay = text ?? '';
    if (!textToDisplay.trim() || !highlight.trim()) return <>{textToDisplay}</>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = textToDisplay.split(regex);

    return (
        <Typography component="span" variant="body2">
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </Typography>
    );
};

type UsuarioPerfilFilter = 'TODOS' | PerfisEnum;
type UsuarioStatusFilter = 'TODOS' | 'true' | 'false';

const DEBOUNCE_DELAY = 300;

export const UsuariosPage = () => {
    const { user: usuarioLogado } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    const [filterPerfil, setFilterPerfil] = useState<UsuarioPerfilFilter>('TODOS');
    const [filterStatus, setFilterStatus] = useState<UsuarioStatusFilter>('TODOS');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // FIX v7: O estado agora usa 'include' e um Set para os IDs
    const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
        type: 'include',
        ids: new Set<GridRowId>([])
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        createdAt: false,
        updatedAt: false,
    });

    // Helper para contagem usando .size do Set
    const selectedCount = selectionModel.ids instanceof Set ? selectionModel.ids.size : 0;

    const getFilterLabel = () => (filterPerfil === 'TODOS' && filterStatus === 'TODOS' ? 'Filtros' : 'Filtrado');

    const fetchUsuarios = useCallback(async (
        search: string = '',
        perfil: UsuarioPerfilFilter = 'TODOS',
        status: UsuarioStatusFilter = 'TODOS'
    ) => {
        try {
            setLoading(true);
            const params: any = {};
            if (search.trim()) params.search = search;
            if (perfil !== 'TODOS') params.perfil = perfil;
            if (status !== 'TODOS') params.ativo = status;

            const response = await api.get('/usuarios', { params });
            const dataFormatted = (response.data as any[]).map(u => ({
                ...u,
                id: u.id || u._id
            }));

            setUsuarios(dataFormatted);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Falha ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchText(searchText), DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [searchText]);

    useEffect(() => {
        fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus);
    }, [fetchUsuarios, debouncedSearchText, filterPerfil, filterStatus]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleOpenCreate = () => { setUsuarioToEdit(null); setOpenModal(true); };
    const handleOpenEdit = (usuario: Usuario) => { setUsuarioToEdit(usuario); setOpenModal(true); };

    const handleDelete = async (usuarioId: string, nome: string) => {
        const idLogado = (usuarioLogado as any)?.id || (usuarioLogado as any)?._id;
        if (usuarioId === idLogado) {
            alert("Operação negada: Você não pode excluir sua própria conta.");
            return;
        }
        if (!window.confirm(`Deseja realmente excluir o usuário "${nome}"?`)) return;
        try {
            await api.delete(`/usuarios/${usuarioId}`);
            fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus);
            alert('Usuário excluído com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir usuário.');
        }
    };

    const handleBulkDelete = async () => {
        // Converte Set para Array para processamento e envio à API
        const idsSelecionados = Array.from(selectionModel.ids || []) as string[];

        if (idsSelecionados.length === 0) return;

        const idLogado = (usuarioLogado as any)?.id || (usuarioLogado as any)?._id;
        if (idsSelecionados.includes(idLogado)) {
            alert("Operação negada: Sua seleção contém sua própria conta logada.");
            return;
        }

        if (!window.confirm(`Deseja realmente excluir os ${idsSelecionados.length} usuários selecionados?`)) return;

        try {
            await api.post('/usuarios/delete-batch', { ids: idsSelecionados });
            // Reseta para o formato correto do v7
            setSelectionModel({ type: 'include', ids: new Set() });
            fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus);
            alert('Usuários excluídos com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro na exclusão em massa.');
        }
    };

    const columns: GridColDef<Usuario>[] = [
        {
            field: 'nome',
            headerName: 'Nome',
            flex: 1,
            renderCell: (params: GridRenderCellParams<Usuario>) => (
                <Typography
                    component="span"
                    variant="body2"
                    onClick={() => handleOpenEdit(params.row)}
                    sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                >
                    <HighlightedText text={params.row.nome} highlight={debouncedSearchText} />
                </Typography>
            ),
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 1,
            renderCell: (params: GridRenderCellParams<Usuario>) => (
                <HighlightedText text={params.row.email} highlight={debouncedSearchText} />
            ),
        },
        { field: 'perfil', headerName: 'Perfil', width: 150, valueGetter: (_, row) => row.perfil?.replace('_', ' ') || '' },
        {
            field: 'ativo',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => (
                <Typography variant="body2"
                    sx={{
                        fontWeight: 'bold',
                        color: params.row.ativo ? 'success.main' : 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                    }}>
                    {params.row.ativo ? 'Ativo' : 'Inativo'}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Usuario>) => {
                const idLinha = (params.row as any).id || (params.row as any)._id;
                const idLogado = (usuarioLogado as any)?.id || (usuarioLogado as any)?._id;
                const ehAutoExclusao = idLinha === idLogado;
                return (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(params.row)} color="primary"><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(idLinha, params.row.nome)} disabled={ehAutoExclusao} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                );
            },
        },
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Gestão de Usuários</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {selectedCount > 0 && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteSweepIcon />}
                            onClick={handleBulkDelete}
                        >
                            Excluir ({selectedCount})
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenCreate}>Novo Usuário</Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    label="Pesquisar..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    inputRef={searchInputRef}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">{loading ? <CircularProgress size={20} /> : <SearchIcon />}</InputAdornment>,
                    }}
                />
                <Button variant="outlined" onClick={handleMenuOpen} startIcon={<FilterListIcon />}>{getFilterLabel()}</Button>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <ListSubheader>Perfil</ListSubheader>
                    <MenuItem onClick={() => { setFilterPerfil('TODOS'); handleMenuClose(); }}>Todos</MenuItem>
                    {Object.values(PerfisEnum).map(p => <MenuItem key={p} onClick={() => { setFilterPerfil(p); handleMenuClose(); }}>{p}</MenuItem>)}
                </Menu>
            </Box>

            <Paper elevation={2} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={usuarios}
                    columns={columns}
                    loading={loading}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={(newModel) => setSelectionModel(newModel)}
                    rowSelectionModel={selectionModel}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    getRowId={(row) => row.id}
                />
            </Paper>

            <UsuarioFormModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                usuarioToEdit={usuarioToEdit}
                onSuccess={() => fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus)}
            />
        </Box>
    );
};