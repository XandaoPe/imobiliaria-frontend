// src/components/ClienteFormModal.tsx
import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Button, MenuItem, Alert, CircularProgress,
    Box,
} from '@mui/material';
import { Cliente, ClienteFormData, clienteValidationSchema, normalizeCPF, normalizeStatus } from '../types/cliente';
import axios from 'axios';

interface ClienteFormModalProps {
    open: boolean;
    onClose: () => void;
    clienteToEdit?: Cliente | null;
    onSuccess: () => void;
}

const API_URL = 'http://localhost:5000/clientes';

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({ open, onClose, clienteToEdit, onSuccess }) => {
    const isEdit = !!clienteToEdit;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const defaultValues: ClienteFormData = {
        nome: '',
        cpf: '',
        telefone: null,
        email: '',
        observacoes: null,
        status: 'ATIVO', // ⭐️ Definindo ATIVO como padrão
    };

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
        setValue
    } = useForm<ClienteFormData>({
        resolver: yupResolver(clienteValidationSchema),
        defaultValues,
    });

    useEffect(() => {
        if (isEdit && clienteToEdit) {
            // ⭐️ Normaliza os dados do cliente vindo do backend
            reset({
                nome: clienteToEdit.nome || '',
                cpf: normalizeCPF(clienteToEdit.cpf || ''), // Remove formatação do CPF
                telefone: clienteToEdit.telefone || null,
                email: clienteToEdit.email || '',
                observacoes: clienteToEdit.observacoes || null,
                status: normalizeStatus(clienteToEdit.status || 'ATIVO'), // Normaliza status
            });
        } else {
            reset(defaultValues);
        }
        setError(null);
    }, [isEdit, clienteToEdit, reset]);

    // ⭐️ Função para formatar CPF para exibição (opcional)
    const formatCPF = (cpf: string): string => {
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    };

    const onSubmit: SubmitHandler<ClienteFormData> = async (data) => {
        setLoading(true);
        setError(null);

        try {
            // ⭐️ Garante que o CPF está limpo (sem formatação)
            const dadosEnviar = {
                ...data,
                cpf: normalizeCPF(data.cpf),
                status: normalizeStatus(data.status),
                telefone: data.telefone || null,
                observacoes: data.observacoes || null,
            };

            if (isEdit && clienteToEdit) {
                await axios.put(`${API_URL}/${clienteToEdit._id}`, dadosEnviar);
                console.log('Cliente atualizado com sucesso:', dadosEnviar);
            } else {
                await axios.post(API_URL, dadosEnviar);
                console.log('Cliente criado com sucesso:', dadosEnviar);
            }

            onSuccess();
            onClose();

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erro ao salvar cliente.';
            setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
            console.error('Erro ao salvar cliente:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEdit ? `Editar Cliente: ${clienteToEdit?.nome}` : 'Novo Cliente'}</DialogTitle>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2
                        }}
                    >
                        <Box>
                            <Controller
                                name="nome"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Nome Completo"
                                        fullWidth
                                        required
                                        error={!!errors.nome}
                                        helperText={errors.nome?.message}
                                    />
                                )}
                            />
                        </Box>

                        <Box>
                            <Controller
                                name="cpf"
                                control={control}
                                render={({ field }) => {
                                    const formattedValue = formatCPF(field.value || '');
                                    return (
                                        <TextField
                                            {...field}
                                            value={formattedValue}
                                            onChange={(e) => {
                                                // Remove formatação para armazenar
                                                const rawValue = normalizeCPF(e.target.value);
                                                field.onChange(rawValue);
                                            }}
                                            label="CPF"
                                            fullWidth
                                            required
                                            error={!!errors.cpf}
                                            helperText={errors.cpf?.message}
                                            disabled={isEdit}
                                            inputProps={{
                                                maxLength: 14 // Permite formatação visual
                                            }}
                                        />
                                    );
                                }}
                            />
                        </Box>

                        <Box>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Email"
                                        fullWidth
                                        required
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                        type="email"
                                    />
                                )}
                            />
                        </Box>

                        <Box>
                            <Controller
                                name="telefone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Telefone"
                                        fullWidth
                                        error={!!errors.telefone}
                                        helperText={errors.telefone?.message}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value || null)}
                                    />
                                )}
                            />
                        </Box>

                        <Box>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Status"
                                        select
                                        fullWidth
                                        required
                                        error={!!errors.status}
                                        helperText={errors.status?.message}
                                    >
                                        <MenuItem value="ATIVO">ATIVO</MenuItem>
                                        <MenuItem value="INATIVO">INATIVO</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Box>

                        <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
                            <Controller
                                name="observacoes"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Observações"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value || null)}
                                    />
                                )}
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : (isEdit ? 'Salvar Alterações' : 'Criar Cliente')}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};