import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Stepper, Step, StepLabel, TextField, MenuItem, Typography, CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import api from '../../services/api';
import { financeiroValidationSchema } from '../../types/financeiro';

const steps = ['Dados da Conta', 'Vínculos'];

export const FinanceiroFormModal = ({ open, onClose, onSuccess }: any) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    const [imoveis, setImoveis] = useState([]);
    const [clientes, setClientes] = useState([]);

    const { control, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(financeiroValidationSchema),
        defaultValues: {
            tipo: 'DESPESA',
            status: 'PENDENTE',
            valor: 0,
            descricao: '',
            categoria: 'OUTROS',
            dataVencimento: new Date().toISOString().split('T')[0],
            imovel: '',
            cliente: ''
        }
    });

    useEffect(() => {
        if (open) {
            const carregarVinculos = async () => {
                setFetchingData(true);
                try {
                    const [resImoveis, resClientes] = await Promise.all([
                        api.get('/imoveis'),
                        api.get('/clientes')
                    ]);
                    setImoveis(resImoveis.data);
                    setClientes(resClientes.data);
                } catch (err) {
                    console.error("Erro ao carregar dados para vínculos", err);
                } finally {
                    setFetchingData(false);
                }
            };
            carregarVinculos();
        }
    }, [open]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // Limpa strings vazias para não enviar ID inválido ao MongoDB
            const payload = { ...data };
            if (!payload.imovel) delete payload.imovel;
            if (!payload.cliente) delete payload.cliente;

            await api.post('/financeiro', payload);
            reset();
            setActiveStep(0);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar transação", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa' }}>
                Novo Lançamento Financeiro
            </DialogTitle>

            <Stepper activeStep={activeStep} sx={{ p: 3 }}>
                {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>

            <DialogContent dividers>
                {activeStep === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller
                            name="descricao"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Descrição" fullWidth error={!!errors.descricao} helperText={errors.descricao?.message} />
                            )}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Controller
                                name="valor"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Valor (R$)" type="number" sx={{ flex: 2 }} error={!!errors.valor} />
                                )}
                            />
                            <Controller
                                name="tipo"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Tipo" sx={{ flex: 1 }}>
                                        <MenuItem value="RECEITA">Receita (+)</MenuItem>
                                        <MenuItem value="DESPESA">Despesa (-)</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Controller
                                name="dataVencimento"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Vencimento" type="date" InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} error={!!errors.dataVencimento} />
                                )}
                            />
                            <Controller
                                name="categoria"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Categoria" sx={{ flex: 1 }}>
                                        <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                                        <MenuItem value="REPASSE">Repasse</MenuItem>
                                        <MenuItem value="COMISSAO">Comissão</MenuItem>
                                        <MenuItem value="OPERACIONAL">Operacional</MenuItem>
                                        <MenuItem value="OUTROS">Outros</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Vincule este lançamento para rastrear no histórico do imóvel ou cliente.
                        </Typography>

                        {fetchingData ? <CircularProgress size={24} sx={{ m: 'auto' }} /> : (
                            <>
                                <Controller
                                    name="imovel"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Imóvel Relacionado" fullWidth>
                                            <MenuItem value="">Nenhum</MenuItem>
                                            {imoveis.map((i: any) => (
                                                <MenuItem key={i._id} value={i._id}>{i.titulo || i.codigo}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />

                                <Controller
                                    name="cliente"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Cliente Responsável" fullWidth>
                                            <MenuItem value="">Nenhum</MenuItem>
                                            {clientes.map((c: any) => (
                                                <MenuItem key={c._id} value={c._id}>{c.nome}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                <Button onClick={onClose} color="inherit">Cancelar</Button>
                {activeStep === 0 ? (
                    <Button variant="contained" onClick={() => setActiveStep(1)}>Próximo</Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={() => setActiveStep(0)}>Voltar</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit(onSubmit)}
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Finalizar Lançamento'}
                        </Button>
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};