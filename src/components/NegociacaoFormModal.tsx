import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Autocomplete, MenuItem, CircularProgress,
    Box, Typography, Divider
} from '@mui/material';
import api from '../services/api';
import { Cliente } from '../types/cliente';
import { Imovel } from '../types/imovel';
import { StatusNegociacao } from '../types/negociacao';

interface NegociacaoFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const NegociacaoFormModal: React.FC<NegociacaoFormModalProps> = ({ open, onClose, onSuccess }) => {
    // Estados do Formulário
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
    const [tipo, setTipo] = useState<'VENDA' | 'ALUGUEL'>('VENDA');
    const [status, setStatus] = useState<StatusNegociacao>('PROSPECCAO');
    const [observacaoInicial, setObservacaoInicial] = useState('');

    // Estados de Carregamento
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setLoadingData(true);
                try {
                    const [resClientes, resImoveis] = await Promise.all([
                        api.get('/clientes?status=ATIVO'),
                        api.get('/imoveis?disponivel=true')
                    ]);
                    setClientes(resClientes.data);
                    setImoveis(resImoveis.data);
                } catch (error) {
                    console.error("Erro ao carregar dados:", error);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!selectedCliente || !selectedImovel) return;

        setSubmitting(true);
        try {
            await api.post('/negociacoes', {
                cliente: selectedCliente._id,
                imovel: selectedImovel._id,
                tipo: tipo, // 'VENDA' ou 'ALUGUEL'
                status: status, // 'PROSPECCAO', 'VISITA', etc.
                valor_acordado: 0, // Envie 0 para satisfazer o required do Schema por enquanto
                observacoes_gerais: observacaoInicial,
                historico: [{
                    descricao: `Início do interesse: ${observacaoInicial || 'Sem observações.'}`,
                    data: new Date().toISOString()
                }]
            });
            onSuccess();
            handleClose();
        } catch (error: any) {
            // Exibe a mensagem detalhada do NestJS (class-validator)
            const msg = error.response?.data?.message;
            alert(Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao criar");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedCliente(null);
        setSelectedImovel(null);
        setObservacaoInicial('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                🤝 Nova Negociação
            </DialogTitle>

            <DialogContent dividers>
                {loadingData ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 2 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary">Carregando dados necessários...</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

                        {/* Seção de Seleção Principal */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Autocomplete
                                options={clientes}
                                getOptionLabel={(option) => `${option.nome} (${option.cpf})`}
                                value={selectedCliente}
                                onChange={(_, val) => setSelectedCliente(val)}
                                renderInput={(params) => <TextField {...params} label="Cliente (Lead)" required />}
                            />

                            <Autocomplete
                                options={imoveis}
                                getOptionLabel={(option) => `${option.titulo} - ${option.endereco}`}
                                value={selectedImovel}
                                onChange={(_, val) => setSelectedImovel(val)}
                                renderInput={(params) => <TextField {...params} label="Imóvel" required />}
                            />
                        </Box>

                        <Divider />

                        {/* Configurações da Negociação - Lado a Lado */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select
                                fullWidth
                                label="Interesse"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as any)}
                            >
                                <MenuItem value="VENDA">Venda</MenuItem>
                                <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                            </TextField>

                            <TextField
                                select
                                fullWidth
                                label="Fase Inicial"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                            >
                                <MenuItem value="PROSPECCAO">Prospecção</MenuItem>
                                <MenuItem value="VISITA">Visita Agendada</MenuItem>
                            </TextField>
                        </Box>

                        {/* Observações */}
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Notas iniciais"
                            placeholder="Descreva o interesse do cliente ou agendamento de visita..."
                            value={observacaoInicial}
                            onChange={(e) => setObservacaoInicial(e.target.value)}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit" disabled={submitting}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{ px: 4 }}
                    disabled={submitting || !selectedCliente || !selectedImovel}
                >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : "Criar Negociação"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};