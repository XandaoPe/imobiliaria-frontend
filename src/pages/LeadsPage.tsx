import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, TextField,
    InputAdornment, CircularProgress, Button, Menu, MenuItem,
    Divider, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
    Stack, useTheme
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import SendIcon from '@mui/icons-material/Send';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CloseIcon from '@mui/icons-material/Close';
import { API_URL } from '../services/api';
import { NegociacaoFormModal } from '../components/NegociacaoFormModal';

// --- Função de Som Suave ---
const playBeep = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
};

export const LeadsPage: React.FC = () => {
    const theme = useTheme(); // Adicionado hook useTheme
    const { user } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const lastLeadCount = useRef(0);
    const hasPlayedInitialAlert = useRef(false);
    const [filterStatus, setFilterStatus] = useState('PENDENTES');
    const [openHistory, setOpenHistory] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [newNote, setNewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [openNegociacaoModal, setOpenNegociacaoModal] = useState(false);
    const [negociacaoData, setNegociacaoData] = useState<any>(null);

    // Estado para o novo Dialog de Decisão de Fechamento
    const [openFinishDialog, setOpenFinishDialog] = useState(false);

    // BUSCA COM FILTROS
    const fetchLeads = useCallback(async (isPolling = false) => {
        if (!isPolling) setLoading(true);

        try {
            const params: any = {};
            if (searchText?.trim()) params.search = searchText;

            if (filterStatus === 'PENDENTES') {
                params.status = 'NOVO,EM_ANDAMENTO';
            } else if (filterStatus !== 'TODOS') {
                params.status = filterStatus;
            }

            const response = await axios.get(API_URL + '/leads', {
                headers: { Authorization: `Bearer ${user?.token}` },
                params: params
            });

            const currentLeads = response.data;

            if (!isPolling && !hasPlayedInitialAlert.current) {
                const hasPending = currentLeads.some((l: any) => l.status !== 'CONCLUIDO');
                if (hasPending) {
                    playBeep();
                }
                hasPlayedInitialAlert.current = true;
            }

            if (isPolling && currentLeads.length > lastLeadCount.current) {
                playBeep();
            }

            setLeads(currentLeads);
            lastLeadCount.current = currentLeads.length;
        } catch (error) {
            console.error("Erro ao carregar leads", error);
        } finally {
            setLoading(false);
        }
    }, [user?.token, searchText, filterStatus]);

    useEffect(() => {
        const timer = setTimeout(() => fetchLeads(), 400);
        return () => clearTimeout(timer);
    }, [searchText, filterStatus, fetchLeads]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchLeads(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchLeads]);

    const handleUpdateStatus = async (id: string, novoStatus: string) => {
        await axios.patch(`${API_URL}/leads/${id}/status`,
            { status: novoStatus },
            { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        fetchLeads();
        window.dispatchEvent(new Event('updateLeadsCount'));
    };

    const handleOpenHistory = (lead: any) => {
        setSelectedLead(lead);
        setOpenHistory(true);
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSaving(true);
        try {
            await axios.post(`${API_URL}/leads/${selectedLead._id}/historico`,
                {
                    descricao: newNote,
                    autor: user?.nome || 'Consultor' // Adicionado autor para consistência
                },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            setNewNote('');
            await fetchLeads();
            setOpenHistory(false);
        } catch (error) {
            console.error("Erro ao salvar histórico", error);
        } finally {
            setIsSaving(false);
        }
    };

    // --- FUNÇÃO PARA ABRIR O DIALOG DE CONCLUSÃO ---
    const handleOpenFinishDecision = (lead: any) => {
        setSelectedLead(lead);
        setOpenFinishDialog(true);
    };

    // --- LOGICA DE CONVERSÃO PARA NEGOCIAÇÃO CORRIGIDA ---
    const handleStartNegotiation = async () => {
        if (!selectedLead) return;

        setIsSaving(true);
        try {
            // 1. Grava o histórico de "Iniciado Negociação" no LEAD antes de concluir
            await axios.post(`${API_URL}/leads/${selectedLead._id}/historico`,
                {
                    descricao: "Iniciado Negociação",
                    autor: user?.nome || 'Consultor',
                    data: new Date().toISOString()
                },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            // 2. Prepara os dados para a modal de negociação
            setNegociacaoData({
                cliente: selectedLead.clienteId || null,
                imovel: selectedLead.imovel || null
            });

            // 3. Atualiza o status do lead para CONCLUIDO
            await axios.patch(`${API_URL}/leads/${selectedLead._id}/status`,
                { status: 'CONCLUIDO' },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            // 4. Fecha controles e abre a modal de Nova Negociação
            setOpenHistory(false);
            setOpenFinishDialog(false);
            setOpenNegociacaoModal(true);

            await fetchLeads();
            window.dispatchEvent(new Event('updateLeadsCount'));

        } catch (error) {
            console.error("Erro ao converter lead e gravar histórico", error);
            alert("Erro ao iniciar negociação no histórico do lead.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- APENAS CONCLUIR ---
    const handleJustFinish = async () => {
        if (!selectedLead) return;
        setIsSaving(true);
        try {
            // Opcional: Gravar que foi concluído sem venda no histórico
            await axios.post(`${API_URL}/leads/${selectedLead._id}/historico`,
                {
                    descricao: "Atendimento Concluído/Encerrado",
                    autor: user?.nome || 'Consultor'
                },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            await handleUpdateStatus(selectedLead._id, 'CONCLUIDO');
            setOpenFinishDialog(false);
        } catch (error) {
            console.error("Erro ao concluir lead", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>Gestão de Leads</Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por nome ou telefone..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'background.paper',
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                        minWidth: 200,
                        height: 56,
                        borderColor: 'divider',
                        color: 'text.primary'
                    }}
                >
                    {filterStatus === 'PENDENTES' ? 'Pendentes (Novos/Andamento)' :
                        filterStatus === 'TODOS' ? 'Todos os Status' : filterStatus}
                </Button>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{
                        sx: {
                            bgcolor: 'background.paper',
                            border: `1px solid ${theme.palette.divider}`
                        }
                    }}
                >
                    <MenuItem
                        onClick={() => { setFilterStatus('PENDENTES'); setAnchorEl(null); }}
                        sx={{ color: 'text.primary' }}
                    >
                        <b>Pendentes (Padrão)</b>
                    </MenuItem>
                    <MenuItem
                        onClick={() => { setFilterStatus('TODOS'); setAnchorEl(null); }}
                        sx={{ color: 'text.primary' }}
                    >
                        Todos
                    </MenuItem>
                    <Divider sx={{ borderColor: 'divider' }} />
                    <MenuItem
                        onClick={() => { setFilterStatus('NOVO'); setAnchorEl(null); }}
                        sx={{ color: 'text.primary' }}
                    >
                        Apenas Novos
                    </MenuItem>
                    <MenuItem
                        onClick={() => { setFilterStatus('EM_ANDAMENTO'); setAnchorEl(null); }}
                        sx={{ color: 'text.primary' }}
                    >
                        Apenas Em Andamento
                    </MenuItem>
                    <MenuItem
                        onClick={() => { setFilterStatus('CONCLUIDO'); setAnchorEl(null); }}
                        sx={{ color: 'text.primary' }}
                    >
                        Apenas Concluídos
                    </MenuItem>
                </Menu>
            </Box>

            <TableContainer
                component={Paper}
                sx={{
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`
                }}
            >
                <Table>
                    <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light' }}>
                        <TableRow>
                            <TableCell sx={{ color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText', fontWeight: 'bold' }}>
                                Data
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText', fontWeight: 'bold' }}>
                                Cliente
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText', fontWeight: 'bold' }}>
                                Imóvel
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText', fontWeight: 'bold' }}>
                                Status
                            </TableCell>
                            <TableCell align="center" sx={{ color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText', fontWeight: 'bold' }}>
                                Ações
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <CircularProgress sx={{ m: 2 }} />
                                </TableCell>
                            </TableRow>
                        ) : leads.map((lead) => (
                            <TableRow
                                key={lead._id}
                                sx={{
                                    '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'grey.50'
                                    }
                                }}
                            >
                                <TableCell>
                                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                        {new Intl.DateTimeFormat('pt-BR', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        }).format(new Date(lead.createdAt))}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                                        {lead.nome}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {lead.contato}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {lead.imovel ? (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                {lead.imovel.titulo}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                                {lead.imovel.endereco}
                                                {lead.imovel.cidade ? ` • ${lead.imovel.cidade}` : ''}
                                            </Typography>
                                            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                                                {lead.imovel.para_venda && (
                                                    <Chip
                                                        label="Venda"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: '10px',
                                                            height: '18px',
                                                            borderColor: 'primary.main',
                                                            color: 'primary.main'
                                                        }}
                                                    />
                                                )}
                                                {lead.imovel.para_aluguel && (
                                                    <Chip
                                                        label="Locação"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: '10px',
                                                            height: '18px',
                                                            borderColor: 'secondary.main',
                                                            color: 'secondary.main'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                            Imóvel não identificado
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={lead.status.replace('_', ' ')}
                                        color={
                                            lead.status === 'NOVO' ? 'error' :
                                                lead.status === 'EM_ANDAMENTO' ? 'info' :
                                                    lead.status === 'CONCLUIDO' ? 'success' : 'warning'
                                        }
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                        <Tooltip title="Histórico de Conversas/Inicio de Negociação">
                                            <IconButton
                                                sx={{ color: 'text.secondary' }}
                                                onClick={() => handleOpenHistory(lead)}
                                            >
                                                <HistoryIcon />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="WhatsApp">
                                            <IconButton
                                                sx={{ color: 'success.main' }}
                                                onClick={() => window.open(`https://wa.me/${lead.contato.replace(/\D/g, '')}`)}
                                            >
                                                <WhatsAppIcon />
                                            </IconButton>
                                        </Tooltip>

                                        {lead.status === 'NOVO' && (
                                            <Tooltip title="Iniciar Atendimento">
                                                <IconButton
                                                    sx={{ color: 'info.main' }}
                                                    onClick={() => handleUpdateStatus(lead._id, 'EM_ANDAMENTO')}
                                                >
                                                    <CheckCircleOutlineIcon sx={{ opacity: 0.5 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {lead.status !== 'CONCLUIDO' && (
                                            <Tooltip title="Concluir Atendimento ou Iniciar Negociação">
                                                <IconButton
                                                    sx={{ color: 'primary.main' }}
                                                    onClick={() => handleOpenFinishDecision(lead)}
                                                >
                                                    <CheckCircleOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {lead.status === 'CONCLUIDO' && (
                                            <Tooltip title="Reabrir / Voltar para Em Andamento">
                                                <IconButton
                                                    sx={{ color: 'warning.main' }}
                                                    onClick={() => {
                                                        if (window.confirm(`Deseja reabrir o atendimento de ${lead.nome}?`)) {
                                                            handleUpdateStatus(lead._id, 'EM_ANDAMENTO');
                                                        }
                                                    }}
                                                >
                                                    <FilterListIcon sx={{ transform: 'scaleX(-1)' }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* DIALOG DE HISTÓRICO */}
            <Dialog
                open={openHistory}
                onClose={() => setOpenHistory(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper'
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    pb: 2
                }}>
                    <Typography variant="h6" component="span" sx={{ color: 'text.primary' }}>
                        Histórico: {selectedLead?.nome}
                    </Typography>

                    {selectedLead?.status !== 'CONCLUIDO' && (
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<HandshakeIcon />}
                            onClick={handleStartNegotiation}
                            disabled={isSaving}
                        >
                            Iniciar Negociação
                        </Button>
                    )}
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
                    <List>
                        {selectedLead?.historico?.map((h: any, index: number) => (
                            <ListItem
                                key={index}
                                alignItems="flex-start"
                                sx={{
                                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                    mb: 1,
                                    borderRadius: 1
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography sx={{ color: 'text.primary' }}>
                                            {h.descricao}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography sx={{ color: 'text.secondary' }}>
                                            {`${new Date(h.data).toLocaleString('pt-BR')} - por ${h.autor}`}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                        {(!selectedLead?.historico || selectedLead.historico.length === 0) && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Nenhuma conversa registrada ainda.
                            </Typography>
                        )}
                    </List>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            label="Nova anotação..."
                            variant="outlined"
                            size="small"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                            disabled={isSaving}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'background.paper'
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddNote}
                            endIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                            disabled={!newNote.trim() || isSaving}
                        >
                            Salvar
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={() => setOpenHistory(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* --- DIALOG: DECISÃO DE CONCLUSÃO --- */}
            <Dialog
                open={openFinishDialog}
                onClose={() => setOpenFinishDialog(false)}
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper'
                    }
                }}
            >
                <DialogTitle sx={{ color: 'text.primary' }}>
                    Concluir Atendimento
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: 'text.primary' }}>
                        Como deseja finalizar o atendimento de <b>{selectedLead?.nome}</b>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'center', bgcolor: 'background.default' }}>
                    <Stack spacing={2} direction="row">
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<CloseIcon />}
                            onClick={() => setOpenFinishDialog(false)}
                            sx={{ color: 'text.primary', borderColor: 'divider' }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleJustFinish}
                            disabled={isSaving}
                        >
                            Concluir e Encerrar
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<HandshakeIcon />}
                            onClick={handleStartNegotiation}
                            disabled={isSaving}
                        >
                            Concluir e Iniciar Negociação
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            <NegociacaoFormModal
                open={openNegociacaoModal}
                initialData={negociacaoData}
                onClose={() => setOpenNegociacaoModal(false)}
                onSuccess={() => {
                    setOpenNegociacaoModal(false);
                    fetchLeads();
                }}
            />

        </Box>
    );
};