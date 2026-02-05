// src/pages/HistoricoPixPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton,
    TextField, InputAdornment, Button, Stack, Alert,
    CircularProgress, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
    Search as SearchIcon,
    QrCode2 as QrCodeIcon,
    Download,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import { pixService } from '../services/pixService';

export const HistoricoPixPage: React.FC = () => {
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        carregarTransacoes();
    }, [statusFilter]);

    const carregarTransacoes = async () => {
        setLoading(true);
        try {
            const dados = await pixService.listarTransacoes({
                status: statusFilter || undefined,
                limit: 100
            });
            setTransacoes(dados);
        } catch (error) {
            console.error('Erro ao carregar transações PIX:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAGO': return 'success';
            case 'GERADO': return 'primary';
            case 'PENDENTE': return 'warning';
            case 'EXPIRADO': return 'error';
            case 'CANCELADO': return 'default';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                Histórico de Transações PIX
            </Typography>

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        placeholder="Buscar transações..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flexGrow: 1 }}
                    />

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Status"
                            size="small"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="GERADO">Gerado</MenuItem>
                            <MenuItem value="PAGO">Pago</MenuItem>
                            <MenuItem value="PENDENTE">Pendente</MenuItem>
                            <MenuItem value="EXPIRADO">Expirado</MenuItem>
                            <MenuItem value="CANCELADO">Cancelado</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        onClick={carregarTransacoes}
                        disabled={loading}
                    >
                        Atualizar
                    </Button>
                </Stack>
            </Paper>

            {/* Lista de Transações */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Destinatário</TableCell>
                            <TableCell align="right">Valor</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Typography color="text.secondary">
                                        Nenhuma transação PIX encontrada
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transacoes.map((transacao) => (
                                <TableRow key={transacao._id} hover>
                                    <TableCell>
                                        {formatDate(transacao.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        {transacao.descricao}
                                    </TableCell>
                                    <TableCell>
                                        {transacao.nomeDestinatario}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {formatCurrency(transacao.valor)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={transacao.status}
                                            size="small"
                                            color={getStatusColor(transacao.status) as any}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small">
                                            <QrCodeIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};