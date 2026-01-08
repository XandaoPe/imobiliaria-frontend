import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Add, Download, CheckCircle } from '@mui/icons-material';
import { FinanceiroSummary } from '../components/financeiro/FinanceiroSummary';
import { FinanceiroFormModal } from '../components/financeiro/FinanceiroFormModal'; // ⭐️ IMPORTANTE
import { financeiroService } from '../services/financeiroService';

export const FinanceiroPage: React.FC = () => {
    const [transacoes, setTransacoes] = useState<any[]>([]); // ⭐️ Tipagem para evitar erro no map
    const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, pendentes: 0 });
    const [modalOpen, setModalOpen] = useState(false); // ⭐️ Estado do Modal
    const [baixando, setBaixando] = useState<string | null>(null);

    const handleDownload = async (id: string) => {
        setBaixando(id);
        await financeiroService.baixarRecibo(id);
        setBaixando(null);
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
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">💰 Gestão Financeira</Typography>
                    <Typography variant="body2" color="text.secondary">Integrado ao seu fluxo de caixa</Typography>
                </Box>
                {/* ⭐️ Abre o modal ao clicar */}
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setModalOpen(true)}
                >
                    Novo Lançamento
                </Button>
            </Box>

            <FinanceiroSummary
                receitas={resumo.receitas}
                despesas={resumo.despesas}
            />

            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f1f1f1' }}>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    Nenhum lançamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transacoes.map((item: any) => (
                                <TableRow key={item._id} hover>
                                    <TableCell>{new Date(item.dataVencimento).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="500">{item.descricao}</Typography>
                                        <Typography variant="caption" color="text.secondary">{item.categoria}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: item.tipo === 'DESPESA' ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={item.status}
                                            size="small"
                                            color={item.status === 'PAGO' ? 'success' : 'warning'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>

                                            {item.status === 'PENDENTE' && (
                                                <Tooltip title="Confirmar Pagamento/Recebimento" arrow>
                                                    <IconButton
                                                        color="success"
                                                        onClick={() => handleDarBaixa(item._id)}
                                                    >
                                                        <CheckCircle />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            <Tooltip title="Baixar Recibo PDF" arrow>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleDownload(item._id)}
                                                    disabled={baixando === item._id}
                                                >
                                                    {baixando === item._id ? <CircularProgress size={20} /> : <Download />}
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

            {/* ⭐️ O MODAL PRECISA ESTAR AQUI NO JSX */}
            <FinanceiroFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={carregarDados} // Recarrega a lista ao salvar novo
            />
        </Box>
    );
};