import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, MenuItem, Box, Typography, Divider, Paper,
    Chip, IconButton, Alert, Collapse, CircularProgress,
    useTheme,
    Snackbar
} from '@mui/material';
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentIcon from '@mui/icons-material/AddComment';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BlockIcon from '@mui/icons-material/Block';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonIcon from '@mui/icons-material/Person';
import api from '../services/api';
import { Negociacao, StatusNegociacao, getStatusLabel } from '../types/negociacao';
import { NegociacaoFechamentoModal } from './NegociacaoFechamentoModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    open: boolean;
    negociacao: Negociacao | null;
    onClose: () => void;
    onUpdate: () => void;
}

export const NegociacaoDetailsModal: React.FC<Props> = ({ open, negociacao, onClose, onUpdate }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { user } = useAuth();
    const [novaDescricao, setNovaDescricao] = useState('');
    const [novoStatus, setNovoStatus] = useState<StatusNegociacao | ''>('');
    const [loading, setLoading] = useState(false);
    const [loadingEstorno, setLoadingEstorno] = useState(false);
    const [dataVisita, setDataVisita] = useState('');
    const [horaVisita, setHoraVisita] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    // Modais
    const [modalFechamentoOpen, setModalFechamentoOpen] = useState(false);
    const [modalDecisaoEstornoOpen, setModalDecisaoEstornoOpen] = useState(false);

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
                    // CORREÇÃO: Passa o ID do imóvel como parâmetro
                    const { data } = await api.get('/agendamentos/horarios-ocupados', {
                        params: {
                            data: dataVisita,
                            imovelId: negociacao.imovel._id
                        }
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
    const isCancelado = negociacao.status === 'CANCELADO';
    const isBloqueado = isFechado || isCancelado;

    const getHorariosDisponiveis = () => {
        const todos = [];
        for (let h = 6; h <= 22; h++) {
            const hora = String(h).padStart(2, '0');
            todos.push(`${hora}:00`);
            if (h !== 22) todos.push(`${hora}:30`);
        }

        // CORREÇÃO: Usar o timezone de São Paulo corretamente
        // Obter a data/hora atual no timezone de São Paulo
        const agora = new Date();

        // Formatar data atual no timezone de São Paulo (YYYY-MM-DD)
        const hojeSP = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const hojeFormatado = hojeSP.getFullYear() + '-' +
            String(hojeSP.getMonth() + 1).padStart(2, '0') + '-' +
            String(hojeSP.getDate()).padStart(2, '0');

        // Obter hora e minuto atual no timezone de São Paulo
        const horaAtualSP = hojeSP.getHours();
        const minutoAtualSP = hojeSP.getMinutes();

        // Debug: Mostrar o que está sendo calculado
        console.log('Data atual (SP):', hojeFormatado);
        console.log('Hora atual (SP):', horaAtualSP + ':' + minutoAtualSP);
        console.log('Data selecionada:', dataVisita);
        console.log('Horários bloqueados:', horariosBloqueados);

        return todos.filter(h => {
            // Filtrar horários já ocupados
            if (horariosBloqueados.includes(h)) {
                console.log('Horário bloqueado:', h);
                return false;
            }

            // Só filtrar horários passados se for hoje (no timezone de SP)
            if (dataVisita === hojeFormatado) {
                const [hSlot, mSlot] = h.split(':').map(Number);

                // Verificar se o horário já passou
                const jaPassou = hSlot < horaAtualSP || (hSlot === horaAtualSP && mSlot <= minutoAtualSP);

                if (jaPassou) {
                    console.log('Horário já passou:', h, 'vs atual:', horaAtualSP + ':' + minutoAtualSP);
                    return false;
                }
            }
            return true;
        });
    };

    const handleStatusChange = (status: StatusNegociacao | '') => {
        if (isBloqueado) {
            setErrorMsg("Esta negociação não permite mais alterações de status.");
            return;
        }
        setNovoStatus(status);
        if (status === 'FECHADO') setModalFechamentoOpen(true);
    };

    const executarEstorno = async (gerarNovaProspeccao: boolean) => {
        setLoadingEstorno(true);
        setModalDecisaoEstornoOpen(false);
        try {
            await api.post(`/negociacoes/${negociacao._id}/refazer`, {
                gerarNovaProspeccao: gerarNovaProspeccao
            });

            onUpdate();
            onClose();

            if (gerarNovaProspeccao) {
                navigate(`/negociacoes`);
                alert("Negociação estornada e nova prospecção criada!");
            } else {
                alert("Estorno realizado! O financeiro foi cancelado e o imóvel liberado.");
            }

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
                // CORREÇÃO SIMPLIFICADA: Formatar data/hora no formato ISO com offset correto
                // dataVisita está no formato YYYY-MM-DD, horaVisita no formato HH:MM
                dataAgendamentoCompleta = `${dataVisita}T${horaVisita}:00.000-03:00`;

                // VALIDAÇÃO: Verificar se a data/hora é válida
                const dataAgendamentoObj = new Date(dataAgendamentoCompleta);
                if (isNaN(dataAgendamentoObj.getTime())) {
                    throw new Error('Data/hora de agendamento inválida');
                }

                // Disparar notificação de visita agendada
                try {
                    const dataFormatada = new Date(dataVisita + 'T00:00:00').toLocaleDateString('pt-BR');
                    await api.post(`/negociacoes/${negociacao._id}/notificar-visita`, {
                        dataVisita: dataFormatada,
                        horaVisita: horaVisita,
                        imovelTitulo: negociacao.imovel?.titulo,
                        clienteNome: negociacao.cliente?.nome,
                        corretorNome: user?.nome || 'Corretor'
                    });
                } catch (notifyError) {
                    console.error("Erro ao enviar notificação:", notifyError);
                }
            }

            const statusLabel = novoStatus ? getStatusLabel(novoStatus) : getStatusLabel(negociacao.status);
            const descricaoFinal = novaDescricao
                ? `[${statusLabel}] ${novaDescricao}`
                : statusLabel;

            await api.patch(`/negociacoes/${negociacao._id}`, {
                status: novoStatus || undefined,
                descricao: descricaoFinal,
                dataAgendamento: dataAgendamentoCompleta // Envia timestamp no timezone correto
            });

            // Feedback ao usuário
            if (novoStatus === 'VISITA') {
                console.log('=== DEBUG NOTIFICAÇÃO VISITA ===');
                console.log('Data/Hora enviada:', dataAgendamentoCompleta);
                if (dataAgendamentoCompleta) {
                    console.log('Data/Hora local:', new Date(dataAgendamentoCompleta).toLocaleString('pt-BR'));
                }

                try {
                    const dataFormatada = new Date(dataVisita + 'T00:00:00').toLocaleDateString('pt-BR');
                    console.log('Enviando payload para notificação:', {
                        dataVisita: dataFormatada,
                        horaVisita,
                        imovelTitulo: negociacao.imovel?.titulo,
                        clienteNome: negociacao.cliente?.nome,
                        corretorNome: user?.nome
                    });

                    const response = await api.post(`/negociacoes/${negociacao._id}/notificar-visita`, {
                        dataVisita: dataFormatada,
                        horaVisita: horaVisita,
                        imovelTitulo: negociacao.imovel?.titulo,
                        clienteNome: negociacao.cliente?.nome,
                        corretorNome: user?.nome || 'Corretor'
                    });

                    console.log('✅ Resposta do backend:', response.data);

                } catch (notifyError: any) {
                    console.error("❌ Erro ao enviar notificação:", notifyError);
                    console.error("Resposta do erro:", notifyError.response?.data);
                }
            }

            onUpdate();
            onClose();
        } catch (error: any) {
            const mensagem = error.response?.data?.message || error.message || "Erro ao salvar interação.";
            setErrorMsg(Array.isArray(mensagem) ? mensagem[0] : mensagem);
        } finally {
            setLoading(false);
        }
    };

    const confirmarFechamentoFinal = async (dadosFinanceiros: any) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const statusLabel = getStatusLabel('FECHADO');
            const descricaoFinal = novaDescricao
                ? `[${statusLabel}] ${novaDescricao}`
                : `${statusLabel}: Negociação concluída com sucesso.`;

            await api.patch(`/negociacoes/${negociacao._id}`, {
                status: 'FECHADO',
                descricao: descricaoFinal,
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
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography variant="h6" fontWeight="bold">Detalhes da Negociação</Typography>
                            {negociacao.codigo && (
                                <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 400 }}>
                                    #{negociacao.codigo}
                                </Typography>
                            )}
                        </Box>
                        <IconButton onClick={onClose}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                            <Typography variant="overline" color="primary" fontWeight="bold">Dados do Cliente</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 1 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">NOME</Typography>
                                    <Typography variant="body2" fontWeight="500">{negociacao.cliente?.nome || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">TELEFONE</Typography>
                                    <Typography variant="body2" fontWeight="500">{negociacao.cliente?.telefone || 'Não informado'}</Typography>
                                </Box>
                            </Box>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="overline" color="secondary" fontWeight="bold">Dados do Imóvel</Typography>
                                    <Typography variant="h6" sx={{ fontSize: '1rem', lineHeight: 1.2, mt: 0.5 }}>{negociacao.imovel?.titulo}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>📍 {negociacao.imovel?.endereco}</Typography>

                                    {/* EXIBIÇÃO DO PROPRIETÁRIO COM ÍCONE PARA DESTAQUE */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>PROPRIETÁRIO</Typography>
                                            <Typography variant="body2" fontWeight="600">
                                                {negociacao.imovel?.proprietario?.nome || 'Não identificado'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: 'right', ml: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>FASE ATUAL</Typography>
                                    <Chip
                                        label={getStatusLabel(negociacao.status)}
                                        color={isFechado ? "success" : isCancelado ? "error" : "primary"}
                                        size="small"
                                        sx={{ fontWeight: 'bold', mt: 0.5 }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>

                    <Divider sx={{ mb: 3 }}><Chip label="HISTÓRICO DE INTERAÇÕES" size="small" variant="outlined" /></Divider>

                    <Box sx={{ maxHeight: 250, overflowY: 'auto', mb: 3, px: 1 }}>
                        <Timeline position="right">
                            {negociacao.historico?.map((item, index) => (
                                <TimelineItem key={index}>
                                    <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2 }}>
                                        {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '---'}
                                    </TimelineOppositeContent>
                                    <TimelineSeparator>
                                        <TimelineDot color={isFechado ? "success" : isCancelado ? "error" : "primary"} variant="outlined" />
                                        {index !== (negociacao.historico.length - 1) && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Paper elevation={0} sx={{
                                            p: 1.5,
                                            bgcolor: (theme) => theme.palette.mode === 'dark'
                                                ? theme.palette.grey[800]
                                                : '#f5f5f5',
                                            border: (theme) => `1px solid ${theme.palette.mode === 'dark'
                                                ? theme.palette.grey[700]
                                                : '#eee'}`
                                        }}>
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

                    {isBloqueado ? (
                        <Paper variant="outlined" sx={{
                            p: 3,
                            textAlign: 'center',
                            bgcolor: (theme) => isCancelado
                                ? theme.palette.mode === 'dark'
                                    ? theme.palette.grey[900]
                                    : '#f5f5f5'
                                : theme.palette.mode === 'dark'
                                    ? theme.palette.error.dark + '20'
                                    : '#fff5f5',
                            borderColor: (theme) => isCancelado
                                ? theme.palette.mode === 'dark'
                                    ? theme.palette.grey[700]
                                    : '#ddd'
                                : theme.palette.mode === 'dark'
                                    ? theme.palette.error.dark
                                    : '#ffcfcf'
                        }}>
                            {isFechado ? (
                                <>
                                    <Typography variant="body2" color="error" fontWeight="500" gutterBottom>
                                        Esta negociação está concluída.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={loadingEstorno ? <CircularProgress size={20} color="inherit" /> : <RestartAltIcon />}
                                        onClick={() => setModalDecisaoEstornoOpen(true)}
                                        disabled={loadingEstorno}
                                        sx={{ mt: 1 }}
                                    >
                                        Estornar e Corrigir
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                                        <BlockIcon color="disabled" />
                                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                                            Esta negociação foi CANCELADA e não permite novas interações.
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color={theme.palette.mode === 'dark' ? "text.disabled" : "text.disabled"}>
                                        Para este cliente/imóvel, inicie uma nova negociação na tela de listagem.
                                    </Typography>
                                </>
                            )}
                        </Paper>
                    ) : (
                        <Paper variant="outlined" sx={{
                            p: 1.5,
                            bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? theme.palette.warning.dark + '20'
                                : '#fffef0',
                            borderColor: (theme) => theme.palette.mode === 'dark'
                                ? theme.palette.warning.dark
                                : '#ffe58f'
                        }}>
                            <Typography variant="subtitle2" sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: (theme) => theme.palette.mode === 'dark'
                                    ? theme.palette.warning.light
                                    : '#856404',
                                mb: 1
                            }}>
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
                                    variant="contained"
                                    onClick={handleAddHistorico}
                                    size="small"
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
                    tipoNegocio={negociacao.tipoNegocio || 'VENDA'}
                    empresaId={user?.empresa || ''}
                    onClose={() => {
                        setModalFechamentoOpen(false);
                        setNovoStatus('');
                    }}
                    onConfirm={confirmarFechamentoFinal}
                />

                <Dialog
                    open={modalDecisaoEstornoOpen}
                    onClose={() => setModalDecisaoEstornoOpen(false)}
                    PaperProps={{
                        sx: { bgcolor: 'background.paper' }
                    }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HelpOutlineIcon color="primary" /> Opções de Estorno
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1">
                            Deseja criar uma nova prospecção para este cliente ao estornar?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Isso cancelará o financeiro e liberará o imóvel atual.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
                        <Button
                            fullWidth variant="contained" color="primary"
                            onClick={() => executarEstorno(true)}
                        >
                            Criar Nova Prospecção
                        </Button>
                        <Button
                            fullWidth variant="outlined" color="inherit"
                            onClick={() => executarEstorno(false)}
                        >
                            Apenas Estornar (Sem nova cópia)
                        </Button>
                        <Button
                            fullWidth variant="text" color="error"
                            onClick={() => setModalDecisaoEstornoOpen(false)}
                        >
                            Cancelar e Voltar
                        </Button>
                    </DialogActions>
                </Dialog>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ open: false, message: '' })}
                message={snackbar.message}
            />
        </>
    );
};