import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, CircularProgress, Avatar } from '@mui/material';
import { Add, Download, CheckCircle, HomeWork, Person } from '@mui/icons-material';
import { FinanceiroSummary } from '../components/financeiro/FinanceiroSummary';
import { FinanceiroFormModal } from '../components/financeiro/FinanceiroFormModal';
import { financeiroService } from '../services/financeiroService';

export const FinanceiroPage: React.FC = () => {
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, pendentes: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [baixando, setBaixando] = useState<string | null>(null);

    const getStatusColor = (status: string): "error" | "warning" | "success" | "default" => {
        switch (status?.toUpperCase()) {
            case 'CANCELADO': return 'error';
            case 'PENDENTE': return 'warning';
            case 'PAGO':
            case 'RECEBIDO': return 'success';
            default: return 'default';
        }
    };

    const carregarDados = async () => {
        try {
            const [resList, resSum] = await Promise.all([
                financeiroService.listar({}),
                financeiroService.getResumo()
            ]);
            setTransacoes(resList.data);
            setResumo(resSum.data);
        } catch (err) {
            console.error("Erro ao buscar dados financeiros", err);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    const handleDownload = async (id: string) => {
        setBaixando(id);
        await financeiroService.baixarRecibo(id);
        setBaixando(null);
    };

    const handleDarBaixa = async (id: string) => {
        if (window.confirm("Confirmar recebimento/pagamento deste título?")) {
            try {
                await financeiroService.registrarPagamento(id);
                carregarDados();
            } catch (err) {
                alert("Erro ao processar pagamento");
            }
        }
    };

    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* ... Cabeçalho e Sumário iguais ... */}

            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell>Vencimento</TableCell>
                            <TableCell>Vínculo / Cliente</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    Nenhum lançamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transacoes.map((item: any) => (
                                <TableRow key={item._id} hover>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: item.tipo === 'RECEITA' ? 'success.light' : 'error.light'
                                            }}>
                                                {item.tipo === 'RECEITA' ? <Person fontSize="small" /> : <HomeWork fontSize="small" />}
                                            </Avatar>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight="600" sx={{ lineHeight: 1 }}>
                                                        {item.cliente?.nome || item.proprietario?.nome || 'Lançamento Avulso'}
                                                    </Typography>
                                                    {/* EXIBIÇÃO DO CÓDIGO DA NEGOCIAÇÃO VINCULADA */}
                                                    {item.negociacaoCodigo && (
                                                        <Chip
                                                            label={item.negociacaoCodigo}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.6rem', height: 16, borderRadius: '4px', color: 'text.secondary', fontWeight: 'bold' }}
                                                        />
                                                    )}
                                                </Box>
                                                {item.imovel && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Ref: {item.imovel.codigo || item.imovel.titulo?.substring(0, 20) || 'Sem Código'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2">{item.descricao}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
                                            <Chip
                                                label={item.categoria}
                                                size="small"
                                                sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#eee' }}
                                            />
                                            {item.numeroParcela && (
                                                <Typography variant="caption" color="primary.main" fontWeight="bold">
                                                    Parcela {item.numeroParcela}/{item.totalParcelas}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell sx={{ color: item.tipo === 'DESPESA' ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip
                                            label={item.status}
                                            size="small"
                                            color={getStatusColor(item.status)}
                                            sx={{ fontWeight: 'bold', minWidth: 90 }}
                                        />
                                    </TableCell>

                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            {item.status === 'PENDENTE' && (
                                                <Tooltip title="Confirmar Pagamento" arrow>
                                                    <IconButton color="success" onClick={() => handleDarBaixa(item._id)} size="small">
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Baixar Recibo PDF" arrow>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleDownload(item._id)}
                                                    disabled={baixando === item._id}
                                                    size="small"
                                                >
                                                    {baixando === item._id ? <CircularProgress size={18} /> : <Download fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <FinanceiroFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={carregarDados}
            />
        </Box>
    );
};