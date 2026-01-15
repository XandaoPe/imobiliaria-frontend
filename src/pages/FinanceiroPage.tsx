import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
    CircularProgress, Avatar, TextField, InputAdornment, Menu, MenuItem, ListSubheader,
    TablePagination, Alert
} from '@mui/material';
import {
    Add, Download, CheckCircle, HomeWork, Person, ReceiptLong,
    Search as SearchIcon, FilterList as FilterListIcon, Done as DoneIcon,
    Visibility as VisibilityIcon, Clear as ClearIcon
} from '@mui/icons-material';

// Importação de componentes para o Gráfico
import {
    XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    Legend, ResponsiveContainer, Bar, Line, ComposedChart
} from 'recharts';

// Importação de componentes e serviços
import { FinanceiroSummary } from '../components/financeiro/FinanceiroSummary';
import { FinanceiroFormModal } from '../components/financeiro/FinanceiroFormModal';
import { FinanceiroDetalhesModal } from '../components/financeiro/FinanceiroDetalhesModal';
import { financeiroService } from '../services/financeiroService';

const DEBOUNCE_DELAY = 400;

type StatusFinanceiroFilter = 'TODOS' | 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ATRASADO';

interface Transacao {
    _id: string;
    dataVencimento: string;
    tipo: 'RECEITA' | 'DESPESA';
    descricao: string;
    valor: number;
    status: string;
    categoria: string;
    parcelaNumero?: number;
    negociacaoCodigo?: string;
    cliente?: { nome: string };
    imovel?: { codigo: string };
}

interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
    const textToDisplay = text ?? '';
    if (!textToDisplay.trim() || !highlight.trim()) {
        return <>{textToDisplay}</>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = textToDisplay.split(regex);

    return (
        <Typography component="span" variant="inherit">
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold', borderRadius: '2px' }}>
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </Typography>
    );
};

export const FinanceiroPage: React.FC = () => {
    // Estados de Dados
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [resumo, setResumo] = useState({ totalPendente: 0, totalRecebido: 0, totalPago: 0 });
    const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [baixando, setBaixando] = useState<string | null>(null);

    // Estados de Modais
    const [modalOpen, setModalOpen] = useState(false);
    const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
    const [transacaoSelecionada, setTransacaoSelecionada] = useState<Transacao | null>(null);

    // Estados de Pesquisa e Paginação
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    // Filtro inicial como PENDENTE conforme solicitado
    const [filterStatus, setFilterStatus] = useState<StatusFinanceiroFilter>('PENDENTE');

    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const getStatusColor = (status: string): "error" | "warning" | "success" | "default" | "info" => {
        switch (status?.toUpperCase()) {
            case 'CANCELADO': return 'error';
            case 'PENDENTE': return 'warning';
            case 'ATRASADO': return 'error';
            case 'PAGO': return 'success';
            default: return 'default';
        }
    };

    const carregarDados = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page: page + 1,
                limit: rowsPerPage
            };
            if (debouncedSearchText) params.search = debouncedSearchText;
            if (filterStatus !== 'TODOS') params.status = filterStatus;

            const [resList, resSum] = await Promise.all([
                financeiroService.listar(params),
                financeiroService.getResumo()
            ]);

            setTransacoes(resList.data.data || []);
            setTotalItems(resList.data.total || 0);

            setResumo({
                totalPendente: resSum.data.pendentes || 0,
                totalRecebido: resSum.data.receitas || 0,
                totalPago: resSum.data.despesas || 0
            });

            setDadosGrafico(resSum.data.chartData || [
                { mes: 'Jan', recebido: 4000, pago: 2400, pendente: 2400 },
                { mes: 'Fev', recebido: 3000, pago: 1398, pendente: 2210 },
                { mes: 'Mar', recebido: 2000, pago: 9800, pendente: 2290 },
                { mes: 'Abr', recebido: 2780, pago: 3908, pendente: 2000 },
                { mes: 'Mai', recebido: 1890, pago: 4800, pendente: 2181 },
                { mes: 'Jun', recebido: 2390, pago: 3800, pendente: 2500 },
            ]);

        } catch (err) {
            console.error("Erro ao buscar dados financeiros", err);
            setError("Não foi possível carregar os lançamentos financeiros.");
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, debouncedSearchText, filterStatus]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
            setPage(0);
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [searchText]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorElFilter(event.currentTarget);
    const handleMenuClose = () => setAnchorElFilter(null);

    const handleSetStatus = (newStatus: StatusFinanceiroFilter) => {
        setFilterStatus(newStatus);
        setPage(0);
        handleMenuClose();
    };

    const handleDownload = async (id: string) => {
        setBaixando(id);
        try {
            await financeiroService.baixarRecibo(id);
        } catch (error) {
            alert("Erro ao baixar o recibo.");
        } finally {
            setBaixando(null);
        }
    };

    const handleDarBaixa = async (id: string) => {
        if (window.confirm("Confirmar recebimento/pagamento deste título?")) {
            try {
                await financeiroService.registrarPagamento(id);
                carregarDados();
            } catch (err) {
                alert("Erro ao processar baixa financeira.");
            }
        }
    };

    const handleVerDetalhes = (transacao: Transacao) => {
        setTransacaoSelecionada(transacao);
        setDetalhesModalOpen(true);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 4 }}>

            <FinanceiroSummary
                receitas={resumo.totalRecebido}
                despesas={resumo.totalPago}
                pendentes={resumo.totalPendente}
            />

            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Evolução Financeira Mensal
                </Typography>
                <Box sx={{ width: '100%', height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dadosGrafico}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                            <ChartTooltip
                                // CORREÇÃO TS2322: Tipagem flexível e tratamento de valor
                                formatter={(value: any) => formatCurrency(Number(value || 0))}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 20 }} />
                            <Bar dataKey="recebido" name="Recebido" fill="#4caf50" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="pago" name="Pago" fill="#f44336" radius={[4, 4, 0, 0]} barSize={30} />
                            <Line type="monotone" dataKey="pendente" name="Pendente" stroke="#ff9800" strokeWidth={3} dot={{ r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight="bold">Fluxo de Caixa</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setModalOpen(true)}
                    sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Novo Lançamento
                </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                <TextField
                    fullWidth
                    placeholder="Descrição, Cliente, Categoria ou Código..."
                    variant="outlined"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    inputRef={searchInputRef}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {loading ? <CircularProgress size={20} /> : <SearchIcon color="action" />}
                            </InputAdornment>
                        ),
                        endAdornment: searchText && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchText('')}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <Button
                    variant="outlined"
                    onClick={handleMenuOpen}
                    startIcon={<FilterListIcon />}
                    sx={{ height: 56, whiteSpace: 'nowrap', minWidth: 200, borderRadius: 1, textTransform: 'none' }}
                >
                    Status: {filterStatus === 'TODOS' ? 'Todos' : filterStatus}
                </Button>

                <Menu anchorEl={anchorElFilter} open={Boolean(anchorElFilter)} onClose={handleMenuClose}>
                    <ListSubheader>Filtrar por Status</ListSubheader>
                    {(['TODOS', 'PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO'] as StatusFinanceiroFilter[]).map((status) => (
                        <MenuItem key={status} onClick={() => handleSetStatus(status)} selected={filterStatus === status}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                {filterStatus === status ? <DoneIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} /> : <Box sx={{ width: 28 }} />}
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </Box>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#fbfbfb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Vencimento</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Vínculo / Cliente</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={40} thickness={4} />
                                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Carregando lançamentos...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                    <Typography color="text.secondary">Nenhum lançamento encontrado para os filtros aplicados.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transacoes.map((item) => (
                                <TableRow key={item._id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight="600">
                                                {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
                                            </Typography>
                                            <Tooltip title="Ver detalhes">
                                                <IconButton size="small" onClick={() => handleVerDetalhes(item)} color="primary">
                                                    <VisibilityIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{
                                                width: 34, height: 34,
                                                bgcolor: item.tipo === 'RECEITA' ? '#e8f5e9' : '#ffebee',
                                                color: item.tipo === 'RECEITA' ? 'success.main' : 'error.main'
                                            }}>
                                                {item.tipo === 'RECEITA' ? <Person fontSize="small" /> : <HomeWork fontSize="small" />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    <HighlightedText text={item.cliente?.nome || 'Lançamento Avulso'} highlight={debouncedSearchText} />
                                                </Typography>
                                                {item.negociacaoCodigo ? (
                                                    <Chip
                                                        icon={<ReceiptLong sx={{ fontSize: '0.8rem !important' }} />}
                                                        label={<HighlightedText text={item.negociacaoCodigo} highlight={debouncedSearchText} />}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
                                                    />
                                                ) : item.imovel && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Ref: <HighlightedText text={item.imovel.codigo} highlight={debouncedSearchText} />
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            <HighlightedText text={item.descricao} highlight={debouncedSearchText} />
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                            <Chip label={item.categoria} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                                            {item.parcelaNumero && (
                                                <Typography variant="caption" color="primary.main" fontWeight="bold">
                                                    Parcela {item.parcelaNumero}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{
                                            color: item.tipo === 'DESPESA' ? 'error.main' : 'success.main',
                                            fontWeight: 'bold'
                                        }}>
                                            {item.tipo === 'DESPESA' ? '- ' : '+ '}
                                            {formatCurrency(item.valor)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={item.status}
                                            size="small"
                                            color={getStatusColor(item.status)}
                                            sx={{ fontWeight: 'bold', minWidth: 90, fontSize: '0.7rem' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            {item.status === 'PENDENTE' && (
                                                <Tooltip title="Confirmar Pagamento">
                                                    <IconButton color="success" onClick={() => handleDarBaixa(item._id)} size="small">
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Baixar Recibo PDF">
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
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalItems}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Itens por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </TableContainer>

            <FinanceiroFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={carregarDados}
            />

            <FinanceiroDetalhesModal
                open={detalhesModalOpen}
                onClose={() => {
                    setDetalhesModalOpen(false);
                    setTransacaoSelecionada(null);
                }}
                data={transacaoSelecionada}
            />
        </Box>
    );
};