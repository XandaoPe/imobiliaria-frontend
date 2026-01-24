import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
    CircularProgress, Avatar, TextField, InputAdornment, Menu, MenuItem, ListSubheader,
    TablePagination, Alert, Stack
} from '@mui/material';
import {
    Add, Download, CheckCircle, HomeWork, Person,
    Search as SearchIcon, FilterList as FilterListIcon, Done as DoneIcon,
    Visibility as VisibilityIcon, Clear as ClearIcon
} from '@mui/icons-material';

// Importação de componentes e serviços
import { FinanceiroSummary } from '../components/financeiro/FinanceiroSummary';
import { FinanceiroFormModal } from '../components/financeiro/FinanceiroFormModal';
import { FinanceiroDetalhesModal } from '../components/financeiro/FinanceiroDetalhesModal';
import { financeiroService } from '../services/financeiroService';
import { FinanceiroPreviewTooltip } from '../components/FinanceiroPreviewTooltip';

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
    imovel?: { codigo: string, titulo?: string };
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
                    <span key={i} style={{
                        backgroundColor: '#ffeb3b',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        color: '#000' // Garante texto preto no highlight
                    }}>
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
    // --- ESTADOS DE DATAS (CORRIGIDOS) ---
    const getPrimeiroDiaMes = (): string => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    };

    const getUltimoDiaMes = (): string => {
        const d = new Date();
        // Ajustado para 6 meses à frente conforme sua lógica original
        return new Date(d.getFullYear(), d.getMonth() + 6, 0).toISOString().split('T')[0];
    };

    const [dataInicio, setDataInicio] = useState<string>(getPrimeiroDiaMes());
    const [dataFim, setDataFim] = useState<string>(getUltimoDiaMes());

    // Estados de Dados
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [resumo, setResumo] = useState({ totalPendente: 0, totalRecebido: 0, totalPago: 0 });
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
    const [filterStatus, setFilterStatus] = useState<StatusFinanceiroFilter>('TODOS');

    const [anchorElFilter, setAnchorElFilter] = useState<null | HTMLElement>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    // Estados para o Tooltip de Preview
    const [anchorElPreview, setAnchorElPreview] = useState<HTMLElement | null>(null);
    const [previewData, setPreviewData] = useState<Transacao | null>(null);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>, item: Transacao) => {
        setAnchorElPreview(event.currentTarget);
        setPreviewData(item);
    };

    const handlePopoverClose = () => {
        setAnchorElPreview(null);
        setPreviewData(null);
    };

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

    useEffect(() => {
        setPage(0);
    }, [debouncedSearchText]);

    const carregarDados = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page: page + 1,
                limit: rowsPerPage,
                dataInicio,
                dataFim
            };

            // O debouncedSearchText é enviado aqui
            if (debouncedSearchText) params.search = debouncedSearchText;
            if (filterStatus !== 'TODOS') params.status = filterStatus;

            const resumoParams = { dataInicio, dataFim };

            const [resList, resSum] = await Promise.all([
                financeiroService.listar(params),
                financeiroService.getResumo(resumoParams)
            ]);

            const listaData = resList?.data?.data || [];
            const total = resList?.data?.total || 0;
            setTransacoes(listaData);
            setTotalItems(total);

            const s = resSum?.data || {};
            setResumo({
                totalRecebido: s.receitas ?? 0,
                totalPago: s.despesas ?? 0,
                totalPendente: s.pendentes ?? 0
            });

        } catch (err) {
            console.error("Erro ao buscar dados financeiros", err);
            setError("Não foi possível carregar os lançamentos financeiros.");
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, debouncedSearchText, filterStatus, dataInicio, dataFim]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
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
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 3
            }}>

                {/* COLUNA PRINCIPAL: LISTAGEM */}
                <Box sx={{ flex: 8.5, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">Financeiro</Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setModalOpen(true)}
                            sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 'bold', boxShadow: 3 }}
                        >
                            Novo Lançamento
                        </Button>
                    </Box>

                    {/* BARRA DE FILTROS */}
                    <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', bgcolor: 'background.paper' }}>
                        <TextField
                            sx={{ flexGrow: 1, minWidth: '200px' }}
                            size="small"
                            placeholder="Descrição, Cliente ou Código..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
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

                        {/* SELETORES DE DATA */}
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                label="Início"
                                type="date"
                                size="small"
                                value={dataInicio}
                                onChange={(e) => { setDataInicio(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                            <TextField
                                label="Fim"
                                type="date"
                                size="small"
                                value={dataFim}
                                onChange={(e) => { setDataFim(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 150 }}
                            />
                        </Stack>

                        <Button
                            variant="outlined"
                            onClick={handleMenuOpen}
                            startIcon={<FilterListIcon />}
                            sx={{ whiteSpace: 'nowrap', textTransform: 'none', height: 40 }}
                        >
                            {filterStatus === 'TODOS' ? 'Todos os Status' : filterStatus}
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
                    </Paper>

                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 3 }}>
                        <Table size="medium">
                            <TableHead sx={{
                                bgcolor: (theme) => theme.palette.mode === 'dark'
                                    ? theme.palette.background.paper // Usa background.paper em vez de default
                                    : '#f8f9fa'
                            }}>
                                <TableRow>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        color: (theme) => theme.palette.mode === 'dark'
                                            ? theme.palette.text.primary // Garante cor do texto no modo escuro
                                            : 'inherit'
                                    }}>
                                        Vencimento
                                    </TableCell>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        color: (theme) => theme.palette.mode === 'dark'
                                            ? theme.palette.text.primary
                                            : 'inherit'
                                    }}>
                                        Vínculo / Cliente
                                    </TableCell>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        color: (theme) => theme.palette.mode === 'dark'
                                            ? theme.palette.text.primary
                                            : 'inherit'
                                    }}>
                                        Descrição
                                    </TableCell>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        color: (theme) => theme.palette.mode === 'dark'
                                            ? theme.palette.text.primary
                                            : 'inherit'
                                    }}>
                                        Valor
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                        fontWeight: 'bold',
                                        color: (theme) => theme.palette.mode === 'dark'
                                            ? theme.palette.text.primary
                                            : 'inherit'
                                    }}>
                                        Status
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        fontWeight: 'bold',
                                        color: (theme) => theme.palette.mode === 'dark'
                                            ? theme.palette.text.primary
                                            : 'inherit'
                                    }}>
                                        Ações
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            
                            <TableBody>
                                {loading && transacoes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={40} />
                                        </TableCell>
                                    </TableRow>
                                ) : transacoes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">Nenhum registro encontrado para este período.</Typography>
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
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleVerDetalhes(item)}
                                                        onMouseEnter={(e) => handlePopoverOpen(e, item)} // ATIVA O PREVIEW
                                                        onMouseLeave={handlePopoverClose}              // FECHA O PREVIEW
                                                        color="primary"
                                                    >
                                                        <VisibilityIcon fontSize="inherit" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{
                                                        width: 32, height: 32, fontSize: '1rem',
                                                        bgcolor: item.tipo === 'RECEITA' ? 'success.light' : 'error.light',
                                                        color: item.tipo === 'RECEITA' ? 'success.dark' : 'error.dark'
                                                    }}>
                                                        {item.tipo === 'RECEITA' ? <Person fontSize="small" /> : <HomeWork fontSize="small" />}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                                                            <HighlightedText text={item.cliente?.nome || 'Lançamento Avulso'} highlight={debouncedSearchText} />
                                                        </Typography>
                                                        {/* LINHA ABAIXO DO CÓDIGO CORRIGIDA */}
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {item.negociacaoCodigo
                                                                ? `Contrato: ${item.negociacaoCodigo}`
                                                                : (item.imovel?.codigo || item.imovel?.titulo || 'Sem vínculo')}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>

                                                    {/* 1ª Linha: Código (Prioriza Contrato, depois Imóvel) */}
                                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', lineHeight: 1 }}>
                                                        {item.negociacaoCodigo
                                                            ? `CONTRATO: ${item.negociacaoCodigo}`
                                                            : (item.imovel?.codigo || item.imovel?.titulo || 'AVULSO')}
                                                    </Typography>

                                                    {/* 2ª Linha: Nº da Parcela / Repasse */}
                                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, lineHeight: 1 }}>
                                                        {item.parcelaNumero
                                                            ? `${item.parcelaNumero}ª ${item.tipo === 'RECEITA' ? 'Parcela' : 'Repasse'}`
                                                            : 'Lançamento Único'}
                                                    </Typography>

                                                    {/* 3ª Linha: Venda/Repasse (Descrição do sistema) */}
                                                    <Typography variant="body2" sx={{ lineHeight: 1.2, mt: 0.3 }}>
                                                        <HighlightedText text={item.descricao} highlight={debouncedSearchText} />
                                                    </Typography>

                                                    {/* Categoria (Chip menor abaixo de tudo) */}
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Chip
                                                            label={item.categoria}
                                                            size="small"
                                                            sx={{
                                                                height: 16,
                                                                fontSize: '0.6rem',
                                                                textTransform: 'uppercase',
                                                                fontWeight: 'bold',
                                                                // Lógica de cores baseada na categoria - adaptada para tema escuro
                                                                ...(item.categoria?.toUpperCase() === 'VENDA' && {
                                                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                                                        ? theme.palette.success.dark
                                                                        : '#e8f5e9',
                                                                    color: (theme) => theme.palette.mode === 'dark'
                                                                        ? theme.palette.success.contrastText
                                                                        : '#2e7d32',
                                                                }),
                                                                ...(item.categoria?.toUpperCase() === 'REPASSE' && {
                                                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                                                        ? theme.palette.warning.dark
                                                                        : '#fff9c4',
                                                                    color: (theme) => theme.palette.mode === 'dark'
                                                                        ? theme.palette.warning.contrastText
                                                                        : '#f57f17',
                                                                }),
                                                                // Estilo padrão para outras categorias
                                                                ...(item.categoria?.toUpperCase() !== 'VENDA' && item.categoria?.toUpperCase() !== 'REPASSE' && {
                                                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                                                        ? theme.palette.grey[800]
                                                                        : theme.palette.grey[100],
                                                                    color: (theme) => theme.palette.mode === 'dark'
                                                                        ? theme.palette.grey[300]
                                                                        : theme.palette.grey[700],
                                                                })
                                                            }}
                                                        />
                                                    </Box>

                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold" color={item.tipo === 'RECEITA' ? 'success.main' : 'error.main'}>
                                                    {item.tipo === 'RECEITA' ? '+ ' : '- '}
                                                    {formatCurrency(item.valor)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={item.status}
                                                    size="small"
                                                    color={getStatusColor(item.status)}
                                                    sx={{ fontWeight: 'bold', fontSize: '0.7rem', minWidth: 80 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                    {item.status === 'PENDENTE' && (
                                                        <Tooltip title="Baixar Título">
                                                            <IconButton color="success" onClick={() => handleDarBaixa(item._id)} size="small">
                                                                <CheckCircle fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <IconButton
                                                        onClick={() => handleDownload(item._id)}
                                                        disabled={baixando === item._id}
                                                        size="small"
                                                    >
                                                        {baixando === item._id ? <CircularProgress size={18} /> : <Download fontSize="small" />}
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={totalItems}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            labelRowsPerPage="Linhas:"
                        />
                    </TableContainer>
                </Box>

                {/* COLUNA LATERAL: CARDS DE RESUMO */}
                <Box sx={{
                    flex: 3.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    position: { lg: 'sticky' },
                    top: 24,
                    height: 'fit-content'
                }}>
                    <Typography variant="h6" fontWeight="bold">Resumo do Período</Typography>

                    <FinanceiroSummary
                        receitas={resumo.totalRecebido}
                        despesas={resumo.totalPago}
                        pendentes={resumo.totalPendente}
                        layout="vertical"
                    />

                    <Paper sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                        backgroundImage: (theme) => theme.palette.mode === 'dark'
                            ? 'none'
                            : undefined // Remove gradiente no modo escuro
                    }}>
                        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                            Saldo Gerado no Período
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(resumo.totalRecebido - resumo.totalPago)}
                        </Typography>
                    </Paper>

                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                        Exibindo dados de {new Date(dataInicio).toLocaleDateString()} até {new Date(dataFim).toLocaleDateString()}
                    </Typography>
                </Box>
            </Box>

            <FinanceiroFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={carregarDados}
            />

            <FinanceiroDetalhesModal
                open={detalhesModalOpen}
                onClose={() => { setDetalhesModalOpen(false); setTransacaoSelecionada(null); }}
                data={transacaoSelecionada}
            />

            {/* No final do return, junto aos outros modais */}
            <FinanceiroPreviewTooltip
                anchorEl={anchorElPreview}
                handleClose={handlePopoverClose}
                data={previewData}
            />
        </Box>
    );
};