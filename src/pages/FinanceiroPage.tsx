import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
    CircularProgress, Avatar, TextField, InputAdornment, Menu, MenuItem, ListSubheader
} from '@mui/material';
import {
    Add, Download, CheckCircle, HomeWork, Person, ReceiptLong,
    Search as SearchIcon, FilterList as FilterListIcon, Done as DoneIcon
} from '@mui/icons-material';
import { FinanceiroSummary } from '../components/financeiro/FinanceiroSummary';
import { FinanceiroFormModal } from '../components/financeiro/FinanceiroFormModal';
import { financeiroService } from '../services/financeiroService';

const DEBOUNCE_DELAY = 300;

// Tipagem para os filtros de status financeiro
type StatusFinanceiroFilter = 'TODOS' | 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'CANCELADO';

interface HighlightedTextProps {
    text: string | null | undefined;
    highlight: string;
}

// Componente para Destaque de Texto
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

    // Estados de Pesquisa e Filtro
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<StatusFinanceiroFilter>('TODOS');
    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const getStatusColor = (status: string): "error" | "warning" | "success" | "default" => {
        switch (status?.toUpperCase()) {
            case 'CANCELADO': return 'error';
            case 'PENDENTE': return 'warning';
            case 'PAGO':
            case 'RECEBIDO': return 'success';
            default: return 'default';
        }
    };

    // Função de carregar dados adaptada para filtros
    const carregarDados = useCallback(async (search: string, status: StatusFinanceiroFilter) => {
        try {
            setLoading(true);
            const params: any = {};
            if (search) params.search = search;
            if (status !== 'TODOS') params.status = status;

            const [resList, resSum] = await Promise.all([
                financeiroService.listar(params),
                financeiroService.getResumo() // O resumo geralmente permanece global, mas você pode passar params se o backend suportar
            ]);

            setTransacoes(resList.data);
            setResumo(resSum.data);
        } catch (err) {
            console.error("Erro ao buscar dados financeiros", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect para Debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Effect para disparar busca quando filtros mudarem
    useEffect(() => {
        carregarDados(debouncedSearchText, filterStatus);
    }, [debouncedSearchText, filterStatus, carregarDados]);

    // Foco automático no search
    useEffect(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
    }, []);

    // Handlers do Menu de Filtro
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorElFilter(event.currentTarget);
    const handleMenuClose = () => setAnchorElFilter(null);

    const handleSetStatus = (newStatus: StatusFinanceiroFilter) => {
        setFilterStatus(newStatus);
        handleMenuClose();
    };

    const handleDownload = async (id: string) => {
        setBaixando(id);
        await financeiroService.baixarRecibo(id);
        setBaixando(null);
    };

    const handleDarBaixa = async (id: string) => {
        if (window.confirm("Confirmar recebimento/pagamento deste título?")) {
            try {
                await financeiroService.registrarPagamento(id);
                carregarDados(debouncedSearchText, filterStatus);
            } catch (err) {
                alert("Erro ao processar pagamento");
            }
        }
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

            {/* ÁREA DE BUSCA E FILTROS */}
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
                    {(['TODOS', 'PENDENTE', 'PAGO', 'RECEBIDO', 'CANCELADO'] as StatusFinanceiroFilter[]).map((status) => (
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
                                        <Typography variant="body2">
                                            {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{
                                                width: 40, height: 40,
                                                bgcolor: item.tipo === 'RECEITA' ? 'success.light' : 'error.light'
                                            }}>
                                                {item.tipo === 'RECEITA' ? <Person /> : <HomeWork />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                                                    <HighlightedText
                                                        text={item.cliente?.nome || item.proprietario?.nome || 'Lançamento Avulso'}
                                                        highlight={debouncedSearchText}
                                                    />
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    {item.negociacaoCodigo ? (
                                                        <Chip
                                                            icon={<ReceiptLong sx={{ fontSize: '1rem !important' }} />}
                                                            label={<HighlightedText text={item.negociacaoCodigo} highlight={debouncedSearchText} />}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ fontSize: '0.85rem', fontWeight: 'bold', height: 24, borderRadius: '6px' }}
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
                                        <Typography variant="body2">
                                            <HighlightedText text={item.descricao} highlight={debouncedSearchText} />
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
                                            <Chip
                                                label={<HighlightedText text={item.categoria} highlight={debouncedSearchText} />}
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
                onSuccess={() => carregarDados(debouncedSearchText, filterStatus)}
            />
        </Box>
    );
};