// src/components/empresa/EmpresaPixModal.tsx (NOVO)
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, FormControl, InputLabel, Select, MenuItem,
    Alert, CircularProgress, Box, Typography, Chip, IconButton,
    Stepper, Step, StepLabel, StepContent
} from '@mui/material';
import { QrCode, ContentCopy, CheckCircle } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Empresa } from '../../types/empresa';
import { empresaService } from '../../services/empresaService';
import { TipoChavePixEmpresa, ChavePixEmpresaDto } from '../../types/empresa.dto';

interface EmpresaPixModalProps {
    open: boolean;
    onClose: () => void;
    empresa: Empresa;
    onSuccess: () => void;
}

// Schema simplificado para empresa (sem CPF)
const chavePixSchema = yup.object().shape({
    tipo: yup.string().oneOf(['CNPJ', 'EMAIL', 'TELEFONE', 'CHAVE_ALEATORIA']).required('Tipo de chave é obrigatório'),
    chave: yup.string().required('Chave PIX é obrigatória'),
    preferencial: yup.boolean().default(true)
});

type ChavePixFormData = yup.InferType<typeof chavePixSchema>;

export const EmpresaPixModal: React.FC<EmpresaPixModalProps> = ({ open, onClose, empresa, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [chaveAtual, setChaveAtual] = useState<ChavePixFormData | null>(null);
    const [modoEdicao, setModoEdicao] = useState(false);

    const { control, handleSubmit, reset, watch } = useForm<ChavePixFormData>({
        resolver: yupResolver(chavePixSchema),
        defaultValues: {
            tipo: 'CNPJ',
            chave: empresa.cnpj || '', // Pré-preenche com CNPJ da empresa
            preferencial: true
        }
    });

    const tipoSelecionado = watch('tipo');

    // Carregar dados existentes ao abrir o modal
    useEffect(() => {
        console.log('🔍 Modal PIX de Empresa aberto. Empresa:', empresa?.nome);
        console.log('🔍 Chave PIX da empresa:', empresa?.chavePix);

        if (!open) return;

        setError(null);
        setSuccess(null);

        if (empresa?.chavePix?.chave) {
            console.log('✅ Empresa TEM chave PIX. Carregando dados...');

            const dadosExistentes: ChavePixFormData = {
                tipo: empresa.chavePix.tipo,
                chave: empresa.chavePix.chave,
                preferencial: empresa.chavePix.preferencial || true
            };

            console.log('📋 Dados para reset:', dadosExistentes);

            reset(dadosExistentes);
            setChaveAtual(dadosExistentes);
            setStep(1);
            setModoEdicao(false);

        } else {
            console.log('❌ Empresa NÃO TEM chave PIX. Modo criação.');
            reset({
                tipo: 'CNPJ',
                chave: empresa.cnpj || '', // Pré-preenche com CNPJ
                preferencial: true
            });
            setChaveAtual(null);
            setStep(0);
            setModoEdicao(false);
        }

    }, [open, empresa, reset]);

    // Formatar chave baseada no tipo
    const formatarChave = (tipo: TipoChavePixEmpresa, chave: string): string => {
        if (!chave) return '';

        const chaveLimpa = chave.replace(/\D/g, '');

        switch (tipo) {
            case 'CNPJ':
                if (chaveLimpa.length === 14) {
                    return chaveLimpa.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                }
                return chave;

            case 'TELEFONE':
                if (chaveLimpa.length <= 11) {
                    if (chaveLimpa.length <= 10) {
                        return chaveLimpa.replace(/(\d{2})(\d{4})(\d{4})/,
                            (match, p1, p2, p3) => {
                                let resultado = `(${p1})`;
                                if (p2) resultado += ` ${p2}`;
                                if (p3) resultado += `-${p3}`;
                                return resultado;
                            });
                    } else {
                        return chaveLimpa.replace(/(\d{2})(\d{5})(\d{4})/,
                            (match, p1, p2, p3) => {
                                let resultado = `(${p1})`;
                                if (p2) resultado += ` ${p2}`;
                                if (p3) resultado += `-${p3}`;
                                return resultado;
                            });
                    }
                }
                return chave;

            case 'EMAIL':
            case 'CHAVE_ALEATORIA':
                return chave;

            default:
                return chave;
        }
    };

    // Passo 1: Cadastrar chave PIX
    const onSubmitCadastro = async (data: ChavePixFormData) => {
        setLoading(true);
        setError(null);

        try {
            // Apenas limpa caracteres não numéricos para CNPJ e Telefone
            let chaveParaEnviar = data.chave;
            if (data.tipo === 'CNPJ' || data.tipo === 'TELEFONE') {
                chaveParaEnviar = chaveParaEnviar.replace(/\D/g, '');
            }

            const dadosParaEnviar: ChavePixEmpresaDto = {
                ...data,
                chave: chaveParaEnviar
            };

            await empresaService.atualizarChavePix(empresa._id, dadosParaEnviar);
            setChaveAtual(data);
            setSuccess('Chave PIX cadastrada com sucesso!');
            setStep(1);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao cadastrar chave PIX');
        } finally {
            setLoading(false);
        }
    };

    // Funções para edição
    const handleEditarChave = () => {
        setModoEdicao(true);
        setStep(0);
        setSuccess(null);
    };

    const handleCancelarEdicao = () => {
        if (empresa.chavePix) {
            reset({
                tipo: empresa.chavePix.tipo,
                chave: empresa.chavePix.chave,
                preferencial: empresa.chavePix.preferencial || true
            });
            setChaveAtual({
                tipo: empresa.chavePix.tipo,
                chave: empresa.chavePix.chave,
                preferencial: empresa.chavePix.preferencial || true
            });
            setStep(1);
        } else {
            reset({
                tipo: 'CNPJ',
                chave: empresa.cnpj || '',
                preferencial: true
            });
            setStep(0);
        }
        setModoEdicao(false);
        setError(null);
    };

    // Remover chave PIX
    const handleRemoverChavePix = async () => {
        if (!window.confirm('Tem certeza que deseja remover a chave PIX desta empresa?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await empresaService.removerChavePix(empresa._id);
            setSuccess('Chave PIX removida com sucesso!');
            reset();
            setChaveAtual(null);
            setStep(0);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao remover chave PIX');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: 'Cadastrar Chave PIX', description: 'Informe os dados da chave PIX' },
        { label: 'Concluído', description: 'Chave PIX configurada com sucesso' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QrCode />
                    <Typography variant="h6">Configurar PIX - {empresa.nome}</Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Stepper activeStep={step} orientation="vertical" sx={{ mb: 3 }}>
                    {steps.map((stepItem, index) => (
                        <Step key={stepItem.label}>
                            <StepLabel>{stepItem.label}</StepLabel>
                            <StepContent>
                                <Typography variant="body2" color="text.secondary">
                                    {stepItem.description}
                                </Typography>
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>

                {/* PASSO 0: Cadastro de chave PIX */}
                {step === 0 && (
                    <Box component="form" onSubmit={handleSubmit(onSubmitCadastro)}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Tipo de Chave</InputLabel>
                            <Controller
                                name="tipo"
                                control={control}
                                render={({ field }) => (
                                    <Select {...field} label="Tipo de Chave">
                                        <MenuItem value="CNPJ">CNPJ</MenuItem>
                                        <MenuItem value="EMAIL">E-mail</MenuItem>
                                        <MenuItem value="TELEFONE">Telefone</MenuItem>
                                        <MenuItem value="CHAVE_ALEATORIA">Chave Aleatória</MenuItem>
                                    </Select>
                                )}
                            />
                        </FormControl>

                        <Controller
                            name="chave"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={tipoSelecionado === 'EMAIL' ? 'E-mail' :
                                        tipoSelecionado === 'CHAVE_ALEATORIA' ? 'Chave PIX' :
                                            'Número'}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    placeholder={getPlaceholder(tipoSelecionado)}
                                    value={formatarChave(tipoSelecionado, field.value)}
                                    onChange={(e) => {
                                        field.onChange(e.target.value);
                                    }}
                                    helperText={getHelperText(tipoSelecionado, empresa.cnpj)}
                                />
                            )}
                        />

                        <Controller
                            name="preferencial"
                            control={control}
                            render={({ field }) => (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="body2" sx={{ mr: 2 }}>
                                        Chave preferencial para recebimentos:
                                    </Typography>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </Box>
                            )}
                        />

                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                                <strong>Validações desabilitadas:</strong> Qualquer formato será aceito.
                                {tipoSelecionado === 'CNPJ' && ' (CNPJ deve bater com o cadastrado)'}
                            </Typography>
                        </Alert>
                    </Box>
                )}

                {/* PASSO 1: Concluído */}
                {step === 1 && chaveAtual && !modoEdicao && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle />
                                <Typography variant="body1">
                                    {empresa.chavePix ? 'Chave PIX já configurada' : 'Chave PIX configurada com sucesso!'}
                                </Typography>
                            </Box>
                        </Alert>

                        <Box sx={{
                            p: 2.5,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 1
                        }}>
                            <Typography variant="subtitle2" gutterBottom sx={{
                                color: 'text.primary',
                                fontWeight: 600,
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <QrCode fontSize="small" sx={{ color: 'primary.main' }} />
                                Dados da Chave PIX
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pb: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                                    <Chip
                                        label={chaveAtual.tipo}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pb: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" color="text.secondary">Chave:</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{
                                            color: 'text.primary',
                                            fontWeight: 500,
                                            fontFamily: chaveAtual.tipo === 'EMAIL' ? 'inherit' : 'monospace',
                                            fontSize: '0.9rem'
                                        }}>
                                            {formatarChave(chaveAtual.tipo, chaveAtual.chave)}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigator.clipboard.writeText(chaveAtual.chave)}
                                            sx={{ color: 'action.active' }}
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                                    <Chip
                                        label="Ativa"
                                        size="small"
                                        color="success"
                                        icon={<CheckCircle fontSize="small" />}
                                        sx={{
                                            fontWeight: 500,
                                            '& .MuiChip-icon': { fontSize: '1rem' }
                                        }}
                                    />
                                </Box>

                                {chaveAtual.preferencial && (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        pt: 1,
                                        borderTop: '1px solid',
                                        borderColor: 'divider'
                                    }}>
                                        <Typography variant="body2" color="text.secondary">Preferencial:</Typography>
                                        <Chip
                                            label="Sim"
                                            size="small"
                                            color="primary"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    onClick={handleEditarChave}
                                    startIcon={<QrCode />}
                                >
                                    Alterar Chave PIX
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                {step === 0 && chaveAtual && (
                    <Button
                        color="inherit"
                        onClick={modoEdicao ? handleCancelarEdicao : handleRemoverChavePix}
                        disabled={loading}
                    >
                        {modoEdicao ? 'Cancelar Edição' : 'Remover Chave'}
                    </Button>
                )}

                <Box sx={{ flex: 1 }} />

                <Button onClick={onClose} disabled={loading}>
                    Fechar
                </Button>

                {step === 0 && (
                    <Button
                        type="submit"
                        variant="contained"
                        onClick={handleSubmit(onSubmitCadastro)}
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {modoEdicao ? 'Salvar Alterações' : 'Cadastrar Chave'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// Funções auxiliares
const getHelperText = (tipo: TipoChavePixEmpresa, cnpjEmpresa?: string): string => {
    switch (tipo) {
        case 'CNPJ': return `CNPJ da empresa será validado automaticamente`;
        case 'EMAIL': return 'Qualquer formato de e-mail será aceito';
        case 'TELEFONE': return 'Qualquer formato de telefone será aceito';
        case 'CHAVE_ALEATORIA': return 'Qualquer chave PIX será aceita';
        default: return 'Validações desabilitadas - qualquer formato será aceito';
    }
};

const getPlaceholder = (tipo: TipoChavePixEmpresa): string => {
    switch (tipo) {
        case 'CNPJ': return 'Ex: 12.345.678/0001-90';
        case 'EMAIL': return 'Ex: empresa@email.com';
        case 'TELEFONE': return 'Ex: (11) 98765-4321';
        case 'CHAVE_ALEATORIA': return 'Ex: 123e4567-e89b-12d3-a456-426614174000';
        default: return 'Informe a chave PIX';
    }
};