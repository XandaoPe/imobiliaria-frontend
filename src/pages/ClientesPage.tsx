// src/pages/ClientesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress, Alert, Paper } from '@mui/material';
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

// ⚠️ Ajuste a URL base da sua API
const API_URL = 'http://localhost:5000/clientes';

// ⭐️ REMOVA a interface Cliente local e use a importada

export const ClientesPage = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        cpf: false,
        observacoes: false,
    });

    const fetchClientes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);

            // ⭐️ Normaliza os dados recebidos do backend
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
        fetchClientes();
    }, [fetchClientes]);

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
        if (!window.confirm(`Tem certeza que deseja excluir o cliente ${nome}?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/${clienteId}`);
            fetchClientes();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir cliente.');
        }
    };

    const columns: GridColDef[] = [
        { field: '_id', headerName: 'ID', width: 90 },
        { field: 'nome', headerName: 'Nome Completo', width: 250, editable: false },
        { field: 'cpf', headerName: 'CPF', width: 150, editable: false },
        { field: 'email', headerName: 'Email', width: 200, editable: false },
        { field: 'telefone', headerName: 'Telefone', width: 150, editable: false },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            editable: false,
            valueGetter: (value) => value === 'ATIVO' ? 'ATIVO' : 'INATIVO'
        },
        { field: 'perfil', headerName: 'Tipo', width: 130, editable: false },
        { field: 'observacoes', headerName: 'Observações', width: 200, editable: false },
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
    ];

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
                <Button variant="contained" onClick={fetchClientes}>
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
                />
            </Paper>

            <ClienteFormModal
                open={openModal}
                onClose={handleClose}
                clienteToEdit={clienteToEdit}
                onSuccess={fetchClientes}
            />
        </Box>
    );
};