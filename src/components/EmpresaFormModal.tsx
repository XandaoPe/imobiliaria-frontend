import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Alert, FormControlLabel, Switch, Box, Typography
} from '@mui/material';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import {
    Empresa,
    EmpresaFormInputs,
    CreateEmpresaFormData,
    UpdateEmpresaFormData
} from '../types/empresa';
import { useAuth } from '../contexts/AuthContext';
import { PerfisEnum } from '../types/usuario';

const API_URL = 'http://localhost:5000/empresas';

interface EmpresaFormModalProps {
    open: boolean;
    onClose: () => void;
    empresaToEdit: Empresa | null;
    onSuccess: () => void;
}

export const EmpresaFormModal: React.FC<EmpresaFormModalProps> = ({ open, onClose, empresaToEdit, onSuccess }) => {
    const { user } = useAuth();
    const isEditing = !!empresaToEdit;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formKey, setFormKey] = useState(0);

    // --- FUNÇÕES DE MÁSCARA E NORMALIZAÇÃO (IGUAL AO CLIENTE) ---
    const formatTelefone = (telefone: string | null): string => {
        if (!telefone) return '';
        const cleaned = telefone.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
        }
        if (cleaned.length > 10) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
        }
        return cleaned;
    };

    const normalizeTelefone = (value: string | null): string => {
        if (!value) return '';
        return value.replace(/\D/g, '');
    };

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EmpresaFormInputs>({
        defaultValues: {
            nome: '',
            cnpj: '',
            fone: '',
            isAdmGeral: false,
            ativa: true,
        }
    });

    useEffect(() => {
        if (open) {
            setFormKey(prev => prev + 1);
            if (empresaToEdit) {
                reset({
                    nome: empresaToEdit.nome,
                    cnpj: empresaToEdit.cnpj,
                    // Garante que o telefone venha limpo para o formulário
                    fone: normalizeTelefone(empresaToEdit.fone || ''),
                    isAdmGeral: empresaToEdit.isAdmGeral,
                    ativa: empresaToEdit.ativa,
                });
            } else {
                reset({
                    nome: '',
                    cnpj: '',
                    fone: '',
                    isAdmGeral: false,
                    ativa: true,
                });
            }
            setError(null);
        }
    }, [empresaToEdit, reset, open]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const onSubmit: SubmitHandler<EmpresaFormInputs> = async (data) => {
        setLoading(true);
        setError(null);

        // Normaliza o telefone antes de enviar para o backend
        const payloadFinal = {
            ...data,
            fone: normalizeTelefone(data.fone || null)
        };

        try {
            const headers = {
                Authorization: `Bearer ${user?.token}`,
            };

            if (isEditing) {
                const { cnpj, ...updatePayload } = payloadFinal;
                await axios.put(`${API_URL}/${empresaToEdit!._id}`, updatePayload, { headers });
            } else {
                await axios.post(API_URL, payloadFinal, { headers });
            }

            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Ocorreu um erro desconhecido.';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    const isAdmGeralUser = user?.perfil === PerfisEnum.ADM_GERAL;

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEditing ? `Editar Empresa: ${empresaToEdit?.nome}` : 'Nova Empresa'}</DialogTitle>

            <Box key={formKey} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Controller
                        name="nome"
                        control={control}
                        rules={{ required: 'O nome da empresa é obrigatório.' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Nome da Empresa/Imobiliária"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.nome}
                                helperText={errors.nome?.message}
                                sx={{ mt: 0 }}
                            />
                        )}
                    />

                    <Controller
                        name="cnpj"
                        control={control}
                        rules={{ required: 'O CNPJ é obrigatório.' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="CNPJ"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.cnpj}
                                helperText={errors.cnpj?.message}
                                disabled={isEditing}
                            />
                        )}
                    />
                    {isEditing && (
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, mt: -1 }}>
                            O CNPJ é uma chave única e não pode ser alterado na edição.
                        </Typography>
                    )}

                    {/* CAMPO TELEFONE COM MÁSCARA APLICADA */}
                    <Controller
                        name="fone"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Telefone / WhatsApp"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.fone}
                                helperText={errors.fone?.message}
                                value={formatTelefone(field.value || null)} // Formata para o usuário
                                onChange={(e) => {
                                    const rawValue = normalizeTelefone(e.target.value);
                                    field.onChange(rawValue); // Salva no state apenas números
                                }}
                                inputProps={{ maxLength: 15 }}
                            />
                        )}
                    />

                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mt: 1 }}>
                        <Controller
                            name="ativa"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={field.value ? "Ativa" : "Inativa"}
                                />
                            )}
                        />

                        {isAdmGeralUser && (
                            <Controller
                                name="isAdmGeral"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                color="secondary"
                                            />
                                        }
                                        label="Administração Geral"
                                    />
                                )}
                            />
                        )}
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={loading} color="secondary">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isEditing ? 'Salvar Empresa' : 'Criar Empresa'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};