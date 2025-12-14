import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper,
    TextField, InputAdornment, Tooltip, IconButton // ⭐️ Adicionado Tooltip e IconButton
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel,
    GridRenderCellParams // ⭐️ Adicionado para tipar o renderCell na coluna actions
} from '@mui/x-data-grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ClienteFormModal } from '../components/ClienteFormModal';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Cliente, normalizeCPF, normalizeStatus } from '../types/cliente';
import SearchIcon from '@mui/icons-material/Search';

// ⚠️ Ajuste a URL base da sua API
const API_URL = 'http://localhost:5000/clientes';
const DEBOUNCE_DELAY = 300;

interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

// Componente para Destaque (Mantido o original, mas ajustando a tipagem)
const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
    const textToDisplay = text ?? ''; // Garante que é uma string ('') se for null

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

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        cpf: false,
        perfil: false,
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    const fetchClientes = useCallback(async (search: string) => {
        try {
            setLoading(true);

            const url = search ? `${API_URL}?search=${encodeURIComponent(search)}` : API_URL;
            const response = await axios.get(url);

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

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    useEffect(() => {
        fetchClientes(debouncedSearchText);
    }, [fetchClientes, debouncedSearchText]);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    });

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

    // ⭐️ ATUALIZADO: Lógica de confirmação de exclusão mantida
    const handleDelete = async (clienteId: string, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o cliente "${nome}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/${clienteId}`);
            // Recarrega com o termo de busca atual
            fetchClientes(debouncedSearchText);
            alert(`Cliente ${nome} excluído com sucesso!`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir cliente.');
        }
    };

    // Função de renderização customizada para destaque
    const renderCellWithHighlight = (params: any, field: keyof Cliente) => (
        <HighlightedText
            text={params.row[field]}
            highlight={debouncedSearchText}
        />
    );

    // ⭐️ ATUALIZAÇÃO: Mapear as colunas para usar o renderCellWithHighlight e nova coluna de Actions
    const columns: GridColDef[] = useMemo(() => [
        { field: '_id', headerName: 'ID', width: 90 },
        {
            field: 'nome',
            headerName: 'Nome Completo',
            width: 250,
            editable: false,
            // Torna o nome clicável para edição e aplica o destaque
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
        // ⭐️ NOVA COLUNA DE AÇÕES COM ESTILIZAÇÃO E CENTRALIZAÇÃO
        {
            field: 'actions',
            headerName: 'Ações',
            width: 150,
            sortable: false,
            filterable: false,
            type: 'actions',
            // ⭐️ ATUALIZAÇÃO: Centralização Vertical e Horizontal
            renderCell: (params: GridRenderCellParams<Cliente>) => {
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center', // Centralização Vertical
                            justifyContent: 'center', // Centralização Horizontal
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

    if (loading && !debouncedSearchText) {
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
                    onClick={() => fetchClientes(debouncedSearchText)}
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

            {/* Campo de busca */}
            <Box sx={{ mb: 3 }}>
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
            {/* Fim do campo de busca */}

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
                    loading={loading && !!debouncedSearchText}
                    sx={{
                        // Adicionar estilos para Status (copiado do Imóveis, mas referenciando o status do cliente)
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
                onSuccess={() => fetchClientes(debouncedSearchText)}
            />
        </Box>
    );
};