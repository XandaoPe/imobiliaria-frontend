import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Button, MenuItem, Alert, CircularProgress,
    Box,
} from '@mui/material';
import {
    Cliente,
    ClienteFormData,
    clienteValidationSchema,
    normalizeCPF,
    normalizeStatus,
    normalizeTelefone
} from '../types/cliente';
import api from '../services/api';

interface ClienteFormModalProps {
    open: boolean;
    onClose: () => void;
    clienteToEdit?: Cliente | null;
    onSuccess: (novoCliente?: Cliente) => void;
}

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
        status: 'ATIVO',
        endereco: '',
        cidade: ''
    };

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ClienteFormData>({
        resolver: yupResolver(clienteValidationSchema) as any, // Adicionado 'as any' para evitar conflitos estritos de tipagem do yup-resolver
        defaultValues,
    });

    // Função para formatar CPF para exibição
    const formatCPF = (cpf: string): string => {
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    };

    // Máscara para Telefone
    const formatTelefone = (telefone: string | null): string => {
        if (!telefone) return '';
        const cleaned = telefone.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
        }
        return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    };

    useEffect(() => {
        if (isEdit && clienteToEdit) {
            reset({
                nome: clienteToEdit.nome || '',
                cpf: normalizeCPF(clienteToEdit.cpf || ''),
                telefone: normalizeTelefone(clienteToEdit.telefone || null),
                email: clienteToEdit.email || '',
                observacoes: clienteToEdit.observacoes || null,
                status: normalizeStatus(clienteToEdit.status || 'ATIVO'),
                endereco: clienteToEdit.endereco || '',
                cidade: clienteToEdit.cidade || ''
            });
        } else {
            reset(defaultValues);
        }
        setError(null);
    }, [isEdit, clienteToEdit, reset]);

    const onSubmit: SubmitHandler<ClienteFormData> = async (data) => {
        setLoading(true);
        setError(null);

        try {
            const dadosEnviar = {
                ...data,
                cpf: normalizeCPF(data.cpf),
                status: normalizeStatus(data.status),
                telefone: normalizeTelefone(data.telefone),
                observacoes: data.observacoes || null,
                endereco: data.endereco || undefined,
                cidade: data.cidade || undefined
            };

            let clienteSalvo: Cliente | undefined;

            if (isEdit && clienteToEdit) {
                const res = await api.put(`/clientes/${clienteToEdit._id}`, dadosEnviar);
                clienteSalvo = res.data;
            } else {
                const res = await api.post('/clientes', dadosEnviar);
                clienteSalvo = res.data;
            }

            onSuccess(clienteSalvo);
            onClose();

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erro ao salvar cliente.';
            setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
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
                            gap: 2,
                            mb: 2,
                        }}
                    >
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

                        <Controller
                            name="cpf"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="CPF"
                                    fullWidth
                                    required
                                    value={formatCPF(field.value || '')}
                                    onChange={(e) => field.onChange(normalizeCPF(e.target.value))}
                                    error={!!errors.cpf}
                                    helperText={errors.cpf?.message}
                                    disabled={isEdit}
                                    inputProps={{ maxLength: 14 }}
                                />
                            )}
                        />

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

                        <Controller
                            name="telefone"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Telefone (DDD)"
                                    fullWidth
                                    value={formatTelefone(field.value || '')}
                                    onChange={(e) => field.onChange(normalizeTelefone(e.target.value))}
                                    error={!!errors.telefone}
                                    helperText={errors.telefone?.message}
                                    inputProps={{ maxLength: 15 }}
                                />
                            )}
                        />

                        {/* NOVOS CAMPOS: ENDEREÇO E CIDADE */}
                        <Controller
                            name="endereco"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Endereço / Bairro"
                                    fullWidth
                                    value={field.value || ''}
                                    error={!!errors.endereco}
                                    helperText={errors.endereco?.message}
                                />
                            )}
                        />

                        <Controller
                            name="cidade"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Cidade/UF"
                                    fullWidth
                                    value={field.value || ''}
                                    error={!!errors.cidade}
                                    helperText={errors.cidade?.message}
                                />
                            )}
                        />

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
                                    sx={{ gridColumn: { sm: 'span 2' } }}
                                >
                                    <MenuItem value="ATIVO">ATIVO</MenuItem>
                                    <MenuItem value="INATIVO">INATIVO</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>

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
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
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