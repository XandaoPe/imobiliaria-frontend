import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, TextField,
    InputAdornment, CircularProgress, Button, Menu, MenuItem,
    Divider, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
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
                { descricao: newNote },
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

    // --- FUNÇÃO DE NEGOCIAÇÃO COM CONFIRMAÇÃO ---
    const handleStartNegotiation = async () => {
        if (!selectedLead) return;

        if (window.confirm(`Deseja converter o lead ${selectedLead.nome} em uma negociação?`)) {
            setIsSaving(true);
            try {
                // Preparamos os dados. Se o backend já vinculou um Cliente ID ao Lead, usamos ele.
                setNegociacaoData({
                    cliente: selectedLead.clienteId || null, // Assume que o lead pode ter a ref do cliente
                    imovel: selectedLead.imovel || null
                });

                // Opcional: Marcar lead como concluído/convertido
                await axios.patch(`${API_URL}/leads/${selectedLead._id}/status`,
                    { status: 'CONCLUIDO' },
                    { headers: { Authorization: `Bearer ${user?.token}` } }
                );

                setOpenHistory(false);
                setOpenNegociacaoModal(true);
                fetchLeads();
            } catch (error) {
                console.error("Erro ao converter lead", error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>Gestão de Leads</Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por nome ou telefone..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
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
                    sx={{ minWidth: 200, height: 56 }}
                >
                    {filterStatus === 'PENDENTES' ? 'Pendentes (Novos/Andamento)' :
                        filterStatus === 'TODOS' ? 'Todos os Status' : filterStatus}
                </Button>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem onClick={() => { setFilterStatus('PENDENTES'); setAnchorEl(null); }}>
                        <b>Pendentes (Padrão)</b>
                    </MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('TODOS'); setAnchorEl(null); }}>Todos</MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { setFilterStatus('NOVO'); setAnchorEl(null); }}>Apenas Novos</MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('EM_ANDAMENTO'); setAnchorEl(null); }}>Apenas Em Andamento</MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('CONCLUIDO'); setAnchorEl(null); }}>Apenas Concluídos</MenuItem>
                </Menu>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Imóvel</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center"><CircularProgress sx={{ m: 2 }} /></TableCell></TableRow>
                        ) : leads.map((lead) => (
                            <TableRow key={lead._id}>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Intl.DateTimeFormat('pt-BR', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        }).format(new Date(lead.createdAt))}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2">{lead.nome}</Typography>
                                    <Typography variant="caption" color="text.secondary">{lead.contato}</Typography>
                                </TableCell>
                                <TableCell>
                                    {lead.imovel ? (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                {lead.imovel.titulo}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                {lead.imovel.endereco}
                                                {lead.imovel.cidade ? ` • ${lead.imovel.cidade}` : ''}
                                            </Typography>
                                            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                                                {lead.imovel.para_venda && (
                                                    <Chip label="Venda" size="small" variant="outlined" sx={{ fontSize: '10px', height: '18px' }} />
                                                )}
                                                {lead.imovel.para_aluguel && (
                                                    <Chip label="Locação" size="small" variant="outlined" sx={{ fontSize: '10px', height: '18px' }} />
                                                )}
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.disabled">Imóvel não identificado</Typography>
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
                                        <Tooltip title="Histórico de Conversas">
                                            <IconButton color="secondary" onClick={() => handleOpenHistory(lead)}>
                                                <HistoryIcon />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="WhatsApp">
                                            <IconButton
                                                color="success"
                                                onClick={() => window.open(`https://wa.me/${lead.contato.replace(/\D/g, '')}`)}
                                            >
                                                <WhatsAppIcon />
                                            </IconButton>
                                        </Tooltip>

                                        {lead.status === 'NOVO' && (
                                            <Tooltip title="Iniciar Atendimento">
                                                <IconButton
                                                    color="info"
                                                    onClick={() => handleUpdateStatus(lead._id, 'EM_ANDAMENTO')}
                                                >
                                                    <CheckCircleOutlineIcon sx={{ opacity: 0.5 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {lead.status !== 'CONCLUIDO' && (
                                            <Tooltip title="Concluir Atendimento">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => {
                                                        if (window.confirm(`Deseja realmente concluir o atendimento de ${lead.nome}?`)) {
                                                            handleUpdateStatus(lead._id, 'CONCLUIDO');
                                                        }
                                                    }}
                                                >
                                                    <CheckCircleOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {lead.status === 'CONCLUIDO' && (
                                            <Tooltip title="Reabrir / Voltar para Em Andamento">
                                                <IconButton
                                                    color="warning"
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

            <Dialog open={openHistory} onClose={() => setOpenHistory(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="span">Histórico: {selectedLead?.nome}</Typography>

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
                <DialogContent dividers>
                    <List>
                        {selectedLead?.historico?.map((h: any, index: number) => (
                            <ListItem key={index} alignItems="flex-start" sx={{ bgcolor: '#f9f9f9', mb: 1, borderRadius: 1 }}>
                                <ListItemText
                                    primary={h.descricao}
                                    secondary={`${new Date(h.data).toLocaleString('pt-BR')} - por ${h.autor}`}
                                />
                            </ListItem>
                        ))}
                        {(!selectedLead?.historico || selectedLead.historico.length === 0) && (
                            <Typography variant="body2" color="text.secondary">Nenhuma conversa registrada ainda.</Typography>
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
                <DialogActions>
                    <Button onClick={() => setOpenHistory(false)}>Fechar</Button>
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