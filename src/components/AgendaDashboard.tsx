import React, { useEffect, useState } from 'react';
import {
    Drawer, Box, Typography, List, ListItem, Chip, IconButton, Tabs, Tab, Badge
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close'; 
import LocationOnIcon from '@mui/icons-material/LocationOn'; 
import PersonIcon from '@mui/icons-material/Person'; 
import api from '../services/api';
import { GerenciarAgendamentoModal } from './GerenciarAgendamentoModal';

interface AgendaLateralProps {
    open: boolean;
    onClose: () => void;
}

type FiltroStatus = 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO' | 'TODOS';

export const AgendaLateral: React.FC<AgendaLateralProps> = ({ open, onClose }) => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
    const [modalManageOpen, setModalManageOpen] = useState(false);
    const [filtro, setFiltro] = useState<FiltroStatus>('PENDENTE');

    const fetchAgendamentos = async () => {
        try {
            const res = await api.get('/agendamentos');
            setAgendamentos(res.data);
        } catch (error) {
            console.error("Erro ao carregar agenda", error);
        }
    };

    useEffect(() => {
        if (open) fetchAgendamentos();
    }, [open]);

    const handleItemClick = (ag: any) => {
        setSelectedAgendamento(ag);
        setModalManageOpen(true);
    };

    const totalPendentes = agendamentos.filter((ag: any) => ag.status === 'PENDENTE').length;

    const agendamentosFiltrados = agendamentos
        .filter((ag: any) => {
            if (filtro === 'TODOS') return true;
            return ag.status === filtro;
        })
        .sort((a: any, b: any) => {
            // ORDEM CRESCENTE: Mais próximo (menor data) para o mais distante (maior data)
            return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'warning';
            case 'CONCLUIDO': return 'success';
            case 'CANCELADO': return 'error';
            default: return 'default';
        }
    };

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                // Garante que o Drawer fique acima de outros elementos
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundImage: 'none' // Remove sombras internas de temas escuros
                    }
                }}
            >
                {/* --- CABEÇALHO --- */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                        <EventIcon color="primary" /> Minha Agenda
                    </Typography>

                    {/* BOTÃO X - Garanti que seja visível */}
                    <IconButton
                        onClick={onClose}
                        size="medium"
                        sx={{
                            color: 'red',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <CloseIcon fontSize="medium" />
                    </IconButton>
                </Box>

                {/* --- FILTROS --- */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={filtro}
                        onChange={(_, newValue) => setFiltro(newValue)}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                minWidth: 0,
                                px: 1
                            }
                        }}
                    >
                        <Tab
                            label={
                                <Badge
                                    badgeContent={totalPendentes}
                                    color="error"
                                    sx={{ '& .MuiBadge-badge': { right: -4, top: 0 } }}
                                >
                                    Pendentes
                                </Badge>
                            }
                            value="PENDENTE"
                        />
                        <Tab label="Concluídos" value="CONCLUIDO" />
                        <Tab label="Cancelados" value="CANCELADO" />
                        <Tab label="Todos" value="TODOS" />
                    </Tabs>
                </Box>

                {/* --- LISTA --- */}
                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {agendamentosFiltrados.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 10, px: 3 }}>
                            <EventIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Nenhum agendamento {filtro.toLowerCase()} encontrado.
                            </Typography>
                        </Box>
                    ) : (
                        agendamentosFiltrados.map((ag: any) => (
                            <ListItem
                                key={ag._id}
                                onClick={() => handleItemClick(ag)}
                                sx={{
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    py: 2,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                        {new Date(ag.dataHora).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às {
                                            new Date(ag.dataHora).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'America/Sao_Paulo' // FORÇA a exibição no fuso de Brasília
                                            })
                                        }
                                    </Typography>
                                    <Chip
                                        label={ag.status}
                                        size="small"
                                        color={getStatusColor(ag.status) as any}
                                        sx={{ fontSize: 9, fontWeight: 'bold', height: 20 }}
                                    />
                                </Box>

                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {ag.imovel?.titulo}
                                </Typography>

                                {ag.imovel?.endereco && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
                                    >
                                        <LocationOnIcon sx={{ fontSize: 14 }} />
                                        {`${ag.imovel.endereco}${ag.imovel.cidade ? ` - ${ag.imovel.cidade}` : ''}`}
                                    </Typography>
                                )}

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    <b>Cliente:</b> {ag.cliente?.nome}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="blue"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2, fontSize: '18' }}
                                >
                                    <PersonIcon sx={{ fontSize: 18}} />
                                    Corretor: <b>{ag.usuarioCorretor?.nome || 'Não informado'}</b>
                                </Typography>

                                {ag.observacoes && ag.observacoes.trim() !== "" && (
                                    <Box sx={{ mt: 1, p: 1, bgcolor: 'action.selected', borderRadius: 1, width: '100%', borderLeft: '3px solid #1976d2' }}>
                                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                                            <strong>Obs:</strong> {ag.observacoes}
                                        </Typography>
                                    </Box>
                                )}
                            </ListItem>
                        ))
                    )}
                </List>
            </Drawer>

            <GerenciarAgendamentoModal
                open={modalManageOpen}
                agendamento={selectedAgendamento}
                onClose={() => setModalManageOpen(false)}
                onUpdate={fetchAgendamentos}
            />
        </>
    );
};