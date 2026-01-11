import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, MenuItem, Box, Typography, Divider, Paper,
    Chip, IconButton, Alert, Collapse
} from '@mui/material';
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentIcon from '@mui/icons-material/AddComment';
import api from '../services/api';
import { Negociacao, StatusNegociacao, getStatusLabel } from '../types/negociacao';

interface Props {
    open: boolean;
    negociacao: Negociacao | null;
    onClose: () => void;
    onUpdate: () => void;
}

export const NegociacaoDetailsModal: React.FC<Props> = ({ open, negociacao, onClose, onUpdate }) => {
    const [novaDescricao, setNovaDescricao] = useState('');
    const [novoStatus, setNovoStatus] = useState<StatusNegociacao | ''>('');
    const [loading, setLoading] = useState(false);
    const [dataVisita, setDataVisita] = useState('');
    const [horaVisita, setHoraVisita] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [statusAgenda, setStatusAgenda] = useState<{ loading: boolean, msg: string, color: string } | null>(null);
    const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([]);

    const getHorariosDisponiveis = () => {
        const todos = [];
        for (let h = 6; h <= 22; h++) {
            const hora = String(h).padStart(2, '0');
            todos.push(`${hora}:00`);
            if (h !== 22) todos.push(`${hora}:30`);
        }

        const agoraBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const ano = agoraBr.getFullYear();
        const mes = String(agoraBr.getMonth() + 1).padStart(2, '0');
        const dia = String(agoraBr.getDate()).padStart(2, '0');
        const hojeStr = `${ano}-${mes}-${dia}`;

        const horaAtual = agoraBr.getHours();
        const minAtual = agoraBr.getMinutes();

        return todos.filter(h => {
            if (horariosBloqueados.includes(h)) return false;
            if (dataVisita === hojeStr) {
                const [hSlot, mSlot] = h.split(':').map(Number);
                if (hSlot < horaAtual) return false;
                if (hSlot === horaAtual && mSlot <= minAtual) return false;
            }
            return true;
        });
    };

    useEffect(() => {
        const verificar = async () => {
            if (!negociacao?.imovel?._id || !dataVisita || !horaVisita || novoStatus !== 'VISITA') {
                setStatusAgenda(null);
                return;
            }

            const dataCompleta = `${dataVisita}T${horaVisita}:00`;
            setStatusAgenda({ loading: true, msg: 'Verificando agenda...', color: 'info.main' });

            try {
                const { data } = await api.get(`/agendamentos/check-disponibilidade`, {
                    params: { data: dataCompleta }
                });

                if (data.disponivel) {
                    setStatusAgenda({ loading: false, msg: '✅ Horário disponível', color: 'success.main' });
                } else {
                    setStatusAgenda({
                        loading: false,
                        msg: '⚠️ Atenção: Já existe uma visita ativa neste horário!',
                        color: 'error.main'
                    });
                }
            } catch (e) {
                setStatusAgenda(null);
            }
        };
        verificar();
    }, [dataVisita, horaVisita, novoStatus, negociacao?.imovel?._id]);

    useEffect(() => {
        setNovaDescricao('');
        setNovoStatus('');
        setDataVisita('');
        setHoraVisita('');
        setErrorMsg(null);
        setStatusAgenda(null);
    }, [open, negociacao]);

    useEffect(() => {
        const buscarOcupados = async () => {
            if (dataVisita && negociacao?.imovel?._id) {
                try {
                    const { data } = await api.get('/agendamentos/horarios-ocupados', {
                        params: { data: dataVisita }
                    });
                    setHorariosBloqueados(data);
                } catch (e) { console.error(e); }
            }
        };
        buscarOcupados();
    }, [dataVisita, negociacao?.imovel?._id]);

    if (!negociacao) return null;

    const handleAddHistorico = async () => {
        if (!novaDescricao && !novoStatus) return;
        if (novoStatus === 'VISITA' && (!dataVisita || !horaVisita)) {
            setErrorMsg("Por favor, informe a data e hora para o agendamento da visita.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            let dataAgendamentoCompleta = undefined;
            if (novoStatus === 'VISITA') {
                dataAgendamentoCompleta = `${dataVisita}T${horaVisita}:00-03:00`;
            }

            await api.patch(`/negociacoes/${negociacao._id}`, {
                status: novoStatus || undefined,
                descricao: novaDescricao || undefined,
                dataAgendamento: dataAgendamentoCompleta
            });

            onUpdate();
            onClose();
        } catch (error: any) {
            const mensagem = error.response?.data?.message || "Erro ao salvar interação.";
            setErrorMsg(Array.isArray(mensagem) ? mensagem[0] : mensagem);
        } finally {
            setLoading(false);
        }
    };

    // ⭐️ LOGICA DE FORMATAÇÃO DE ENDEREÇO
    const formatEnderecoCliente = () => {
        const cliente = negociacao.cliente;
        if (!cliente) return 'Cliente não identificado';

        // Verifica se os campos existem no objeto vindo do banco
        if (!cliente.endereco && !cliente.cidade) return 'Endereço não cadastrado';

        const partes = [];
        if (cliente.endereco) partes.push(cliente.endereco);
        if (cliente.cidade) partes.push(cliente.cidade);

        return partes.join(' — ');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Detalhes da Negociação</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ bgcolor: '#fbfbfb' }}>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>

                    {/* CARD CLIENTE */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="overline" color="primary" fontWeight="bold">Dados do Cliente</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">NOME</Typography>
                                <Typography variant="body2" fontWeight="500">{negociacao.cliente?.nome || 'N/A'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">TELEFONE / WHATSAPP</Typography>
                                <Typography variant="body2" fontWeight="500">{negociacao.cliente?.telefone || 'Não informado'}</Typography>
                            </Box>
                            <Box sx={{ gridColumn: { sm: 'span 2' } }}>
                                <Typography variant="caption" color="text.secondary">LOCALIZAÇÃO DO CLIENTE</Typography>
                                <Typography variant="body2" sx={{ color: negociacao.cliente?.endereco ? 'text.primary' : 'text.disabled' }}>
                                    {formatEnderecoCliente()}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* CARD IMÓVEL */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="overline" color="secondary" fontWeight="bold">Dados do Imóvel</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem', lineHeight: 1.2, mt: 0.5 }}>
                                    {negociacao.imovel?.titulo}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    📍 {negociacao.imovel?.endereco} — <strong>{negociacao.imovel?.cidade}</strong>
                                </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>FASE ATUAL</Typography>
                                <Chip
                                    label={getStatusLabel(negociacao.status)}
                                    color="primary"
                                    size="small"
                                    sx={{ fontWeight: 'bold', mt: 0.5 }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <Divider sx={{ mb: 3 }}><Chip label="HISTÓRICO DE INTERAÇÕES" size="small" variant="outlined" /></Divider>

                <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3, px: 1 }}>
                    <Timeline position="right">
                        {negociacao.historico?.map((item, index) => (
                            <TimelineItem key={index}>
                                <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2, py: '12px', px: 2 }}>
                                    {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '---'}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color="primary" variant="outlined" />
                                    {index !== (negociacao.historico.length - 1) && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: '12px', px: 2 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>{item.usuario_nome || 'Sistema'}</Typography>
                                        <Typography variant="body2" color="text.primary">{item.descricao}</Typography>
                                    </Paper>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                </Box>

                <Collapse in={!!errorMsg}>
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>
                </Collapse>

                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fffef0', borderColor: '#ffe58f' }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#856404', mb: 1, fontSize: '0.8rem' }}>
                        <AddCommentIcon sx={{ fontSize: 18 }} /> Registrar Nova Interação
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, alignItems: 'flex-start' }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="O que aconteceu?"
                                multiline
                                rows={2}
                                value={novaDescricao}
                                onChange={(e) => setNovaDescricao(e.target.value)}
                                placeholder="Descreva o contato..."
                            />

                            <Box sx={{ minWidth: { md: 280 }, display: 'flex', flexDirection: 'column', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Mudar Status"
                                    value={novoStatus}
                                    onChange={(e) => setNovoStatus(e.target.value as StatusNegociacao)}
                                >
                                    <MenuItem value="">Manter Atual</MenuItem>
                                    <MenuItem value="PROSPECCAO">Prospecção</MenuItem>
                                    <MenuItem value="VISITA">Visita Agendada</MenuItem>
                                    <MenuItem value="PROPOSTA">Proposta Recebida</MenuItem>
                                    <MenuItem value="FECHADO">Concluído 🎉</MenuItem>
                                    <MenuItem value="PERDIDO">Perdido ❌</MenuItem>
                                </TextField>

                                {novoStatus === 'VISITA' && (
                                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="date"
                                            label="Data"
                                            value={dataVisita}
                                            onChange={(e) => setDataVisita(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: new Date().toISOString().split("T")[0] }}
                                        />
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Hora"
                                            value={horaVisita}
                                            onChange={(e) => setHoraVisita(e.target.value)}
                                            disabled={!dataVisita}
                                        >
                                            {getHorariosDisponiveis().map(h => (
                                                <MenuItem key={h} value={h}>{h}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {statusAgenda && (
                            <Typography variant="caption" sx={{ color: statusAgenda.color, fontWeight: 'bold', mt: -1 }}>
                                {statusAgenda.msg}
                            </Typography>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleAddHistorico}
                            size="small"
                            disabled={loading || (!novaDescricao && !novoStatus) || (statusAgenda?.msg.includes('Atenção'))}
                            sx={{ alignSelf: 'flex-end', px: 3, textTransform: 'none' }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Interação'}
                        </Button>
                    </Box>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Button onClick={onClose} color="inherit" disabled={loading}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
};