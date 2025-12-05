// src/pages/ImoveisPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress, Alert, Paper } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel,
    GridRenderCellParams
} from '@mui/x-data-grid';
import HouseSidingIcon from '@mui/icons-material/HouseSiding';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Imovel, ImovelFormData } from '../types/imovel';
import { ImovelFormModal } from '../components/ImovelFormModal';

// ⚠️ Ajuste a URL base da sua API para Imóveis
const API_URL = 'http://localhost:5000/imoveis';

export const ImoveisPage = () => {
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [imovelToEdit, setImovelToEdit] = useState<Imovel | null>(null);

    // Colunas padrão ocultas
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        descricao: false,
    });

    const fetchImoveis = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);

            // O backend já retorna os dados formatados
            setImoveis(response.data as Imovel[]);
            setError(null);
        } catch (err: any) {
            let errorMessage = 'Falha ao carregar imóveis.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setError(errorMessage);
            console.error("Erro ao buscar imóveis:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImoveis();
    }, [fetchImoveis]);

    const handleOpenCreate = () => {
        setImovelToEdit(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (imovel: Imovel) => {
        setImovelToEdit(imovel);
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setImovelToEdit(null);
    };

    const handleDelete = async (imovelId: string, titulo: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o imóvel: "${titulo}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/${imovelId}`);
            fetchImoveis();
            alert('Imóvel excluído com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir imóvel.');
        }
    };

    // Função para formatar valor
    const formatValor = (valor: number): string => {
        return `R$ ${valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Mapeamento de tipos para exibição amigável
    const getTipoDisplay = (tipo: string): string => {
        const tipoMap: Record<string, string> = {
            'CASA': 'Casa',
            'APARTAMENTO': 'Apartamento',
            'TERRENO': 'Terreno',
            'COMERCIAL': 'Comercial'
        };
        return tipoMap[tipo] || tipo;
    };

    // Definição das colunas com tipagem explícita
    const columns: GridColDef<Imovel>[] = [
        {
            field: '_id',
            headerName: 'ID',
            width: 90,
            hideable: true
        },
        {
            field: 'titulo',
            headerName: 'Título',
            width: 250
        },
        {
            field: 'tipo',
            headerName: 'Tipo',
            width: 130,
            valueGetter: (value, row) => getTipoDisplay(row.tipo)
        },
        {
            field: 'endereco',
            headerName: 'Endereço',
            width: 200
        },
        {
            field: 'valor',
            headerName: 'Valor (R$)',
            width: 150,
            valueGetter: (value, row) => formatValor(row.valor)
        },
        {
            field: 'disponivel',
            headerName: 'Status',
            width: 130,
            valueGetter: (value, row) => row.disponivel ? "Disponível" : "Indisponível",
            cellClassName: (params) => {
                return params.row.disponivel ? 'status-disponivel' : 'status-indisponivel';
            }
        },
        {
            field: 'descricao',
            headerName: 'Descrição',
            width: 300,
            hideable: true
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<Imovel>) => {
                return (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            color="primary"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenEdit(params.row)}
                        >
                            Editar
                        </Button>
                        <Button
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(params.row._id, params.row.titulo)}
                        >
                            Excluir
                        </Button>
                    </Box>
                );
            },
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
                <Button variant="contained" onClick={fetchImoveis}>
                    Tentar Novamente
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gerenciamento de Imóveis
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<HouseSidingIcon />}
                    onClick={handleOpenCreate}
                >
                    Novo Imóvel
                </Button>
            </Box>

            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={imoveis}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    checkboxSelection
                    disableRowSelectionOnClick
                    getRowId={(row) => row._id}
                    loading={loading}
                    sx={{
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

            <ImovelFormModal
                open={openModal}
                onClose={handleClose}
                imovelToEdit={imovelToEdit}
                onSuccess={fetchImoveis}
            />
        </Box>
    );
};