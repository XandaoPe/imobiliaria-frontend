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
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    // Dentro do seu componente NegociacaoDetailsModal
    const [statusAgenda, setStatusAgenda] = useState<{ loading: boolean, msg: string, color: string } | null>(null);
    const [horaVisita, setHoraVisita] = useState('');
const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([]);

    const gerarHorarios = () => {
        const horarios = [];
        for (let h = 6; h <= 22; h++) {
            const hora = h < 10 ? `0${h}` : h;
            horarios.push(`${hora}:00`);
            if (h !== 22) horarios.push(`${hora}:30`);
        }
        return horarios;
    };

    const getHorariosDisponiveis = () => {
        const todos = [];
        for (let h = 6; h <= 22; h++) {
            const hora = String(h).padStart(2, '0');
            todos.push(`${hora}:00`);
            if (h !== 22) todos.push(`${hora}:30`);
        }

        // 1. Pegamos a data/hora exatamente como o usuário vê no celular (Fuso de Brasília)
        const agoraBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

        // 2. Formatamos hoje como YYYY-MM-DD sem usar ISOString (que mudaria o dia se fosse tarde da noite)
        const ano = agoraBr.getFullYear();
        const mes = String(agoraBr.getMonth() + 1).padStart(2, '0');
        const dia = String(agoraBr.getDate()).padStart(2, '0');
        const hojeStr = `${ano}-${mes}-${dia}`;

        const horaAtual = agoraBr.getHours();
        const minAtual = agoraBr.getMinutes();

        return todos.filter(h => {
            // Remove horários que já estão ocupados no banco
            if (horariosBloqueados.includes(h)) return false;

            // Se a data selecionada for HOJE (no fuso local), filtramos as horas que já passaram
            if (dataVisita === hojeStr) {
                const [hSlot, mSlot] = h.split(':').map(Number);
                if (hSlot < horaAtual) return false;
                if (hSlot === horaAtual && mSlot <= minAtual) return false;
            }

            // Se for AMANHÃ ou qualquer data futura, o filtro de dataVisita === hojeStr não entra,
            // e todos os horários (que não estejam bloqueados) aparecem.
            return true;
        });
    };

    useEffect(() => {
        const verificar = async () => {
            // 1. Se não houver dados suficientes ou o status não for 'VISITA', limpa e sai
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

                // ⭐️ LOGICA ALTERADA: 
                // Só exibe erro se 'disponivel' for falso E o registro conflitante estiver PENDENTE.
                // Se o backend retornar que não está disponível, mas você quiser permitir 
                // agendar por cima de cancelados, o backend deve filtrar por status.

                if (data.disponivel) {
                    setStatusAgenda({ loading: false, msg: '✅ Horário disponível', color: 'success.main' });
                } else {
                    // Se o backend já filtra apenas PENDENTES, a msg de erro aparece aqui.
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

    // Limpa os estados quando o modal abre/fecha ou a negociação muda
    useEffect(() => {
        setNovaDescricao('');
        setNovoStatus('');
        setDataVisita('');
        setErrorMsg(null);
    }, [open, negociacao]);

    // Efeito para buscar horários ocupados quando mudar a data ou o imóvel
    useEffect(() => {
        const buscarOcupados = async () => {
            if (dataVisita && negociacao?.imovel?._id) {
                try {
                    const { data } = await api.get('/agendamentos/horarios-ocupados', {
                        params: { data: dataVisita } // imovelId removido
                    });
                    setHorariosBloqueados(data); // Ex: ["10:30", "15:00"]
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
                // Montamos a string no formato ISO mas fixando o fuso de Brasília (-03:00)
                // Isso evita que o celular ou o servidor tentem adivinhar o fuso.
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Detalhes da Negociação</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* CABEÇALHO RESUMO */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2
                }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>CLIENTE</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{negociacao.cliente?.nome}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>IMÓVEL</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{negociacao.imovel?.titulo}</Typography>
                    </Box>
                    <Box sx={{ textAlign: { sm: 'right' } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>STATUS ATUAL</Typography>
                        <Chip label={getStatusLabel(negociacao.status)} color="primary" size="small" />
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }}>HISTÓRICO DE INTERAÇÕES</Divider>

                {/* TIMELINE */}
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

                {/* ALERTA DE ERRO */}
                <Collapse in={!!errorMsg}>
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        onClose={() => setErrorMsg(null)}
                    >
                        {errorMsg}
                    </Alert>
                </Collapse>

                {/* FORMULÁRIO DE REGISTRO */}
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
                                inputProps={{ style: { fontSize: '0.85rem' } }}
                            />

                            <Box sx={{
                                minWidth: { md: 280 },
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                                width: { xs: '100%', md: 'auto' }
                            }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Mudar Status"
                                    value={novoStatus}
                                    onChange={(e) => setNovoStatus(e.target.value as StatusNegociacao)}
                                    SelectProps={{ style: { fontSize: '0.85rem' } }}
                                >
                                    <MenuItem value="" sx={{ fontSize: '0.85rem' }}>Manter Atual</MenuItem>
                                    <MenuItem value="PROSPECCAO" sx={{ fontSize: '0.85rem' }}>Prospecção</MenuItem>
                                    <MenuItem value="VISITA" sx={{ fontSize: '0.85rem' }}>Visita Agendada</MenuItem>
                                    <MenuItem value="PROPOSTA" sx={{ fontSize: '0.85rem' }}>Proposta Recebida</MenuItem>
                                    <MenuItem value="FECHADO" sx={{ fontSize: '0.85rem' }}>Concluído 🎉</MenuItem>
                                    <MenuItem value="PERDIDO" sx={{ fontSize: '0.85rem' }}>Perdido ❌</MenuItem>
                                </TextField>

                                {novoStatus === 'VISITA' && (
                                    <Box sx={{
                                        display: 'flex',
                                        gap: 1,
                                        width: '100%',
                                        alignItems: 'flex-start'
                                    }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            sx={{ flex: 1.5 }}
                                            type="date"
                                            label="Data"
                                            value={dataVisita}
                                            onChange={(e) => setDataVisita(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{
                                                style: { fontSize: '0.85rem' },
                                                min: new Date().toISOString().split("T")[0]
                                            }}
                                        />
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            sx={{ flex: 1 }}
                                            label="Hora"
                                            value={horaVisita}
                                            onChange={(e) => setHoraVisita(e.target.value)}
                                            disabled={!dataVisita}
                                            SelectProps={{ style: { fontSize: '0.85rem' } }}
                                        >
                                            {getHorariosDisponiveis().map(h => (
                                                <MenuItem key={h} value={h} sx={{ fontSize: '0.85rem' }}>{h}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Mensagem de Feedback da Agenda (compacta) */}
                        {statusAgenda && (
                            <Typography variant="caption" sx={{ color: statusAgenda.color, fontWeight: 'bold', mt: -1 }}>
                                {statusAgenda.msg}
                            </Typography>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleAddHistorico}
                            size="small" // Botão menor
                            disabled={loading || (!novaDescricao && !novoStatus) || (statusAgenda?.msg.includes('Atenção'))}
                            sx={{ alignSelf: 'flex-end', px: 3, textTransform: 'none' }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Interação'}
                        </Button>
                    </Box>
                </Paper>

            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={loading}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
};