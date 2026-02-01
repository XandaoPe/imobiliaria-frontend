import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
    CircularProgress, Avatar, TextField, InputAdornment, Menu, MenuItem, ListSubheader,
    TablePagination, Alert, Stack,
    DialogActions,
    Select,
    DialogContent,
    DialogTitle,
    Dialog
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
type TipoLancamentoFilter = 'TODOS' | 'RECEITA' | 'DESPESA';
type CategoriaFilter = 'TODOS' | 'ALUGUEL' | 'VENDA' | 'COMISSAO' | 'REPASSE' | 'MANUTENCAO' | 'OPERACIONAL' | 'OUTROS';

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

interface ResumoFinanceiro {
    totalRecebido: number;
    totalPago: number;
    totalPendente: number;
    receitasBruto?: number;
    despesasBruto?: number;
    receitasPendentes?: number;
    despesasPendentes?: number;
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

    // --- ESTADOS DE DATAS (CORRIGIDOS PARA FUSO HORÁRIO) ---
    const getPrimeiroDiaMes = (): string => {
        const d = new Date();
        // Corrige fuso horário: cria data no fuso local
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    };

    const getUltimoDiaMes = (): string => {
        const d = new Date();
        // 6 meses à frente, último dia do mês
        const targetDate = new Date(d.getFullYear(), d.getMonth() + 6 + 1, 0);
        const year = targetDate.getFullYear();
        const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
        const day = targetDate.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [dataInicio, setDataInicio] = useState<string>(getPrimeiroDiaMes());
    const [dataFim, setDataFim] = useState<string>(getUltimoDiaMes());

    // Estados de Dados
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [resumo, setResumo] = useState<ResumoFinanceiro>({
        totalPendente: 0,
        totalRecebido: 0,
        totalPago: 0,
        receitasBruto: 0,
        despesasBruto: 0,
        receitasPendentes: 0,
        despesasPendentes: 0
    });
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

    const [filterTipo, setFilterTipo] = useState<TipoLancamentoFilter>('TODOS');
    const [filterCategoria, setFilterCategoria] = useState<CategoriaFilter>('TODOS');
    const [valorMin, setValorMin] = useState<number | ''>('');
    const [valorMax, setValorMax] = useState<number | ''>('');
    const [imovelCodigo, setImovelCodigo] = useState<string>('');
    const [negociacaoCodigo, setNegociacaoCodigo] = useState<string>('');

    const [filtrosModalOpen, setFiltrosModalOpen] = useState(false);

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

    const formatarDataParaExibicao = (dataString: string): string => {
        if (!dataString) return '';

        const [year, month, day] = dataString.split('-').map(Number);
        const data = new Date(year, month - 1, day);
        return data.toLocaleDateString('pt-BR');
    };

    const formatarDataString = (dataString: string): string => {
        if (!dataString) return '';
        // dataString já está no formato "YYYY-MM-DD"
        const [year, month, day] = dataString.split('-');
        return `${day}/${month}/${year}`;
    };

    const carregarDados = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page: page + 1,
                limit: rowsPerPage,
                dataInicio: dataInicio,
                dataFim: dataFim
            };

            // Aplicar todos os filtros
            if (debouncedSearchText) params.search = debouncedSearchText;
            if (filterStatus !== 'TODOS') params.status = filterStatus;
            if (filterTipo !== 'TODOS') params.tipo = filterTipo;
            if (filterCategoria !== 'TODOS') params.categoria = filterCategoria;
            if (valorMin !== '') params.valorMin = valorMin;
            if (valorMax !== '') params.valorMax = valorMax;
            if (imovelCodigo) params.imovelCodigo = imovelCodigo;
            if (negociacaoCodigo) params.negociacaoCodigo = negociacaoCodigo;

            // PARA O RESUMO, USA OS MESMOS PARÂMETROS QUE A LISTA
            const resumoParams = { ...params };
            // Remove parâmetros de paginação do resumo
            delete resumoParams.page;
            delete resumoParams.limit;

            const [resList, resSum] = await Promise.all([
                financeiroService.listar(params),
                financeiroService.getResumo(resumoParams) // ← AGORA COM TODOS OS FILTROS
            ]);

            const listaData = resList?.data?.data || [];
            const total = resList?.data?.total || 0;
            setTransacoes(listaData);
            setTotalItems(total);

            const s = resSum?.data || {};
            setResumo({
                totalRecebido: s.receitas ?? 0,
                totalPago: s.despesas ?? 0,
                totalPendente: s.pendentes ?? 0,
                // Adicionar os dados brutos para o Summary
                receitasBruto: s.receitasBruto ?? s.receitas ?? 0,
                despesasBruto: s.despesasBruto ?? s.despesas ?? 0,
                receitasPendentes: s.receitasPendentes ?? s.pendentes ?? 0,
                despesasPendentes: s.despesasPendentes ?? 0
            });

        } catch (err) {
            console.error("Erro ao buscar dados financeiros", err);
            setError("Não foi possível carregar os lançamentos financeiros.");
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, debouncedSearchText, filterStatus, filterTipo, filterCategoria,
        valorMin, valorMax, imovelCodigo, negociacaoCodigo, dataInicio, dataFim]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [searchText]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const limparFiltros = () => {
        setFilterStatus('TODOS');
        setFilterTipo('TODOS');
        setFilterCategoria('TODOS');
        setValorMin('');
        setValorMax('');
        setImovelCodigo('');
        setNegociacaoCodigo('');
        setSearchText('');
        setDebouncedSearchText('');
        setPage(0);
        setFiltrosModalOpen(false);
    };

    const handleMenuClose = () => setAnchorElFilter(null);

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
                    {/* BARRA DE FILTROS SIMPLIFICADA */}
                    <Paper sx={{
                        p: 2,
                        borderRadius: 2,
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        bgcolor: 'background.paper'
                    }}>
                        {/* Busca Geral */}
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

                        {/* BOTÃO PARA ABRIR FILTROS AVANÇADOS */}
                        <Button
                            variant="outlined"
                            onClick={() => setFiltrosModalOpen(true)}
                            startIcon={<FilterListIcon />}
                            sx={{ whiteSpace: 'nowrap', textTransform: 'none', height: 40 }}
                        >
                            Filtros Avançados
                        </Button>

                        {/* BOTÃO LIMPAR FILTROS (visível apenas se houver filtros ativos) */}
                        {(filterStatus !== 'TODOS' || filterTipo !== 'TODOS' || filterCategoria !== 'TODOS' ||
                            valorMin !== '' || valorMax !== '' || imovelCodigo !== '' || negociacaoCodigo !== '') && (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={limparFiltros}
                                    sx={{ textTransform: 'none', height: 40 }}
                                >
                                    Limpar Filtros
                                </Button>
                            )}
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
                                                        {formatarDataString(item.dataVencimento)}
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
                        receitasBruto={resumo.receitasBruto}
                        despesasBruto={resumo.despesasBruto}
                        receitasPendentes={resumo.receitasPendentes}
                        despesasPendentes={resumo.despesasPendentes}
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
                        Exibindo dados de {formatarDataParaExibicao(dataInicio)} até {formatarDataParaExibicao(dataFim)}
                    </Typography>
                </Box>
            </Box>

            {/* MODAL DE FILTROS AVANÇADOS */}
            <Dialog
                open={filtrosModalOpen}
                onClose={() => setFiltrosModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    pb: 2
                }}>
                    <Typography variant="h6" fontWeight="bold">Filtros Avançados</Typography>
                    <IconButton onClick={() => setFiltrosModalOpen(false)} size="small">
                        <ClearIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ pt: 3 }}>
                    <Stack spacing={3}>
                        {/* FILTROS BÁSICOS */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Filtros Básicos</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
                                {/* STATUS */}
                                <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Status</Typography>
                                    <Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as StatusFinanceiroFilter)}
                                        size="small"
                                        fullWidth
                                    >
                                        {(['TODOS', 'PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO'] as StatusFinanceiroFilter[]).map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status.charAt(0) + status.slice(1).toLowerCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                {/* TIPO */}
                                <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tipo</Typography>
                                    <Select
                                        value={filterTipo}
                                        onChange={(e) => setFilterTipo(e.target.value as TipoLancamentoFilter)}
                                        size="small"
                                        fullWidth
                                    >
                                        {(['TODOS', 'RECEITA', 'DESPESA'] as TipoLancamentoFilter[]).map((tipo) => (
                                            <MenuItem key={tipo} value={tipo}>
                                                {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                {/* CATEGORIA */}
                                <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Categoria</Typography>
                                    <Select
                                        value={filterCategoria}
                                        onChange={(e) => setFilterCategoria(e.target.value as CategoriaFilter)}
                                        size="small"
                                        fullWidth
                                    >
                                        {(['TODOS', 'ALUGUEL', 'VENDA', 'COMISSAO', 'REPASSE', 'MANUTENCAO', 'OPERACIONAL', 'OUTROS'] as CategoriaFilter[]).map((cat) => (
                                            <MenuItem key={cat} value={cat}>
                                                {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </Stack>
                        </Box>

                        {/* FILTROS DE VALOR */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Filtros por Valor</Typography>
                            <Stack direction="row" spacing={2} alignItems="flex-end">
                                <TextField
                                    label="Valor Mínimo"
                                    type="number"
                                    size="small"
                                    value={valorMin}
                                    onChange={(e) => setValorMin(e.target.value === '' ? '' : Number(e.target.value))}
                                    InputProps={{ inputProps: { min: 0 } }}
                                    sx={{ width: 150 }}
                                />
                                <Typography variant="body2" color="text.secondary">até</Typography>
                                <TextField
                                    label="Valor Máximo"
                                    type="number"
                                    size="small"
                                    value={valorMax}
                                    onChange={(e) => setValorMax(e.target.value === '' ? '' : Number(e.target.value))}
                                    InputProps={{ inputProps: { min: 0 } }}
                                    sx={{ width: 150 }}
                                />
                            </Stack>
                        </Box>

                        {/* FILTROS ESPECÍFICOS */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Filtros Específicos</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
                                <TextField
                                    label="Código do Imóvel"
                                    size="small"
                                    value={imovelCodigo}
                                    onChange={(e) => setImovelCodigo(e.target.value)}
                                    sx={{ width: 200 }}
                                />

                                <TextField
                                    label="Código da Negociação"
                                    size="small"
                                    value={negociacaoCodigo}
                                    onChange={(e) => setNegociacaoCodigo(e.target.value)}
                                    sx={{ width: 200 }}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        onClick={limparFiltros}
                        color="secondary"
                        sx={{ textTransform: 'none' }}
                    >
                        Limpar Todos
                    </Button>
                    <Button
                        onClick={() => setFiltrosModalOpen(false)}
                        variant="contained"
                        sx={{ textTransform: 'none' }}
                    >
                        Aplicar Filtros
                    </Button>
                </DialogActions>
            </Dialog>

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