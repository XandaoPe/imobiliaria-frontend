import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, TextField,
    InputAdornment, CircularProgress, Button, Menu, MenuItem
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

// --- Função de Som Suave ---
const playBeep = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Nota Dó
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
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const lastLeadCount = useRef(0);
    const hasPlayedInitialAlert = useRef(false);

    // BUSCA COM FILTROS
    const fetchLeads = useCallback(async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            const params: any = {};
            if (searchText?.trim()) params.search = searchText;
            if (filterStatus !== 'TODOS') params.status = filterStatus;

            const response = await axios.get('http://localhost:5000/leads', {
                headers: { Authorization: `Bearer ${user?.token}` },
                params: params
            });

            const currentLeads = response.data;

            // --- LÓGICA SONORA ---

            // 1. Alerta Inicial (ao carregar a página pela primeira vez)
            if (!isPolling && !hasPlayedInitialAlert.current) {
                const hasPending = currentLeads.some((l: any) => l.status !== 'CONCLUIDO');
                if (hasPending) {
                    playBeep(); // Toca uma vez para avisar que há trabalho pendente
                }
                hasPlayedInitialAlert.current = true;
            }

            // 2. Alerta de Novo Lead (Polling)
            // Se a quantidade atual é maior que a anterior, significa que chegou algo novo
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

    // Efeito para debounce e mudança de filtro
    useEffect(() => {
        const timer = setTimeout(() => fetchLeads(), 400);
        return () => clearTimeout(timer);
    }, [searchText, filterStatus, fetchLeads]);

    // Polling a cada 30 segundos para novos leads
    useEffect(() => {
        const interval = setInterval(() => fetchLeads(true), 30000);
        return () => clearInterval(interval);
    }, [fetchLeads]);

    const handleUpdateStatus = async (id: string, novoStatus: string) => {
        await axios.patch(`http://localhost:5000/leads/${id}/status`,
            { status: novoStatus },
            { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        fetchLeads();
        window.dispatchEvent(new Event('updateLeadsCount'));
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
                    {filterStatus === 'TODOS' ? 'Todos os Status' : filterStatus}
                </Button>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem onClick={() => { setFilterStatus('TODOS'); setAnchorEl(null); }}>Todos</MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('NOVO'); setAnchorEl(null); }}>Novos</MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('EM_ATENDIMENTO'); setAnchorEl(null); }}>Em Atendimento</MenuItem>
                    <MenuItem onClick={() => { setFilterStatus('CONCLUIDO'); setAnchorEl(null); }}>Concluídos</MenuItem>
                </Menu>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Imóvel</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} align="center"><CircularProgress sx={{ m: 2 }} /></TableCell></TableRow>
                        ) : leads.map((lead) => (
                            <TableRow key={lead._id}>
                                <TableCell>
                                    <Typography variant="subtitle2">{lead.nome}</Typography>
                                    <Typography variant="caption" color="text.secondary">{lead.contato}</Typography>
                                </TableCell>
                                <TableCell>{lead.imovel?.titulo || 'N/A'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={lead.status}
                                        color={lead.status === 'NOVO' ? 'error' : lead.status === 'CONCLUIDO' ? 'success' : 'warning'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="WhatsApp">
                                        <IconButton color="success" onClick={() => window.open(`https://wa.me/${lead.contato.replace(/\D/g, '')}`)}>
                                            <WhatsAppIcon />
                                        </IconButton>
                                    </Tooltip>
                                    {lead.status !== 'CONCLUIDO' && (
                                        <Tooltip title="Concluir Atendimento">
                                            <IconButton color="primary" onClick={() => handleUpdateStatus(lead._id, 'CONCLUIDO')}>
                                                <CheckCircleOutlineIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};