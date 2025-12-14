// src/components/UsuarioFormModal.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Alert, FormControlLabel, Switch, MenuItem, Select, InputLabel, FormControl, Box, Typography
} from '@mui/material';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import {
    Usuario,
    PerfisEnum,
    UpdateUsuarioFormData,
    CreateUsuarioFormData
} from '../types/usuario';

const API_URL = 'http://localhost:5000/usuarios';

// O tipo de input agora inclui o campo 'senha' opcional (ou obrigatório na criação)
// para uso interno do hook-form, mas só será USADO/EXIBIDO na criação.
// ⚠️ Nota: Mantemos o campo 'senha' no tipo, mas apenas o exibiremos na criação.
type UsuarioFormInputs = UpdateUsuarioFormData & { senha: string };

interface UsuarioFormModalProps {
    open: boolean;
    onClose: () => void;
    usuarioToEdit: Usuario | null;
    onSuccess: () => void;
}

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({ open, onClose, usuarioToEdit, onSuccess }) => {
    const isEditing = !!usuarioToEdit;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
    } = useForm<UsuarioFormInputs>({
        defaultValues: {
            email: '',
            nome: '',
            perfil: PerfisEnum.CORRETOR,
            ativo: true,
            senha: '' // Padrão vazio para senha
        }
    });

    // Resetar o formulário com base no modo (edição ou criação)
    useEffect(() => {
        if (usuarioToEdit) {
            reset({
                email: usuarioToEdit.email,
                nome: usuarioToEdit.nome,
                perfil: usuarioToEdit.perfil,
                ativo: usuarioToEdit.ativo,
                senha: '', // Limpa a senha na edição
            });
        } else {
            reset({
                email: '',
                nome: '',
                perfil: PerfisEnum.CORRETOR,
                ativo: true,
                senha: '',
            });
        }
        setError(null);
    }, [usuarioToEdit, reset, open]);

    const onSubmit: SubmitHandler<UsuarioFormInputs> = async (data) => {
        setLoading(true);
        setError(null);

        let payload: UpdateUsuarioFormData | CreateUsuarioFormData;

        if (isEditing) {
            // 1. EDIÇÃO: Remove a senha do payload, forçando a atualização APENAS dos campos de dados
            payload = {
                email: data.email,
                nome: data.nome,
                perfil: data.perfil,
                ativo: data.ativo,
            } as UpdateUsuarioFormData;

            // Mesmo que a senha estivesse no watch, ela é IGNORADA aqui,
            // cumprindo a regra de que este modal não altera senha.

        } else {
            // 2. CRIAÇÃO: A senha é obrigatória (a validação de required fará o trabalho).
            payload = {
                email: data.email,
                nome: data.nome,
                perfil: data.perfil,
                ativo: data.ativo,
                senha: data.senha // Necessário na criação
            } as CreateUsuarioFormData;
        }

        try {
            if (isEditing) {
                // PUT: Envia apenas os campos do UpdateUsuarioFormData
                await axios.put(`${API_URL}/${usuarioToEdit!._id}`, payload);
            } else {
                // POST: Envia os campos do CreateUsuarioFormData (incluindo senha)
                await axios.post(API_URL, payload);
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

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEditing ? `Editar Usuário: ${usuarioToEdit?.nome}` : 'Novo Usuário'}</DialogTitle>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate autoComplete='off'>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Campo Nome */}
                    <Controller
                        name="nome"
                        control={control}
                        rules={{ required: 'O nome é obrigatório.' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Nome Completo"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.nome}
                                helperText={errors.nome?.message}
                                sx={{ mt: 0 }}
                            />
                        )}
                    />

                    {/* Campo Email */}
                    <Controller
                        name="email"
                        control={control}
                        rules={{
                            required: 'O e-mail é obrigatório.',
                            pattern: {
                                value: /^\S+@\S+$/i,
                                message: "Formato de e-mail inválido."
                            }
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="E-mail"
                                fullWidth
                                autoComplete='off'
                                variant="outlined"
                                margin="normal"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                            />
                        )}
                    />

                    {/* Campo Senha - VISÍVEL APENAS NA CRIAÇÃO */}
                    {!isEditing && (
                        <>
                            <Controller
                                name="senha"
                                control={control}
                                rules={{
                                    required: 'A senha é obrigatória na criação.',
                                    minLength: {
                                        value: 6,
                                        message: "A senha deve ter no mínimo 6 caracteres."
                                    }
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Senha"
                                        type="password"
                                        autoComplete="new-password"
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        error={!!errors.senha}
                                        helperText={errors.senha?.message}
                                    />
                                )}
                            />
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, mt: -1 }}>
                                A senha é obrigatória para novos usuários.
                            </Typography>
                        </>
                    )}
                    {/* FIM: Campo Senha */}


                    {/* Seletor de Perfil e Switch de Ativo */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 1 }}>

                        {/* Campo Perfil */}
                        <Controller
                            name="perfil"
                            control={control}
                            rules={{ required: 'O perfil é obrigatório.' }}
                            render={({ field }) => (
                                <FormControl fullWidth margin="normal" error={!!errors.perfil} sx={{ mt: 0.5 }}>
                                    <InputLabel id="perfil-label">Perfil</InputLabel>
                                    <Select
                                        {...field}
                                        labelId="perfil-label"
                                        label="Perfil"
                                        variant="outlined"
                                    >
                                        {Object.values(PerfisEnum).map((perfil) => (
                                            <MenuItem key={perfil} value={perfil}>
                                                {perfil.replace('_', ' ')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.perfil && <Typography color="error" variant="caption" sx={{ ml: 1, mt: 0.5 }}>{errors.perfil.message}</Typography>}
                                </FormControl>
                            )}
                        />

                        {/* Campo Ativo */}
                        <Controller
                            name="ativo"
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
                                    label={field.value ? "Ativo" : "Inativo"}
                                    sx={{
                                        mt: isEditing ? 1.5 : 2.5, // Ajusta o alinhamento 
                                        flexShrink: 0
                                    }}
                                />
                            )}
                        />
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
                        {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};