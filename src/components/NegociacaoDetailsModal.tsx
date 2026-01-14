import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, MenuItem, Box, Typography, Divider, Paper,
    Chip, IconButton, Alert, Collapse, CircularProgress
} from '@mui/material';
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentIcon from '@mui/icons-material/AddComment';
import RestartAltIcon from '@mui/icons-material/RestartAlt'; // Ícone para o estorno
import api from '../services/api';
import { Negociacao, StatusNegociacao, getStatusLabel } from '../types/negociacao';
import { NegociacaoFechamentoModal } from './NegociacaoFechamentoModal';
import { useNavigate } from 'react-router-dom';

interface Props {
    open: boolean;
    negociacao: Negociacao | null;
    onClose: () => void;
    onUpdate: () => void;
}

export const NegociacaoDetailsModal: React.FC<Props> = ({ open, negociacao, onClose, onUpdate }) => {
    const navigate = useNavigate();
    const [novaDescricao, setNovaDescricao] = useState('');
    const [novoStatus, setNovoStatus] = useState<StatusNegociacao | ''>('');
    const [loading, setLoading] = useState(false);
    const [loadingEstorno, setLoadingEstorno] = useState(false);
    const [dataVisita, setDataVisita] = useState('');
    const [horaVisita, setHoraVisita] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([]);
    const [modalFechamentoOpen, setModalFechamentoOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setNovaDescricao('');
            setNovoStatus('');
            setDataVisita('');
            setHoraVisita('');
            setErrorMsg(null);
        }
    }, [open, negociacao]);

    useEffect(() => {
        const buscarOcupados = async () => {
            if (dataVisita && negociacao?.imovel?._id) {
                try {
                    const { data } = await api.get('/agendamentos/horarios-ocupados', {
                        params: { data: dataVisita }
                    });
                    setHorariosBloqueados(data);
                } catch (e) {
                    console.error("Erro ao buscar horários ocupados", e);
                }
            }
        };
        buscarOcupados();
    }, [dataVisita, negociacao?.imovel?._id]);

    if (!negociacao) return null;

    const isFechado = negociacao.status === 'FECHADO';

    const getHorariosDisponiveis = () => {
        const todos = [];
        for (let h = 6; h <= 22; h++) {
            const hora = String(h).padStart(2, '0');
            todos.push(`${hora}:00`);
            if (h !== 22) todos.push(`${hora}:30`);
        }

        const agoraBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const hojeStr = agoraBr.toISOString().split('T')[0];
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

    const handleStatusChange = (status: StatusNegociacao | '') => {
        // Impede abrir a modal financeira se já estiver fechado
        if (status === 'FECHADO' && isFechado) {
            setErrorMsg("Esta negociação já foi concluída. Use o botão de estorno para corrigir valores.");
            setNovoStatus('');
            return;
        }

        setNovoStatus(status);
        if (status === 'FECHADO') {
            setModalFechamentoOpen(true);
        }
    };

    const handleRefazer = async () => {
        if (!window.confirm("Isso cancelará o financeiro atual e criará uma nova negociação para correção. Confirmar?")) return;

        setLoadingEstorno(true);
        try {
            const { data } = await api.post(`/negociacoes/${negociacao._id}/refazer`);
            onUpdate();
            onClose();
            // Navega para a nova negociação criada
            navigate(`/negociacoes`); // Ou para o ID novo se preferir: navigate(`/negociacoes/${data._id}`)
            alert("Negociação estornada! Uma nova cópia foi gerada para correção.");
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || "Erro ao estornar.");
        } finally {
            setLoadingEstorno(false);
        }
    };

    const handleAddHistorico = async () => {
        if (!novaDescricao && !novoStatus) return;

        if (novoStatus === 'FECHADO') {
            setModalFechamentoOpen(true);
            return;
        }

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

    const confirmarFechamentoFinal = async (dadosFinanceiros: any) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            await api.patch(`/negociacoes/${negociacao._id}`, {
                status: 'FECHADO',
                descricao: novaDescricao || 'Negociação concluída com sucesso.',
                dadosFinanceiros: dadosFinanceiros
            });

            setModalFechamentoOpen(false);
            onUpdate();
            onClose();
        } catch (error: any) {
            setErrorMsg("Erro ao fechar negociação. Verifique os dados financeiros.");
            setModalFechamentoOpen(false);
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

            <DialogContent dividers sx={{ bgcolor: '#fbfbfb' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    {/* Dados do Cliente e Imóvel (Mantidos como no original) */}
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
                        </Box>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="overline" color="secondary" fontWeight="bold">Dados do Imóvel</Typography>
                                <Typography variant="h6" sx={{ fontSize: '1rem', lineHeight: 1.2, mt: 0.5 }}>{negociacao.imovel?.titulo}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>📍 {negociacao.imovel?.endereco}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>FASE ATUAL</Typography>
                                <Chip label={getStatusLabel(negociacao.status)} color={isFechado ? "success" : "primary"} size="small" sx={{ fontWeight: 'bold', mt: 0.5 }} />
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <Divider sx={{ mb: 3 }}><Chip label="HISTÓRICO DE INTERAÇÕES" size="small" variant="outlined" /></Divider>

                {/* Timeline do Histórico */}
                <Box sx={{ maxHeight: 250, overflowY: 'auto', mb: 3, px: 1 }}>
                    <Timeline position="right">
                        {negociacao.historico?.map((item, index) => (
                            <TimelineItem key={index}>
                                <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2 }}>
                                    {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '---'}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color={isFechado && index === 0 ? "success" : "primary"} variant="outlined" />
                                    {index !== (negociacao.historico.length - 1) && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent>
                                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f5f5f5', border: '1px solid #eee' }}>
                                        <Typography variant="body2" fontWeight="bold">{item.usuario_nome}</Typography>
                                        <Typography variant="body2">{item.descricao}</Typography>
                                    </Paper>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                </Box>

                <Collapse in={!!errorMsg}>
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>
                </Collapse>

                {/* Área de Ação: Se estiver fechado, mostra botão de Estorno. Se não, mostra formulário. */}
                {isFechado ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#fff5f5', borderColor: '#ffcfcf' }}>
                        <Typography variant="body2" color="error" fontWeight="500" gutterBottom>
                            Esta negociação está concluída e os registros financeiros foram gerados.
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                            Para alterar valores ou datas de vencimento, é necessário estornar o fechamento atual.
                        </Typography>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={loadingEstorno ? <CircularProgress size={20} color="inherit" /> : <RestartAltIcon />}
                            onClick={handleRefazer}
                            disabled={loadingEstorno}
                        >
                            {loadingEstorno ? 'Processando Estorno...' : 'Estornar e Corrigir Negociação'}
                        </Button>
                    </Paper>
                ) : (
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fffef0', borderColor: '#ffe58f' }}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#856404', mb: 1 }}>
                            <AddCommentIcon sx={{ fontSize: 18 }} /> Registrar Nova Interação
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5 }}>
                                <TextField
                                    fullWidth size="small" label="O que aconteceu?" multiline rows={2}
                                    value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)}
                                />
                                <Box sx={{ minWidth: { md: 280 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <TextField
                                        select fullWidth size="small" label="Mudar Status"
                                        value={novoStatus} onChange={(e) => handleStatusChange(e.target.value as StatusNegociacao)}
                                    >
                                        <MenuItem value="">Manter Atual</MenuItem>
                                        <MenuItem value="PROSPECCAO">Prospecção</MenuItem>
                                        <MenuItem value="VISITA">Visita Agendada</MenuItem>
                                        <MenuItem value="PROPOSTA">Proposta Recebida</MenuItem>
                                        <MenuItem value="FECHADO">Concluído 🎉</MenuItem>
                                        <MenuItem value="PERDIDO">Perdido ❌</MenuItem>
                                    </TextField>

                                    {novoStatus === 'VISITA' && (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField
                                                fullWidth size="small" type="date" label="Data"
                                                value={dataVisita} onChange={(e) => setDataVisita(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                            <TextField
                                                select fullWidth size="small" label="Hora"
                                                value={horaVisita} onChange={(e) => setHoraVisita(e.target.value)}
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
                            <Button
                                variant="contained" onClick={handleAddHistorico} size="small"
                                disabled={loading || (novoStatus === 'VISITA' && !horaVisita)}
                                sx={{ alignSelf: 'flex-end', px: 3 }}
                            >
                                {loading ? 'Salvando...' : 'Salvar Interação'}
                            </Button>
                        </Box>
                    </Paper>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Button onClick={onClose} color="inherit" disabled={loading}>Fechar</Button>
            </DialogActions>

            <NegociacaoFechamentoModal
                open={modalFechamentoOpen}
                valorSugerido={negociacao.imovel?.preco || 0}
                onClose={() => {
                    setModalFechamentoOpen(false);
                    setNovoStatus('');
                }}
                onConfirm={confirmarFechamentoFinal}
            />
        </Dialog>
    );
};