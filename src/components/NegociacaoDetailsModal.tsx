import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, MenuItem, Box, Typography, Divider, Paper
} from '@mui/material';
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import { Chip, IconButton } from '@mui/material';
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

    if (!negociacao) return null;

    const handleAddHistorico = async () => {
        // Se não houver descrição nem novo status, não faz nada
        if (!novaDescricao && !novoStatus) return;

        setLoading(true);
        try {
            await api.patch(`/negociacoes/${negociacao._id}`, {
                // Se não houver descrição mas houver novo status, registra a mudança automaticamente
                descricao: novaDescricao || `Status alterado para ${novoStatus}`,
                status: novoStatus || negociacao.status
            });

            // 1. Limpa os campos locais
            setNovaDescricao('');
            setNovoStatus('');

            // 2. Notifica o componente pai para recarregar a lista do banco de dados
            onUpdate();

            // 3. FECHA O MODAL (Adicionado aqui para automação)
            onClose();

        } catch (error) {
            console.error("Erro ao atualizar negociação", error);
            alert("Erro ao salvar interação.");
        } finally {
            setLoading(false);
        }
    };

    // Tipagem explícita para os eventos de mudança
    const handleDescricaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNovaDescricao(e.target.value);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNovoStatus(e.target.value as StatusNegociacao);
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
                {/* CABEÇALHO RESUMO COM BOX FLEX */}
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
                                    {item.data ? new Date(item.data).toLocaleDateString() : '---'}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color="primary" variant="outlined" />
                                    {index !== (negociacao.historico.length - 1) && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: '12px', px: 2 }}>
                                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2">{item.descricao}</Typography>
                                    </Paper>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                </Box>

                {/* FORMULÁRIO COM BOX FLEX */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fffef0', borderColor: '#ffe58f' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#856404' }}>
                        <AddCommentIcon fontSize="small" /> Registrar Nova Interação
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="O que aconteceu?"
                                multiline
                                rows={2}
                                value={novaDescricao}
                                onChange={handleDescricaoChange}
                            />
                            <TextField
                                select
                                label="Mudar Status"
                                sx={{ minWidth: { md: 220 } }}
                                value={novoStatus}
                                onChange={handleStatusChange}
                            >
                                <MenuItem value="">Manter Atual</MenuItem>
                                <MenuItem value="PROSPECCAO">Prospecção</MenuItem>
                                <MenuItem value="VISITA">Visita Agendada</MenuItem>
                                <MenuItem value="PROPOSTA">Proposta Recebida</MenuItem>
                                <MenuItem value="FECHADO">Venda Concluída 🎉</MenuItem>
                                <MenuItem value="PERDIDO">Negócio Perdido ❌</MenuItem>
                            </TextField>
                        </Box>

                        <Button
                            variant="contained"
                            onClick={handleAddHistorico}
                            disabled={loading || (!novaDescricao && !novoStatus)}
                            sx={{ alignSelf: 'flex-end', px: 4 }}
                        >
                            {loading ? 'Salvando...' : 'Salvar Interação'}
                        </Button>
                    </Box>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Fechar</Button>
            </DialogActions>
        </Dialog>
    );
};