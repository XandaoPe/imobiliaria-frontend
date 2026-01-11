import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, Tooltip, IconButton, Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import HandshakeIcon from '@mui/icons-material/Handshake';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../services/api';
import { Negociacao, getStatusLabel, StatusNegociacao } from '../types/negociacao';
import { NegociacaoDetailsModal } from '../components/NegociacaoDetailsModal';
import { NegociacaoFormModal } from '../components/NegociacaoFormModal';

export const NegociacaoPage = () => {
    const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
    const [openDetails, setOpenDetails] = useState(false);
    const [openForm, setOpenForm] = useState(false);

    const fetchNegociacoes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/negociacoes');
            setNegociacoes(response.data);
        } catch (err: any) {
            console.error('Falha ao carregar negociações.', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNegociacoes();
    }, [fetchNegociacoes]);

    const handleOpenDetails = useCallback((negociacao: Negociacao) => {
        setSelectedNegociacao(negociacao);
        setOpenDetails(true);
    }, []);

    const getStatusColor = (status: StatusNegociacao): "success" | "error" | "warning" | "secondary" | "primary" => {
        switch (status) {
            case 'FECHADO': return 'success';
            case 'PERDIDO': return 'error';
            case 'PROPOSTA': return 'warning';
            case 'VISITA': return 'secondary';
            default: return 'primary';
        }
    };

    const columns: GridColDef<Negociacao>[] = useMemo(() => [
        {
            field: 'cliente',
            headerName: 'Cliente / Lead',
            flex: 1,
            minWidth: 220,
            renderCell: (params) => (
                <Box
                    onClick={() => handleOpenDetails(params.row)}
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        fontWeight: '600',
                        '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.dark'
                        }
                    }}
                >
                    {params.row.cliente?.nome || 'N/A'}
                </Box>
            )
        },
        {
            field: 'imovel',
            headerName: 'Imóvel e Localização',
            flex: 1.5,
            minWidth: 300,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        {params.row.imovel?.titulo || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        {params.row.imovel?.endereco ? `${params.row.imovel.endereco}` : 'Sem endereço'}
                        {params.row.imovel?.cidade ? ` • ${params.row.imovel.cidade}` : ''}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'tipo',
            headerName: 'Interesse',
            width: 110,
            renderCell: (params) => (
                <Chip
                    label={params.row.tipo}
                    variant="outlined"
                    size="small"
                    color={params.row.tipo === 'VENDA' ? 'success' : 'info'}
                />
            )
        },
        {
            field: 'status',
            headerName: 'Fase do Funil',
            width: 160,
            renderCell: (params) => (
                <Chip
                    label={getStatusLabel(params.row.status)}
                    color={getStatusColor(params.row.status)}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 90,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Tooltip title="Ver Detalhes / Histórico">
                    <IconButton color="primary" onClick={() => handleOpenDetails(params.row)}>
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            )
        }
    ], [handleOpenDetails]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header da Página */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        Negociações
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie seus leads e o progresso das vendas/aluguéis
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={<HandshakeIcon />}
                    onClick={() => setOpenForm(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Nova Negociação
                </Button>
            </Box>

            {/* Tabela de Dados */}
            <Paper elevation={4} sx={{ height: 650, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
                <DataGrid
                    rows={negociacoes}
                    columns={columns}
                    getRowId={(row) => row._id || Math.random()}
                    loading={loading}
                    disableRowSelectionOnClick
                    rowHeight={70} // Aumentado para acomodar as duas linhas de texto do imóvel
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'bold'
                        }
                    }}
                />
            </Paper>

            {/* Modal de Detalhes e Histórico */}
            <NegociacaoDetailsModal
                open={openDetails}
                negociacao={selectedNegociacao}
                onClose={() => {
                    setOpenDetails(false);
                    setSelectedNegociacao(null);
                }}
                onUpdate={fetchNegociacoes}
            />

            {/* Modal de Cadastro de Nova Negociação */}
            <NegociacaoFormModal
                open={openForm}
                onClose={() => setOpenForm(false)}
                onSuccess={() => {
                    setOpenForm(false);
                    fetchNegociacoes();
                }}
            />
        </Box>
    );
};