import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Stepper, Step, StepLabel, TextField, MenuItem, Typography, CircularProgress,
    useTheme
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import api from '../../services/api';
import { financeiroValidationSchema } from '../../types/financeiro';

// Definição das etapas do formulário
const steps = ['Dados Financeiros', 'Vínculos'];

// Categorias - Devem ser idênticas aos ENUMS do seu Backend (financeiro.schema.ts)
const CATEGORIAS = [
    { value: 'ALUGUEL', label: 'Aluguel' },
    { value: 'VENDA', label: 'Venda' },
    { value: 'TAXA_ADMINISTRACAO', label: 'Taxa de Administração' },
    { value: 'REPASSE', label: 'Repasse' },
    { value: 'MANUTENCAO', label: 'Manutenção' },
    { value: 'OPERACIONAL', label: 'Operacional/Outros' }, // Verifique se adicionou no Backend
];

const STATUS_OPCOES = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'CANCELADO', label: 'Cancelado' },
];

export const FinanceiroFormModal = ({ open, onClose, onSuccess }: any) => {
    const theme = useTheme();
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
            categoria: 'ALUGUEL',
            dataVencimento: new Date().toISOString().split('T')[0],
            imovel: '',
            cliente: ''
        }
    });

    // Busca dados de Imóveis e Clientes ao abrir a modal
    useEffect(() => {
        if (open) {
            const carregarDados = async () => {
                setFetchingData(true);
                try {
                    const [resImoveis, resClientes] = await Promise.all([
                        api.get('/imoveis'),
                        api.get('/clientes')
                    ]);
                    setImoveis(resImoveis.data);
                    setClientes(resClientes.data);
                } catch (err) {
                    console.error("Erro ao carregar dados de apoio:", err);
                } finally {
                    setFetchingData(false);
                }
            };
            carregarDados();
        }
    }, [open]);

    const handleClose = () => {
        reset();
        setActiveStep(0);
        onClose();
    };

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // Tratamento do payload antes do envio
            const payload = {
                ...data,
                valor: Number(data.valor),
                imovel: data.imovel || undefined,
                cliente: data.cliente || undefined
            };

            await api.post('/financeiro', payload);

            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error("Erro ao salvar lançamento:", error.response?.data || error.message);
            // Aqui você poderia disparar um Toast de erro
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{
                fontWeight: 'bold',
                bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText'
            }}>
                Novo Lançamento Financeiro
            </DialogTitle>

            <Stepper activeStep={activeStep} sx={{ p: 3 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <DialogContent dividers>
                {activeStep === 0 ? (
                    /* PASSO 1: DADOS FINANCEIROS */
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <Controller
                            name="descricao"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Descrição"
                                    fullWidth
                                    error={!!errors.descricao}
                                    helperText={errors.descricao?.message}
                                />
                            )}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Controller
                                name="valor"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Valor (R$)"
                                        type="number"
                                        sx={{ flex: 2 }}
                                        error={!!errors.valor}
                                    />
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
                                    <TextField
                                        {...field}
                                        label="Vencimento"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ flex: 1 }}
                                        error={!!errors.dataVencimento}
                                    />
                                )}
                            />
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Status" sx={{ flex: 1 }}>
                                        {STATUS_OPCOES.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Box>

                        <Controller
                            name="categoria"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} select label="Categoria" fullWidth error={!!errors.categoria}>
                                    {CATEGORIAS.map(cat => (
                                        <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                ) : (
                    /* PASSO 2: VÍNCULOS */
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Vincule este lançamento a um imóvel e cliente para melhor controle.
                            </Typography>

                        {fetchingData ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress size={30} />
                            </Box>
                        ) : (
                            <>
                                <Controller
                                    name="imovel"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            label="Imóvel"
                                            fullWidth
                                            error={!!errors.imovel}
                                            helperText={errors.imovel ? "Campo obrigatório" : ""}
                                        >
                                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                                            {imoveis.map((i: any) => (
                                                <MenuItem key={i._id} value={i._id}>
                                                    {i.codigo} - {i.titulo}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />

                                <Controller
                                    name="cliente"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            label="Cliente"
                                            fullWidth
                                            error={!!errors.cliente}
                                            helperText={errors.cliente ? "Campo obrigatório" : ""}
                                        >
                                            <MenuItem value=""><em>Nenhum</em></MenuItem>
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

            <DialogActions sx={{
                p: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                borderTop: `1px solid ${theme.palette.divider}`
            }}>

                <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
                    Cancelar
                </Button>

                {activeStep === 0 ? (
                    <Button
                        variant="contained"
                        onClick={() => setActiveStep(1)}
                        disabled={!!errors.descricao || !!errors.valor}
                    >
                        Próximo
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button onClick={() => setActiveStep(0)} sx={{ color: 'text.secondary' }}>
                                Voltar
                            </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit(onSubmit)}
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Finalizar'}
                        </Button>
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};