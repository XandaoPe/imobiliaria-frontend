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
    GridRenderCellParams,
    GridRowSelectionModel,
    GridRowId
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
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

// Tipagens e Componentes
import { Empresa, EmpresaStatusFilter, EmpresaAdmFilter } from '../types/empresa';
import { EmpresaFormModal } from '../components/EmpresaFormModal';
import { useAuth } from '../contexts/AuthContext';
import { PerfisEnum } from '../types/usuario';

// --- Componente HighlightedText ---
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

const API_URL = 'http://192.168.1.5:5000/empresas';
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

    // FIX v7: Estado de seleção usando Set e 'include'
    const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
        type: 'include',
        ids: new Set<GridRowId>([])
    });

    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        createdAt: false,
        updatedAt: false,
    });

    const canAccess = user?.perfil === PerfisEnum.ADM_GERAL || user?.perfil === PerfisEnum.GERENTE;
    const canCreateAndDelete = user?.perfil === PerfisEnum.ADM_GERAL;

    // Contagem de selecionados
    const selectedCount = selectionModel.ids instanceof Set ? selectionModel.ids.size : 0;

    const fetchEmpresas = useCallback(async (
        search: string = '',
        status: EmpresaStatusFilter = 'TODAS',
        adm: EmpresaAdmFilter = 'TODAS'
    ) => {
        if (!canAccess) return;
        try {
            setLoading(true);
            const params: any = {};
            if (search.trim()) params.search = search;
            if (status !== 'TODAS') params.ativa = status;
            if (adm !== 'TODAS') params.isAdmGeral = adm;

            const response = await axios.get<Empresa[]>(API_URL, {
                params,
                headers: { Authorization: `Bearer ${user?.token}` }
            });

            setEmpresas(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Falha ao carregar empresas.');
            setEmpresas([]);
        } finally {
            setLoading(false);
        }
    }, [user?.token, canAccess]);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchText(searchText), DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [searchText]);

    useEffect(() => {
        fetchEmpresas(debouncedSearchText, filterStatus, filterAdm);
    }, [fetchEmpresas, debouncedSearchText, filterStatus, filterAdm]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorElFilter(event.currentTarget);
    const handleMenuClose = () => setAnchorElFilter(null);

    const handleBulkDelete = async () => {
        const ids = Array.from(selectionModel.ids || []) as string[];
        if (ids.length === 0) return;
        if (!window.confirm(`Deseja excluir as ${ids.length} empresas selecionadas?`)) return;

        try {
            await axios.post(`${API_URL}/delete-batch`, { ids }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setSelectionModel({ type: 'include', ids: new Set() });
            fetchEmpresas(debouncedSearchText, filterStatus, filterAdm);
            alert('Empresas excluídas com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro na exclusão em massa.');
        }
    };

    const columns: GridColDef<Empresa>[] = [
        {
            field: 'nome',
            headerName: 'Nome da Empresa',
            flex: 1,
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <Typography
                    variant="body2"
                    onClick={() => handleOpenEdit(params.row)}
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' },
                        // ADICIONE ESTAS LINHAS:
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                    }}
                >
                    <HighlightedText text={params.row.nome} highlight={debouncedSearchText} />
                </Typography>
            ),
        },
        {
            field: 'cnpj',
            headerName: 'CNPJ',
            width: 180,
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <HighlightedText text={params.row.cnpj} highlight={debouncedSearchText} />
            ),
        },
        {
            field: 'isAdmGeral',
            headerName: 'Tipo',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {params.row.isAdmGeral ? <CheckCircleIcon color="primary" fontSize="small" sx={{ mr: 1 }} /> : <CancelIcon color="disabled" fontSize="small" sx={{ mr: 1 }} />}
                    {params.row.isAdmGeral ? "Adm. Geral" : "Local"}
                </Box>
            )
        },
        {
            field: 'ativa',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {params.row.ativa ? <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} /> : <CancelIcon color="error" fontSize="small" sx={{ mr: 1 }} />}
                    {params.row.ativa ? "Ativa" : "Inativa"}
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <Box sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    height: '100%',
                }}>
                    <IconButton size="small" onClick={() => handleOpenEdit(params.row)} sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}>
                        <EditIcon fontSize='small' />
                    </IconButton>
                    {canCreateAndDelete && (
                        <IconButton size="small" onClick={() => handleDelete(params.row._id, params.row.nome)} sx={{ bgcolor: 'error.light', color: 'white', '&:hover': { bgcolor: 'error.main' } }}>
                            <DeleteIcon fontSize='small' />
                        </IconButton>
                    )}
                </Box>
            ),
        },
    ];

    const handleDelete = async (id: string, nome: string) => {
        if (!window.confirm(`Excluir empresa: "${nome}"?`)) return;
        try {
            await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${user?.token}` } });
            fetchEmpresas(debouncedSearchText, filterStatus, filterAdm);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir.');
        }
    };

    const handleOpenEdit = (empresa: Empresa) => { setEmpresaToEdit(empresa); setOpenModal(true); };
    const handleOpenCreate = () => { setEmpresaToEdit(null); setOpenModal(true); };

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Gestão de Empresas</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {selectedCount > 0 && canCreateAndDelete && (
                        <Button variant="contained" color="error" startIcon={<DeleteSweepIcon />} onClick={handleBulkDelete}>
                            Excluir ({selectedCount})
                        </Button>
                    )}
                    {canCreateAndDelete && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Nova Empresa</Button>
                    )}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    label="Pesquisar por Nome ou CNPJ"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                    }}
                />
                <Button variant="outlined" onClick={handleMenuOpen} startIcon={<FilterListIcon />} sx={{ height: 56 }}>
                    Filtros {selectedCount > 0 ? `(${selectedCount})` : ''}
                </Button>
                <Menu anchorEl={anchorElFilter} open={Boolean(anchorElFilter)} onClose={handleMenuClose}>
                    <ListSubheader>Status</ListSubheader>
                    <MenuItem onClick={() => { setFilterStatus('TODAS'); handleMenuClose(); }}>Todas</MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('true'); handleMenuClose(); }}>Ativas</MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('false'); handleMenuClose(); }}>Inativas</MenuItem>
                    <ListSubheader>Tipo</ListSubheader>
                    <MenuItem onClick={() => { setFilterAdm('TODAS'); handleMenuClose(); }}>Todos</MenuItem>
                    <MenuItem onClick={() => { setFilterAdm('true'); handleMenuClose(); }}>Adm. Geral</MenuItem>
                    <MenuItem onClick={() => { setFilterAdm('false'); handleMenuClose(); }}>Local</MenuItem>
                </Menu>
            </Box>

            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={empresas}
                    columns={columns}
                    loading={loading}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={(newModel) => setSelectionModel(newModel)}
                    rowSelectionModel={selectionModel}
                    getRowId={(row) => row._id}
                />
            </Paper>

            <EmpresaFormModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                empresaToEdit={empresaToEdit}
                onSuccess={() => fetchEmpresas(debouncedSearchText, filterStatus, filterAdm)}
            />
        </Container>
    );
};