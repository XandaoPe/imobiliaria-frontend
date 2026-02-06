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
import { Usuario } from '../../types/usuario';
import { usuarioService } from '../../services/usuarioService';
import { TipoChavePix, ChavePixDto } from '../../types/pix.dto';

interface UsuarioPixModalProps {
    open: boolean;
    onClose: () => void;
    usuario: Usuario | null;
    onSuccess: () => void;
}

const chavePixSchema = yup.object().shape({
    tipo: yup.string().oneOf(Object.values(TipoChavePix)).required('Tipo de chave é obrigatório'),
    chave: yup.string()
        .required('Chave PIX é obrigatória')
        .test('formato-valido', 'Formato da chave inválido para o tipo selecionado', function (value) {
            const { tipo } = this.parent;
            if (!value) return false;
            const cleanValue = value.replace(/\D/g, '');

            switch (tipo) {
                case TipoChavePix.CPF:
                    return cleanValue.length === 11;
                case TipoChavePix.CNPJ:
                    return cleanValue.length === 14;
                case TipoChavePix.TELEFONE:
                    // Aceita 10 (fixo) ou 11 (celular) dígitos
                    return cleanValue.length >= 10 && cleanValue.length <= 11;
                case TipoChavePix.EMAIL:
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                case TipoChavePix.CHAVE_ALEATORIA:
                    // Chave aleatória (UUID) geralmente tem 36 caracteres
                    return value.length > 30;
                default:
                    return true;
            }
        }),
    preferencial: yup.boolean().default(false)
});

type ChavePixFormData = yup.InferType<typeof chavePixSchema>;

export const UsuarioPixModal: React.FC<UsuarioPixModalProps> = ({ open, onClose, usuario, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [chaveAtual, setChaveAtual] = useState<ChavePixDto | null>(null);
    const [modoEdicao, setModoEdicao] = useState(false);

    // Helper para pegar o ID independente do formato
    const getUsuarioId = () => usuario?.id || (usuario as any)?._id;

    const { control, handleSubmit, reset, watch } = useForm<ChavePixFormData>({
        resolver: yupResolver(chavePixSchema),
        defaultValues: {
            tipo: TipoChavePix.CPF,
            chave: '',
            preferencial: false
        }
    });

    const tipoSelecionado = watch('tipo');

    useEffect(() => {
        if (!open || !usuario) return;

        setError(null);
        setSuccess(null);

        if (usuario?.chavePix?.chave) {
            const tipoChave = usuario.chavePix.tipo as TipoChavePix;
            const dadosExistentes: ChavePixFormData = {
                tipo: tipoChave,
                chave: usuario.chavePix.chave,
                preferencial: usuario.chavePix.preferencial || false
            };

            reset(dadosExistentes);
            setChaveAtual({
                ...dadosExistentes,
                validado: usuario.chavePix.validado || true
            });
            setStep(1);
            setModoEdicao(false);
        } else {
            reset({
                tipo: TipoChavePix.CPF,
                chave: '',
                preferencial: false
            });
            setChaveAtual(null);
            setStep(0);
            setModoEdicao(false);
        }
    }, [open, usuario, reset]);

    const formatarChave = (tipo: TipoChavePix, chave: string): string => {
        if (!chave) return '';
        const clean = chave.replace(/\D/g, '');
        switch (tipo) {
            case TipoChavePix.CPF: return clean.length === 11 ? clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : chave;
            case TipoChavePix.CNPJ: return clean.length === 14 ? clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : chave;
            case TipoChavePix.TELEFONE: return clean.length >= 10 ? clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") : chave;
            default: return chave;
        }
    };

    const onSubmitCadastro = async (data: ChavePixFormData) => {
        const userId = getUsuarioId();

        if (!userId) {
            setError("ID do usuário não identificado. Tente fechar e abrir novamente.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let chaveParaEnviar = data.chave;
            if ([TipoChavePix.CPF, TipoChavePix.CNPJ, TipoChavePix.TELEFONE].includes(data.tipo)) {
                chaveParaEnviar = chaveParaEnviar.replace(/\D/g, '');
            }

            const dadosParaEnviar = { ...data, chave: chaveParaEnviar };

            // Chama o service com o ID garantido
            await usuarioService.adicionarChavePix(userId.toString(), dadosParaEnviar);

            setChaveAtual(dadosParaEnviar);
            setSuccess('Chave PIX cadastrada com sucesso!');
            setStep(1);
            setModoEdicao(false);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao cadastrar chave PIX');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoverChavePix = async () => {
        const userId = getUsuarioId();
        if (!userId || !window.confirm('Deseja remover a chave PIX?')) return;

        setLoading(true);
        try {
            await usuarioService.removerChavePix(userId.toString());
            setSuccess('Chave PIX removida!');
            setChaveAtual(null);
            setStep(0);
            reset({ tipo: TipoChavePix.CPF, chave: '', preferencial: false });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao remover');
        } finally {
            setLoading(false);
        }
    };

    if (!usuario) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Configurar PIX - {usuario.nome}</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Stepper activeStep={step} sx={{ mb: 3 }}>
                    <Step><StepLabel>Cadastro</StepLabel></Step>
                    <Step><StepLabel>Configurado</StepLabel></Step>
                </Stepper>

                {step === 0 ? (
                    <Box component="form" sx={{ mt: 1 }}>
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
                                    fullWidth
                                    label="Chave PIX"
                                    value={formatarChave(tipoSelecionado, field.value)}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="Informe a chave..."
                                />
                            )}
                        />
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6">
                            {formatarChave(chaveAtual?.tipo as any, chaveAtual?.chave || '')}
                        </Typography>
                        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setStep(0); setModoEdicao(true); }}>
                            Alterar Dados
                        </Button>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {step === 0 && (chaveAtual || usuario.chavePix) && (
                    <Button color="error" onClick={handleRemoverChavePix} disabled={loading}>Remover</Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose}>Fechar</Button>
                {step === 0 && (
                    <Button variant="contained" onClick={handleSubmit(onSubmitCadastro)} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};