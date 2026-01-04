import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, Alert, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';

interface Props {
    open: boolean;
    agendamento: any;
    onClose: () => void;
    onUpdate: () => void;
}

export const GerenciarAgendamentoModal: React.FC<Props> = ({ open, agendamento, onClose, onUpdate }) => {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);

    // Carrega observação existente ao abrir o modal
    useEffect(() => {
        if (open && agendamento) {
            setMotivo(agendamento.observacoes || '');
        }
    }, [open, agendamento]);

    if (!agendamento) return null;

    // Lógica para desabilitar botões: se o motivo estiver vazio (apenas espaços não contam)
    const isBotaoDesabilitado = loading || !motivo.trim();

    const handleUpdateStatus = async (novoStatus: 'CONCLUIDO' | 'CANCELADO') => {
        setLoading(true);
        try {
            await api.patch(`/agendamentos/${agendamento._id}/status`, {
                status: novoStatus,
                motivo: motivo
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Erro ao atualizar status", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{
                fontWeight: 'bold',
                bgcolor: 'action.hover',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pr: 6 // Espaço extra para o botão X não sobrepor o texto
            }}>
                Gerenciar Visita
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">IMÓVEL</Typography>
                    <Typography variant="body1" fontWeight="bold">{agendamento.imovel?.titulo}</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">CLIENTE</Typography>
                    <Typography variant="body1">{agendamento.cliente?.nome}</Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                    Status atual: <strong>{agendamento.status}</strong>
                </Alert>

                <TextField
                    fullWidth
                    label="Motivo / Observações"
                    multiline
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Descreva o desfecho da visita ou motivo do cancelamento..."
                    required
                    error={!motivo.trim() && open}
                    helperText={!motivo.trim() ? "Obrigatório descrever o desfecho" : ""}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleUpdateStatus('CANCELADO')}
                    disabled={isBotaoDesabilitado}
                >
                    Cancelar Visita
                </Button>

                <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleUpdateStatus('CONCLUIDO')}
                    disabled={isBotaoDesabilitado}
                >
                    {agendamento.status === 'PENDENTE' ? 'Concluir Visita' : 'Atualizar Dados'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};