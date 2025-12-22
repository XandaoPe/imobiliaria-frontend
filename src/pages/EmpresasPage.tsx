// src/pages/EmpresasPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import {
    Container, Typography, Button, Box, Paper, TextField, InputAdornment, IconButton,
    Menu, MenuItem, ListSubheader
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
import api, { API_URL } from '../services/api';

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

    const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
        type: 'include',
        ids: new Set<GridRowId>([])
    });

    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        isAdmGeral: false,
        createdAt: false,
        updatedAt: false,
    });

    // Função de Máscara para Telefone
    const formatTelefoneForDisplay = (telefone: string | null | undefined): string => {
        if (!telefone) return '';
        const cleaned = telefone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    };

    const canAccess = user?.perfil === PerfisEnum.ADM_GERAL || user?.perfil === PerfisEnum.GERENTE;
    const canCreateAndDelete = user?.perfil === PerfisEnum.ADM_GERAL;

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

            const response = await api.get<Empresa[]>('/empresas', { params });

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

    const handleDelete = async (id: string, nome: string) => {
        if (!window.confirm(`Excluir empresa: "${nome}"?`)) return;
        try {
            await api.delete(`/empresas/${id}`);
            fetchEmpresas(debouncedSearchText, filterStatus, filterAdm);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir.');
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectionModel.ids || []) as string[];
        if (ids.length === 0) return;
        if (!window.confirm(`Deseja excluir as ${ids.length} empresas selecionadas?`)) return;

        try {
            await axios.post(`${API_URL}/empresas/delete-batch`, { ids }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setSelectionModel({ type: 'include', ids: new Set() });
            fetchEmpresas(debouncedSearchText, filterStatus, filterAdm);
            alert('Empresas excluídas com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro na exclusão em massa.');
        }
    };

    const handleOpenEdit = (empresa: Empresa) => { setEmpresaToEdit(empresa); setOpenModal(true); };
    const handleOpenCreate = () => { setEmpresaToEdit(null); setOpenModal(true); };

    const columns: GridColDef<Empresa>[] = useMemo(() => [
        {
            field: 'nome',
            headerName: 'Nome da Empresa',
            flex: 1,
            width: 250,
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <Typography
                    variant="body2"
                    onClick={() => handleOpenEdit(params.row)}
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' },
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
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <HighlightedText text={params.row.cnpj} highlight={debouncedSearchText} />
                </Box>
            ),
        },
        {
            field: 'fone',
            headerName: 'Telefone',
            width: 150,
            renderCell: (params: GridRenderCellParams<Empresa>) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <HighlightedText
                        text={formatTelefoneForDisplay(params.row.fone)}
                        highlight={debouncedSearchText}
                    />
                </Box>
            )
        },
        {
            field: 'isAdmGeral',
            headerName: 'Tipo',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
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
    ], [debouncedSearchText, canCreateAndDelete]);

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
                <Button
                    variant={filterStatus !== 'TODAS' || filterAdm !== 'TODAS' ? "contained" : "outlined"}
                    onClick={handleMenuOpen}
                    startIcon={<FilterListIcon />}
                    sx={{ height: 56, minWidth: 150 }}
                >
                    Filtros
                </Button>
                <Menu anchorEl={anchorElFilter} open={Boolean(anchorElFilter)} onClose={handleMenuClose}>
                    <ListSubheader>Status</ListSubheader>
                    <MenuItem onClick={() => { setFilterStatus('TODAS'); handleMenuClose(); }}>
                        <Box sx={{ width: 30, display: 'flex' }}>{filterStatus === 'TODAS' && <DoneIcon fontSize="small" color="primary" />}</Box>
                        Todas
                    </MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('true'); handleMenuClose(); }}>
                        <Box sx={{ width: 30, display: 'flex' }}>{filterStatus === 'true' && <DoneIcon fontSize="small" color="primary" />}</Box>
                        Ativas
                    </MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('false'); handleMenuClose(); }}>
                        <Box sx={{ width: 30, display: 'flex' }}>{filterStatus === 'false' && <DoneIcon fontSize="small" color="primary" />}</Box>
                        Inativas
                    </MenuItem>

                    <ListSubheader>Tipo</ListSubheader>
                    <MenuItem onClick={() => { setFilterAdm('TODAS'); handleMenuClose(); }}>
                        <Box sx={{ width: 30, display: 'flex' }}>{filterAdm === 'TODAS' && <DoneIcon fontSize="small" color="primary" />}</Box>
                        Todos
                    </MenuItem>
                    <MenuItem onClick={() => { setFilterAdm('true'); handleMenuClose(); }}>
                        <Box sx={{ width: 30, display: 'flex' }}>{filterAdm === 'true' && <DoneIcon fontSize="small" color="primary" />}</Box>
                        Adm. Geral
                    </MenuItem>
                    <MenuItem onClick={() => { setFilterAdm('false'); handleMenuClose(); }}>
                        <Box sx={{ width: 30, display: 'flex' }}>{filterAdm === 'false' && <DoneIcon fontSize="small" color="primary" />}</Box>
                        Local
                    </MenuItem>
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
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
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