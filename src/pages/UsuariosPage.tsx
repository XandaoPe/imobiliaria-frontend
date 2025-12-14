// src/pages/UsuariosPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, TextField, InputAdornment, Tooltip, IconButton
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

// Importações para o filtro segmentado
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

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
// O filtro de status pode ser 'TODOS', 'true' (ativo) ou 'false' (inativo).
// Usamos string para representar o booleano, pois é assim que a query string lida com eles.
type UsuarioStatusFilter = 'TODOS' | 'true' | 'false';

const API_URL = 'http://localhost:5000/usuarios';
const DEBOUNCE_DELAY = 300;

export const UsuariosPage = () => {
    // ... Estados de Usuários, Loading, Erro e Modal (inalterados)
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    // Estado para o filtro de perfil
    const [filterPerfil, setFilterPerfil] = useState<UsuarioPerfilFilter>('TODOS');

    // ⭐️ NOVO ESTADO: Filtro de Status
    const [filterStatus, setFilterStatus] = useState<UsuarioStatusFilter>('TODOS');

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        createdAt: false,
        updatedAt: false,
    });

    // Função de busca adaptada para Usuários, Perfil e Status
    const fetchUsuarios = useCallback(async (
        search: string = '',
        perfil: UsuarioPerfilFilter = 'TODOS',
        status: UsuarioStatusFilter = 'TODOS' // ⭐️ NOVO PARÂMETRO
    ) => {
        try {
            setLoading(true);

            // ⭐️ ATUALIZADO: Tipo de params para incluir 'ativo' (string)
            const params: { search?: string; perfil?: PerfisEnum; ativo?: string } = {};

            if (search.trim()) {
                params.search = search;
            }

            // Filtro por Perfil
            if (perfil !== 'TODOS') {
                params.perfil = perfil as PerfisEnum;
            }

            // ⭐️ NOVO FILTRO: Status (ativo)
            if (status !== 'TODOS') {
                // Envia 'true' ou 'false' como string para a API
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

    // Efeito para debounce do campo de busca
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    // Dispara a busca quando o termo de busca DEBOUNCED, o perfil de filtro OU o status de filtro muda
    useEffect(() => {
        // ⭐️ NOVO: Inclui filterStatus no array de dependências e na chamada
        fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus);
    }, [fetchUsuarios, debouncedSearchText, filterPerfil, filterStatus]);

    // Efeito para manter o foco no campo de busca (opcional)
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    });

    // Handler: Atualiza o perfil de filtro e dispara a busca
    const handlePerfilChange = (
        event: React.MouseEvent<HTMLElement>,
        newPerfil: UsuarioPerfilFilter | null,
    ) => {
        if (newPerfil !== null) {
            setFilterPerfil(newPerfil);
        }
    };

    // ⭐️ NOVO HANDLER: Atualiza o status de filtro e dispara a busca
    const handleStatusChange = (
        event: React.MouseEvent<HTMLElement>,
        newStatus: UsuarioStatusFilter | null,
    ) => {
        if (newStatus !== null) {
            setFilterStatus(newStatus);
        }
    };

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
            // ⭐️ ATUALIZADO: Recarrega com todos os filtros atuais
            fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus);
            alert('Usuário excluído com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir usuário.');
        }
    };

    // Mapeamento de Perfis para exibição amigável
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
        // ... (colunas _id, nome, email, perfil, createdAt)

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
        // ... (tratamento de erro inalterado)
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

            {/* Área de busca e filtros */}
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

                {/* ToggleButtonGroup para Filtro de Perfil (inalterado) */}
                <ToggleButtonGroup
                    value={filterPerfil}
                    exclusive
                    onChange={handlePerfilChange}
                    aria-label="Filtro de Perfil do Usuário"
                    size="medium"
                    sx={{ height: 56, borderColor: 'rgba(0, 0, 0, 0.23)' }}
                >
                    <ToggleButton value="TODOS" aria-label="Todos os Perfis">
                        Todos Perfis
                    </ToggleButton>
                    <ToggleButton value={PerfisEnum.ADM_GERAL} aria-label="Administrador Geral">
                        Adm. Geral
                    </ToggleButton>
                    <ToggleButton value={PerfisEnum.GERENTE} aria-label="Gerente">
                        Gerente
                    </ToggleButton>
                    <ToggleButton value={PerfisEnum.CORRETOR} aria-label="Corretor">
                        Corretor
                    </ToggleButton>
                    <ToggleButton value={PerfisEnum.SUPORTE} aria-label="Suporte">
                        Suporte
                    </ToggleButton>
                </ToggleButtonGroup>

                {/* ⭐️ NOVO: ToggleButtonGroup para Filtro de Status (Ativo/Inativo/Todos) */}
                <ToggleButtonGroup
                    value={filterStatus}
                    exclusive
                    onChange={handleStatusChange}
                    aria-label="Filtro de Status do Usuário"
                    size="medium"
                    sx={{ height: 56, borderColor: 'rgba(0, 0, 0, 0.23)' }}
                >
                    <ToggleButton value="TODOS" aria-label="Todos os Status">
                        Todos Status
                    </ToggleButton>
                    <ToggleButton value="true" aria-label="Usuários Ativos">
                        Ativo
                    </ToggleButton>
                    <ToggleButton value="false" aria-label="Usuários Inativos">
                        Inativo
                    </ToggleButton>
                </ToggleButtonGroup>

            </Box>
            {/* Fim da área de busca e filtros */}

            {/* DataGrid (inalterado, mas usa o novo estado `loading`) */}
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
                onSuccess={() => fetchUsuarios(debouncedSearchText, filterPerfil, filterStatus)} // Recarrega com status
            />
        </Box>
    );
};