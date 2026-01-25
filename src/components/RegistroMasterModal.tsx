// src/components/RegistroMasterModal.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Alert, FormControlLabel, Switch, Box, Typography
} from '@mui/material';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { EmpresaRegistroMasterFormInputs, RegistroMasterPayload } from '../types/combinedForms';
import { API_URL } from '../services/api';

const API_REGISTRO_URL =  API_URL+'/auth/register-master'; // Exemplo de rota pública

interface RegistroMasterModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RegistroMasterModal: React.FC<RegistroMasterModalProps> = ({ open, onClose, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formKey, setFormKey] = useState(0); // Para forçar o reset no open

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EmpresaRegistroMasterFormInputs>({
        defaultValues: {
            nome: '',
            cnpj: '',
            email: '',
            senha: '',
            nomeCompleto: '',
            // Valores padrão para a criação inicial
            isAdmGeral: false, // O backend deve definir o tipo de empresa
            ativa: true,
        }
    });

    useEffect(() => {
        if (open) {
            setFormKey(prev => prev + 1);
            reset();
            setError(null);
        }
    }, [reset, open]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const onSubmit: SubmitHandler<EmpresaRegistroMasterFormInputs> = async (data) => {
        setLoading(true);
        setError(null);

        // O payload é exatamente os dados do formulário
        const payload: RegistroMasterPayload = {
            ...data,
            // Garantir que a primeira empresa criada por este fluxo NÃO seja adm geral,
            // ou deixe para o backend definir o tipo. Aqui forçamos a exclusão do campo
            // ou definimos o valor, dependendo do que o backend espera. 
            // Para este fluxo, manteremos o campo mas faremos com que o backend o ignore se necessário.
            isAdmGeral: data.isAdmGeral || false, // Geralmente, a primeira empresa é local.
            ativa: true,
        };

        try {
            // Requisição Pública - Sem Token de Autenticação
            const response = await axios.post(API_REGISTRO_URL, payload);

            // Sucesso: Fechar modal e notificar a Landing Page.
            onSuccess();
            alert('Empresa e Usuário Administrador criados com sucesso! Você já pode fazer login.');
            handleClose();

        } catch (err: any) {
            console.error("Erro no Registro Master:", err);
            const message = err.response?.data?.message || 'Ocorreu um erro desconhecido ao realizar o registro.';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>🎯 Criar Minha Administração (Empresa + Usuário Master)</DialogTitle>

            <Box key={formKey} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Typography variant="h6" gutterBottom sx={{ mt: 0, color: 'primary.main' }}>
                        Dados da Empresa
                    </Typography>

                    {/* Campos Empresa: Nome e CNPJ (Reutilizados de EmpresaFormModal) */}
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
                        rules={{
                            required: 'O CNPJ é obrigatório.',
                            pattern: {
                                value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$|^\d{14}$/,
                                message: 'CNPJ inválido (apenas números ou formato XX.XXX.XXX/XXXX-XX)',
                            }
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="CNPJ (Apenas números ou formatado)"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.cnpj}
                                helperText={errors.cnpj?.message}
                            />
                        )}
                    />

                    {/* Switch Opcional - Visível, mas o valor pode ser sobrescrito pelo backend */}
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
                                label="Esta é uma Empresa de Administração Geral?"
                                sx={{ mt: 1, mb: 2 }}
                            />
                        )}
                    />


                    <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'secondary.main' }}>
                        Dados do Usuário Administrador Master
                    </Typography>

                    {/* Campo Nome Completo do Usuário */}
                    <Controller
                        name="nomeCompleto"
                        control={control}
                        rules={{ required: 'O nome completo do administrador é obrigatório.' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Nome Completo (Admin Master)"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.nomeCompleto}
                                helperText={errors.nomeCompleto?.message}
                                sx={{ mt: 0 }}
                            />
                        )}
                    />

                    {/* Campo Email do Usuário */}
                    <Controller
                        name="email"
                        control={control}
                        rules={{
                            required: 'O email é obrigatório.',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                                message: 'Endereço de email inválido'
                            }
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                autoComplete="new-email"
                                label="Email (Login do Admin)"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                            />
                        )}
                    />

                    {/* Campo Senha do Usuário */}
                    <Controller
                        name="senha"
                        control={control}
                        rules={{
                            required: 'A senha é obrigatória.',
                            minLength: {
                                value: 6,
                                message: 'A senha deve ter pelo menos 6 caracteres'
                            }
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Senha"
                                autoComplete="new-password"
                                type="password"
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                error={!!errors.senha}
                                helperText={errors.senha?.message}
                            />
                        )}
                    />
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, mt: 1 }}>
                        O usuário criado será o **Administrador Master** desta empresa.
                    </Typography>
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
                        Criar Administração
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};