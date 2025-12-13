// src/pages/ClientesPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress, Alert, Paper, TextField, InputAdornment } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel
} from '@mui/x-data-grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ClienteFormModal } from '../components/ClienteFormModal';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Cliente, normalizeCPF, normalizeStatus } from '../types/cliente'; // ⭐️ IMPORTE O TIPO UNIFICADO
import SearchIcon from '@mui/icons-material/Search';
// ⚠️ Ajuste a URL base da sua API
const API_URL = 'http://localhost:5000/clientes';

interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

// ⭐️ NOVO: Componente para Destaque
const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
    if (!text || !highlight) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerHighlight = highlight.toLowerCase();

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Expressão regular para encontrar o termo, ignorando maiúsculas/minúsculas
    const regex = new RegExp(highlight, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Texto antes do destaque
        parts.push(text.substring(lastIndex, match.index));
        // Texto destacado
        parts.push(
            <span key={match.index} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
                {match[0]}
            </span>
        );
        lastIndex = regex.lastIndex;
    }

    // Texto após o último destaque
    parts.push(text.substring(lastIndex));

    return <>{parts}</>;
};

export const ClientesPage = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);

    // ⭐️ NOVO: Estado para o termo de busca
    const [searchText, setSearchText] = useState('');

    // ⭐️ NOVO: Estado para aplicar debounce (reduzir chamadas à API)
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        cpf: false,
        observacoes: false,
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    // ⭐️ ATUALIZAÇÃO: Receber o termo de busca (debounced)
    const fetchClientes = useCallback(async (search: string) => {
        try {
            setLoading(true);

            // ⭐️ Adiciona o termo de busca como query parameter, se existir
            const url = search ? `${API_URL}?search=${encodeURIComponent(search)}` : API_URL;
            const response = await axios.get(url);

            // ⭐️ Normaliza os dados recebidos do backend
            const clientesNormalizados = response.data.map((cliente: any) => ({
                ...cliente,
                status: normalizeStatus(cliente.status || 'ATIVO'),
                cpf: normalizeCPF(cliente.cpf || ''),
            }));

            setClientes(clientesNormalizados as Cliente[]);
            setError(null);
        } catch (err: any) {
            // ... (tratamento de erro - manter o existente)
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
        fetchClientes(debouncedSearchText);
    }, [fetchClientes, debouncedSearchText]);

    // ⭐️ Efeito para aplicar debounce no termo de busca
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 300); // 300ms de atraso

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    useEffect(() => {
        // Foca no campo de entrada sempre que o componente renderiza, se ele existir
        // Isso garante que o foco não é perdido quando o texto é alterado.
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

    const handleDelete = async (clienteId: string, nome: string) => {
        // ... (manter o existente)
        if (!window.confirm(`Tem certeza que deseja excluir o cliente ${nome}?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/${clienteId}`);
            // ⭐️ ATUALIZAÇÃO: Chamar a busca com o termo atual para manter o filtro
            fetchClientes(debouncedSearchText);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir cliente.');
        }
    };

    // ⭐️ ATUALIZAÇÃO: Adicionar a função de renderização customizada para destaque
    const renderCellWithHighlight = (params: any, field: keyof Cliente) => (
        <HighlightedText
            text={params.row[field]}
            highlight={debouncedSearchText}
        />
    );

    // ⭐️ ATUALIZAÇÃO: Mapear as colunas para usar o renderCellWithHighlight
    const columns: GridColDef[] = useMemo(() => [
        { field: '_id', headerName: 'ID', width: 90 },
        {
            field: 'nome',
            headerName: 'Nome Completo',
            width: 250,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'nome') // ⭐️ DESTAQUE
        },
        {
            field: 'cpf',
            headerName: 'CPF',
            width: 150,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'cpf') // ⭐️ DESTAQUE
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'email') // ⭐️ DESTAQUE
        },
        {
            field: 'telefone',
            headerName: 'Telefone',
            width: 150,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'telefone') // ⭐️ DESTAQUE
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            editable: false,
            // ⭐️ ATUALIZAÇÃO: renderCell para destaque
            renderCell: (params) => renderCellWithHighlight(params, 'status'),
            valueGetter: (value) => value === 'ATIVO' ? 'ATIVO' : 'INATIVO'
        },
        {
            field: 'perfil',
            headerName: 'Tipo',
            width: 130,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'perfil') // ⭐️ DESTAQUE
        },
        {
            field: 'observacoes',
            headerName: 'Observações',
            width: 200,
            editable: false,
            renderCell: (params) => renderCellWithHighlight(params, 'observacoes') // ⭐️ DESTAQUE
        },
        {
            field: 'actions',
            headerName: 'Ações',
            type: 'actions',
            width: 150,
            getActions: (params) => [
                <Button
                    key="edit"
                    color="primary"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEdit(params.row as Cliente)}
                >
                    Editar
                </Button>,
                <Button
                    key="delete"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(params.row._id, params.row.nome)}
                >
                    Excluir
                </Button>,
            ],
        },
    ], [debouncedSearchText, handleDelete]); // Recria as colunas apenas se o termo de busca ou a função de delete mudar

    if (loading) {
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
                {/* ⭐️ CORREÇÃO: Chamar fetchClientes com o termo de busca atual */}
                <Button
                    variant="contained"
                    onClick={() => fetchClientes(debouncedSearchText)} // <--- ALTERAÇÃO AQUI
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

            {/* ⭐️ NOVO: Campo de busca */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    label="Pesquisar Clientes"
                    variant="outlined"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)} // Atualiza o estado da busca em tempo real (o debounce fará a chamada)
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
                    // ... (propriedades existentes)
                    rows={clientes}
                    columns={columns} // Usar as colunas do useMemo
                    pageSizeOptions={[10, 25, 50]}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    checkboxSelection
                    disableRowSelectionOnClick
                    getRowId={(row) => row._id}
                    loading={loading && !!debouncedSearchText} // Exibir loading apenas se estiver buscando
                />
            </Paper>

            <ClienteFormModal
                // ... (props existentes)
                open={openModal}
                onClose={handleClose}
                clienteToEdit={clienteToEdit}
                // ⭐️ ATUALIZAÇÃO: Chamar a busca com o termo atual após o sucesso
                onSuccess={() => fetchClientes(debouncedSearchText)}
            />
        </Box>
    );
};