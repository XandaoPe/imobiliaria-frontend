// src/components/cliente/ClientePixModal.tsx (SEM VALIDAÇÕES)
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
import { Cliente } from '../../types/cliente';
import { clienteService } from '../../services/clienteService';
import { TipoChavePix, ChavePixDto } from '../../types/pix.dto';

interface ClientePixModalProps {
    open: boolean;
    onClose: () => void;
    cliente: Cliente;
    onSuccess: () => void;
}

// Schema simplificado SEM validações
const chavePixSchema = yup.object().shape({
    tipo: yup.string().oneOf(Object.values(TipoChavePix)).required('Tipo de chave é obrigatório'),
    chave: yup.string().required('Chave PIX é obrigatória'),
    preferencial: yup.boolean().default(false)
});

type ChavePixFormData = yup.InferType<typeof chavePixSchema>;

export const ClientePixModal: React.FC<ClientePixModalProps> = ({ open, onClose, cliente, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [chaveAtual, setChaveAtual] = useState<ChavePixDto | null>(null);
    const [modoEdicao, setModoEdicao] = useState(false);

    const { control, handleSubmit, reset, watch } = useForm<ChavePixFormData>({
        resolver: yupResolver(chavePixSchema),
        defaultValues: {
            tipo: TipoChavePix.CPF,
            chave: '',
            preferencial: false
        }
    });

    const tipoSelecionado = watch('tipo');

    // Carregar dados existentes ao abrir o modal
    useEffect(() => {
        console.log('🔍 Modal PIX aberto. Cliente recebido:', cliente);
        console.log('🔍 Chave PIX do cliente:', cliente?.chavePix);

        if (!open) return; // Só executa quando modal abre

        // Resetar estado quando modal abre
        setError(null);
        setSuccess(null);

        if (cliente?.chavePix?.chave) {
            console.log('✅ Cliente TEM chave PIX. Carregando dados...');

            // Converter tipo para enum corretamente
            const tipoChave = cliente.chavePix.tipo as TipoChavePix;

            const dadosExistentes: ChavePixFormData = {
                tipo: tipoChave,
                chave: cliente.chavePix.chave,
                preferencial: cliente.chavePix.preferencial || false
            };

            console.log('📋 Dados para reset:', dadosExistentes);

            reset(dadosExistentes);
            setChaveAtual({
                ...dadosExistentes,
                validado: cliente.chavePix.validado || true
            });
            setStep(1); // Vai para tela de visualização
            setModoEdicao(false); // Inicia no modo visualização

        } else {
            console.log('❌ Cliente NÃO TEM chave PIX. Modo criação.');
            reset({
                tipo: TipoChavePix.CPF,
                chave: '',
                preferencial: false
            });
            setChaveAtual(null);
            setStep(0); // Vai para tela de cadastro
            setModoEdicao(false);
        }

    }, [open, cliente, reset]); // Dependências corretas

    // Formatar chave baseada no tipo (apenas para visualização)
    const formatarChave = (tipo: TipoChavePix, chave: string): string => {
        if (!chave) return '';

        // APENAS FORMATAÇÃO VISUAL - SEM VALIDAÇÃO
        const chaveLimpa = chave.replace(/\D/g, '');

        switch (tipo) {
            case TipoChavePix.CPF:
                if (chaveLimpa.length <= 11) {
                    return chaveLimpa.replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/,
                        (match, p1, p2, p3, p4) => {
                            let resultado = p1;
                            if (p2) resultado += `.${p2}`;
                            if (p3) resultado += `.${p3}`;
                            if (p4) resultado += `-${p4}`;
                            return resultado;
                        });
                }
                return chave;

            case TipoChavePix.CNPJ:
                if (chaveLimpa.length <= 14) {
                    return chaveLimpa.replace(/(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/,
                        (match, p1, p2, p3, p4, p5) => {
                            let resultado = p1;
                            if (p2) resultado += `.${p2}`;
                            if (p3) resultado += `.${p3}`;
                            if (p4) resultado += `/${p4}`;
                            if (p5) resultado += `-${p5}`;
                            return resultado;
                        });
                }
                return chave;

            case TipoChavePix.TELEFONE:
                if (chaveLimpa.length <= 11) {
                    if (chaveLimpa.length <= 10) {
                        return chaveLimpa.replace(/(\d{2})(\d{0,4})(\d{0,4})/,
                            (match, p1, p2, p3) => {
                                let resultado = `(${p1})`;
                                if (p2) resultado += ` ${p2}`;
                                if (p3) resultado += `-${p3}`;
                                return resultado;
                            });
                    } else {
                        return chaveLimpa.replace(/(\d{2})(\d{0,5})(\d{0,4})/,
                            (match, p1, p2, p3) => {
                                let resultado = `(${p1})`;
                                if (p2) resultado += ` ${p2}`;
                                if (p3) resultado += `-${p3}`;
                                return resultado;
                            });
                    }
                }
                return chave;

            case TipoChavePix.EMAIL:
                // Mantém o email como está (sem validação)
                return chave;

            case TipoChavePix.CHAVE_ALEATORIA:
                // Mantém a chave aleatória como está
                return chave;

            default:
                return chave;
        }
    };

    // Passo 1: Cadastrar chave PIX (SEM VALIDAÇÃO DE FORMATO)
    const onSubmitCadastro = async (data: ChavePixFormData) => {
        setLoading(true);
        setError(null); // Sempre limpa erros anteriores

        try {
            // Apenas limpa caracteres não numéricos para CPF, CNPJ e Telefone (para envio)
            let chaveParaEnviar = data.chave;
            if ([TipoChavePix.CPF, TipoChavePix.CNPJ, TipoChavePix.TELEFONE].includes(data.tipo)) {
                chaveParaEnviar = chaveParaEnviar.replace(/\D/g, '');
            }

            const dadosParaEnviar = {
                ...data,
                chave: chaveParaEnviar
            };

            await clienteService.adicionarChavePix(cliente._id, dadosParaEnviar);
            setChaveAtual(dadosParaEnviar);
            setSuccess('Chave PIX cadastrada com sucesso!');
            setStep(1);
            onSuccess();
        } catch (err: any) {
            // Apenas erro de rede/API, não de validação
            setError(err.response?.data?.message || 'Erro ao cadastrar chave PIX');
        } finally {
            setLoading(false);
        }
    };

    const handleEditarChave = () => {
        setModoEdicao(true);
        setStep(0); // Volta para tela de cadastro
        setSuccess(null); // Limpa mensagem de sucesso
    };

    const handleCancelarEdicao = () => {
        if (cliente.chavePix) {
            // Volta para visualização dos dados existentes
            reset({
                tipo: cliente.chavePix.tipo as TipoChavePix,
                chave: cliente.chavePix.chave,
                preferencial: cliente.chavePix.preferencial
            });
            setChaveAtual(cliente.chavePix as ChavePixDto);
            setStep(1);
        } else {
            reset({
                tipo: TipoChavePix.CPF,
                chave: '',
                preferencial: false
            });
            setStep(0);
        }
        setModoEdicao(false);
        setError(null);
    };

    // Remover chave PIX
    const handleRemoverChavePix = async () => {
        if (!window.confirm('Tem certeza que deseja remover a chave PIX deste cliente?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await clienteService.removerChavePix(cliente._id);
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
                    <Typography variant="h6">Configurar PIX - {cliente.nome}</Typography>
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
                                        <MenuItem value={TipoChavePix.CPF}>CPF</MenuItem>
                                        <MenuItem value={TipoChavePix.CNPJ}>CNPJ</MenuItem>
                                        <MenuItem value={TipoChavePix.EMAIL}>E-mail</MenuItem>
                                        <MenuItem value={TipoChavePix.TELEFONE}>Telefone</MenuItem>
                                        <MenuItem value={TipoChavePix.CHAVE_ALEATORIA}>Chave Aleatória</MenuItem>
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
                                    label={tipoSelecionado === TipoChavePix.EMAIL ? 'E-mail' :
                                        tipoSelecionado === TipoChavePix.CHAVE_ALEATORIA ? 'Chave PIX' :
                                            'Número'}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    placeholder={getPlaceholder(tipoSelecionado)}
                                    value={formatarChave(tipoSelecionado, field.value)}
                                    onChange={(e) => {
                                        // Aceita qualquer valor (SEM VALIDAÇÃO)
                                        field.onChange(e.target.value);
                                    }}
                                    helperText={getHelperText(tipoSelecionado)}
                                />
                            )}
                        />

                        {/* Observação sobre validação desabilitada */}
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                                <strong>Validações desabilitadas:</strong> Qualquer formato será aceito.
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
                                    {cliente.chavePix ? 'Chave PIX já configurada' : 'Chave PIX configurada com sucesso!'}
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

                            {/* DESCOMENTAR ESTE CONTEÚDO */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5
                            }}>
                                {/* Tipo */}
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

                                {/* Chave */}
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

                                {/* Status */}
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

// Funções auxiliares (SEM EXIGÊNCIAS DE VALIDAÇÃO)
const getHelperText = (tipo: TipoChavePix): string => {
    switch (tipo) {
        case TipoChavePix.CPF: return 'Qualquer formato de CPF será aceito';
        case TipoChavePix.CNPJ: return 'Qualquer formato de CNPJ será aceito';
        case TipoChavePix.TELEFONE: return 'Qualquer formato de telefone será aceito';
        case TipoChavePix.EMAIL: return 'Qualquer formato de e-mail será aceito';
        case TipoChavePix.CHAVE_ALEATORIA: return 'Qualquer chave PIX será aceita';
        default: return 'Validações desabilitadas - qualquer formato será aceito';
    }
};

const getPlaceholder = (tipo: TipoChavePix): string => {
    switch (tipo) {
        case TipoChavePix.CPF: return 'Ex: 123.456.789-09 ou 12345678909';
        case TipoChavePix.CNPJ: return 'Ex: 12.345.678/0001-90 ou 12345678000190';
        case TipoChavePix.TELEFONE: return 'Ex: (11) 98765-4321, 11987654321, ou 987654321';
        case TipoChavePix.EMAIL: return 'Ex: cliente@email.com';
        case TipoChavePix.CHAVE_ALEATORIA: return 'Ex: 123e4567-e89b-12d3-a456-426614174000';
        default: return 'Informe a chave PIX';
    }
};