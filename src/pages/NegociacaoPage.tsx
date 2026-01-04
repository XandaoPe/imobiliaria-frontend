import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, Tooltip, IconButton
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import HandshakeIcon from '@mui/icons-material/Handshake';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../services/api';
import { Negociacao, getStatusLabel, StatusNegociacao } from '../types/negociacao';
import { NegociacaoDetailsModal } from '../components/NegociacaoDetailsModal';
import { NegociacaoFormModal } from '../components/NegociacaoFormModal'; // <-- IMPORTADO
import { Chip } from '@mui/material';

export const NegociacaoPage = () => {
    const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
    const [openDetails, setOpenDetails] = useState(false);

    // 1. ESTADO PARA O FORMULÁRIO DE CRIAÇÃO
    const [openForm, setOpenForm] = useState(false);

    const handleOpenDetails = (negociacao: Negociacao) => {
        setSelectedNegociacao(negociacao);
        setOpenDetails(true);
    };

    const fetchNegociacoes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/negociacoes');
            setNegociacoes(response.data);
        } catch (err: any) {
            console.error('Falha ao carregar negociações.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNegociacoes();
    }, [fetchNegociacoes]);

    const getStatusColor = (status: StatusNegociacao) => {
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
            width: 200,
            valueGetter: (value, row) => row.cliente?.nome || 'N/A'
        },
        {
            field: 'imovel',
            headerName: 'Imóvel',
            width: 250,
            valueGetter: (value, row) => row.imovel?.titulo || 'N/A'
        },
        {
            field: 'tipo',
            headerName: 'Interesse',
            width: 120,
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
            width: 180,
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
            width: 100,
            renderCell: (params) => (
                <Tooltip title="Ver Detalhes / Histórico">
                    <IconButton color="primary" onClick={() => handleOpenDetails(params.row)}>
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            )
        }
    ], []);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Negociações (CRM)</Typography>

                {/* 2. BOTÃO CONECTADO AO SETOPENFORM */}
                <Button
                    variant="contained"
                    startIcon={<HandshakeIcon />}
                    onClick={() => setOpenForm(true)}
                >
                    Nova Negociação
                </Button>
            </Box>

            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={negociacoes}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* 3. MODAL DE DETALHES (JÁ EXISTIA) */}
            <NegociacaoDetailsModal
                open={openDetails}
                negociacao={selectedNegociacao}
                onClose={() => setOpenDetails(false)}
                onUpdate={fetchNegociacoes}
            />

            {/* 4. MODAL DE FORMULÁRIO (ADICIONADO) */}
            <NegociacaoFormModal
                open={openForm}
                onClose={() => setOpenForm(false)}
                onSuccess={() => {
                    setOpenForm(false);
                    fetchNegociacoes(); // Recarrega a lista para mostrar a nova negociação
                }}
            />
        </Box>
    );
};