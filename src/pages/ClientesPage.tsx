// src/pages/ClientesPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress, Alert, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp, GridColumnVisibilityModel } from '@mui/x-data-grid'; // ⭐️ Importar GridColumnVisibilityModel
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// ⚠️ Ajuste a URL base da sua API
const API_URL = 'http://localhost:5000/clientes';

// ⭐️ Interface para tipagem dos dados
interface Cliente {
    _id: string;
    nome: string;
    email: string;
    telefone: string;
    perfil: string; // Exemplo: Comprador, Locatário
    // empresaId não será exibido, mas é usado no backend
}

// ⭐️ Definição das colunas para o DataGrid
const columns: GridColDef[] = [
    // ❌ A propriedade 'hide: true' foi removida daqui!
    { field: '_id', headerName: 'ID', width: 90 },
    { field: 'nome', headerName: 'Nome Completo', width: 250, editable: false },
    { field: 'email', headerName: 'Email', width: 200, editable: false },
    { field: 'telefone', headerName: 'Telefone', width: 150, editable: false },
    { field: 'perfil', headerName: 'Tipo', width: 130, editable: false },
    {
        field: 'actions',
        headerName: 'Ações',
        type: 'actions',
        width: 150,
        getActions: (params) => [
            // ⚠️ Aqui você adicionará botões de Editar e Excluir
            <Button
                key="edit" // Chave adicionada para melhor prática no React
                color="primary"
                size="small"
                onClick={() => console.log('Editar:', params.row._id)}
            >
                Editar
            </Button>,
        ],
    },
];

export const ClientesPage = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ⭐️ NOVO: Estado para controlar a visibilidade das colunas
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        // Oculta a coluna 'id' definindo seu valor como false
        id: false,
    });


    useEffect(() => {
        // A requisição GET para /clientes será multitenant
        // O backend usará o token JWT (configurado no AuthContext) para 
        // buscar APENAS os clientes da empresa do usuário logado.
        const fetchClientes = async () => {
            try {
                setLoading(true);
                // O Axios já está configurado globalmente no AuthContext para enviar o header Authorization
                const response = await axios.get(API_URL);

                // ⭐️ Ajuste se a resposta estiver aninhada (ex: response.data.data)
                setClientes(response.data as Cliente[]);

            } catch (err: any) {
                let errorMessage = 'Falha ao carregar clientes.';
                if (err.response && err.response.status === 401) {
                    errorMessage = 'Sessão expirada ou acesso negada. Faça login novamente.';
                } else if (err.response) {
                    errorMessage = err.response.data?.message || errorMessage;
                }
                setError(errorMessage);
                console.error("Erro ao buscar clientes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Carregando clientes...</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
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
                    // ⚠️ Lógica para abrir o Modal de Novo Cliente
                    onClick={() => console.log("Abrir Modal Novo Cliente")}
                >
                    Novo Cliente
                </Button>
            </Box>

            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={clientes}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]} // ⭐️ Uso de rowsPerPageOptions é depreciado, alterado para pageSizeOptions
                    // ⭐️ NOVO: Propriedades para visibilidade de coluna
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={setColumnVisibilityModel}

                    checkboxSelection
                    disableRowSelectionOnClick // ⭐️ Uso de disableSelectionOnClick é depreciado, alterado para disableRowSelectionOnClick
                    // ⚠️ Assumindo que o campo 'id' é único e está mapeado corretamente
                    getRowId={(row) => row._id}
                    loading={loading}
                />
            </Paper>
        </Box>
    );
};