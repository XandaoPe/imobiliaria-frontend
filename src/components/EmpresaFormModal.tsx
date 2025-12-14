// src/components/EmpresaFormModal.tsx
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
import { useAuth } from '../contexts/AuthContext'; // Hook de autenticação
import { PerfisEnum } from '../types/usuario'; // Tipagem do perfil

const API_URL = 'http://localhost:5000/empresas';

interface EmpresaFormModalProps {
    open: boolean;
    onClose: () => void;
    empresaToEdit: Empresa | null;
    onSuccess: () => void;
}

export const EmpresaFormModal: React.FC<EmpresaFormModalProps> = ({ open, onClose, empresaToEdit, onSuccess }) => {

    const { user } = useAuth(); // Para obter o token
    const isEditing = !!empresaToEdit;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formKey, setFormKey] = useState(0);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EmpresaFormInputs>({
        defaultValues: {
            nome: '',
            cnpj: '',
            isAdmGeral: false,
            ativa: true,
        }
    });

    // Efeito para resetar e preencher o formulário
    useEffect(() => {
        if (open) {
            setFormKey(prev => prev + 1);

            if (empresaToEdit) {
                reset({
                    nome: empresaToEdit.nome,
                    cnpj: empresaToEdit.cnpj,
                    isAdmGeral: empresaToEdit.isAdmGeral,
                    ativa: empresaToEdit.ativa,
                });
            } else {
                reset({
                    nome: '',
                    cnpj: '',
                    isAdmGeral: false, // Padrão para nova empresa
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

        let payload: CreateEmpresaFormData | UpdateEmpresaFormData = data;

        // Remove a propriedade 'cnpj' da atualização para garantir que o backend não tente alterar
        // um campo que geralmente é imutável em PUTs de recursos com PK/Unique Key.
        // Embora seu backend permita, é uma boa prática de frontend.
        if (isEditing) {
            // Cria uma cópia do payload para manipulação
            const { cnpj, ...updatePayload } = data;

            // O PartialType no backend ignora campos undefined, mas por segurança de tipo
            payload = updatePayload as UpdateEmpresaFormData;
        }

        try {
            const headers = {
                Authorization: `Bearer ${user?.token}`,
            };

            if (isEditing) {
                await axios.put(`${API_URL}/${empresaToEdit!._id}`, payload, { headers });
            } else {
                await axios.post(API_URL, payload, { headers });
            }

            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Ocorreu um erro desconhecido ao salvar a empresa.';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    // Usuário logado deve ser ADM_GERAL para poder manipular o switch isAdmGeral
    const isAdmGeralUser = user?.perfil === PerfisEnum.ADM_GERAL;

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEditing ? `Editar Empresa: ${empresaToEdit?.nome}` : 'Nova Empresa'}</DialogTitle>

            <Box key={formKey} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Campo Nome */}
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

                    {/* Campo CNPJ */}
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
                                // CNPJ é editável apenas na criação
                                disabled={isEditing}
                            />
                        )}
                    />
                    {isEditing && (
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, mt: -1 }}>
                            O CNPJ é uma chave única e não pode ser alterado na edição.
                        </Typography>
                    )}

                    {/* Switches */}
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mt: 1 }}>

                        {/* Switch Ativa */}
                        <Controller
                            name="ativa"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            {...field}
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={field.value ? "Ativa" : "Inativa"}
                                    sx={{ mt: 1 }}
                                />
                            )}
                        />

                        {/* Switch isAdmGeral (Visível/Editável apenas para ADM_GERAL) */}
                        {isAdmGeralUser && (
                            <Controller
                                name="isAdmGeral"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                {...field}
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                color="secondary"
                                            />
                                        }
                                        label="Administração Geral"
                                        sx={{ mt: 1 }}
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