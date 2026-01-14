import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
    CircularProgress, Avatar, TextField, InputAdornment, Menu, MenuItem, ListSubheader,
    TablePagination
} from '@mui/material';
import {
    Add, Download, CheckCircle, HomeWork, Person, ReceiptLong,
    Search as SearchIcon, FilterList as FilterListIcon, Done as DoneIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import { FinanceiroSummary } from '../components/financeiro/FinanceiroSummary';
import { FinanceiroFormModal } from '../components/financeiro/FinanceiroFormModal';
import { FinanceiroDetalhesModal } from '../components/financeiro/FinanceiroDetalhesModal';
import { financeiroService } from '../services/financeiroService';

const DEBOUNCE_DELAY = 300;

// Alinhado com o Enum do Backend
type StatusFinanceiroFilter = 'TODOS' | 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ATRASADO';

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
                    <span key={i} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
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
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, pendentes: 0 });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [baixando, setBaixando] = useState<string | null>(null);

    // Estados para Detalhes
    const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
    const [transacaoSelecionada, setTransacaoSelecionada] = useState<any>(null);

    // Estados de Pesquisa e Filtro
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<StatusFinanceiroFilter>('TODOS');
    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const getStatusColor = (status: string): "error" | "warning" | "success" | "default" | "info" => {
        switch (status?.toUpperCase()) {
            case 'CANCELADO': return 'error';
            case 'PENDENTE': return 'warning';
            case 'ATRASADO': return 'error';
            case 'PAGO': return 'success';
            default: return 'default';
        }
    };

    const carregarDados = useCallback(async (search: string, status: StatusFinanceiroFilter, pageArg: number, limitArg: number) => {
        try {
            setLoading(true);
            const params: any = {
                page: pageArg + 1,
                limit: limitArg
            };
            if (search) params.search = search;
            if (status !== 'TODOS') params.status = status;

            const [resList, resSum] = await Promise.all([
                financeiroService.listar(params),
                financeiroService.getResumo()
            ]);

            setTransacoes(resList.data.data);
            setTotalItems(resList.data.total);
            setResumo(resSum.data);
        } catch (err) {
            console.error("Erro ao buscar dados financeiros", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [searchText]);

    useEffect(() => {
        carregarDados(debouncedSearchText, filterStatus, page, rowsPerPage);
    }, [debouncedSearchText, filterStatus, page, rowsPerPage, carregarDados]);

    useEffect(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
    }, []);

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
            console.error("Erro ao baixar recibo", error);
        } finally {
            setBaixando(null);
        }
    };

    const handleDarBaixa = async (id: string) => {
        if (window.confirm("Confirmar recebimento/pagamento deste título?")) {
            try {
                await financeiroService.registrarPagamento(id);
                carregarDados(debouncedSearchText, filterStatus, page, rowsPerPage);
            } catch (err) {
                alert("Erro ao processar pagamento");
            }
        }
    };

    const handleVerDetalhes = (transacao: any) => {
        setTransacaoSelecionada(transacao);
        setDetalhesModalOpen(true);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FinanceiroSummary
                receitas={resumo.receitas}
                despesas={resumo.despesas}
                pendentes={resumo.pendentes}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="bold">Fluxo de Caixa</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setModalOpen(true)}
                >
                    Novo Lançamento
                </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        label="Pesquisar por Descrição, Cliente, Categoria ou Código"
                        variant="outlined"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        inputRef={searchInputRef}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {loading ? <CircularProgress size={20} /> : <SearchIcon />}
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <Button
                    variant="outlined"
                    onClick={handleMenuOpen}
                    startIcon={<FilterListIcon />}
                    sx={{ height: 56, whiteSpace: 'nowrap' }}
                >
                    Status: {filterStatus === 'TODOS' ? 'Todos' : filterStatus}
                </Button>

                <Menu
                    anchorEl={anchorElFilter}
                    open={Boolean(anchorElFilter)}
                    onClose={handleMenuClose}
                >
                    <ListSubheader>Filtrar por Status</ListSubheader>
                    {(['TODOS', 'PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO'] as StatusFinanceiroFilter[]).map((status) => (
                        <MenuItem key={status} onClick={() => handleSetStatus(status)} selected={filterStatus === status}>
                            {filterStatus === status && <DoneIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />}
                            <Box sx={{ ml: filterStatus !== status ? '24px' : 0 }}>
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </Box>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>

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
                        {loading && transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    Nenhum lançamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transacoes.map((item: any) => (
                                <TableRow key={item._id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight="500">
                                                {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
                                            </Typography>
                                            <Tooltip title="Ver ficha completa">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleVerDetalhes(item)}
                                                    sx={{ color: 'primary.main' }}
                                                >
                                                    <VisibilityIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{
                                                width: 36, height: 36,
                                                bgcolor: item.tipo === 'RECEITA' ? 'success.light' : 'error.light',
                                                fontSize: '1rem'
                                            }}>
                                                {item.tipo === 'RECEITA' ? <Person fontSize="small" /> : <HomeWork fontSize="small" />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                                                    <HighlightedText
                                                        text={item.cliente?.nome || 'Lançamento Avulso'}
                                                        highlight={debouncedSearchText}
                                                    />
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    {item.negociacaoCodigo ? (
                                                        <Chip
                                                            icon={<ReceiptLong sx={{ fontSize: '0.9rem !important' }} />}
                                                            label={<HighlightedText text={item.negociacaoCodigo} highlight={debouncedSearchText} />}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem', fontWeight: 'bold', height: 20 }}
                                                        />
                                                    ) : (
                                                        item.imovel && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Ref: <HighlightedText text={item.imovel.codigo} highlight={debouncedSearchText} />
                                                            </Typography>
                                                        )
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <HighlightedText text={item.descricao} highlight={debouncedSearchText} />
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
                                            <Chip
                                                label={item.categoria}
                                                size="small"
                                                sx={{ fontSize: '0.6rem', height: 16, bgcolor: '#f0f0f0' }}
                                            />
                                            {item.parcelaNumero && (
                                                <Typography variant="caption" color="primary.main" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
                                                    Parcela {item.parcelaNumero}
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
                                            sx={{ fontWeight: 'bold', minWidth: 85, fontSize: '0.75rem' }}
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
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalItems}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Itens por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </TableContainer>

            <FinanceiroFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => carregarDados(debouncedSearchText, filterStatus, page, rowsPerPage)}
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