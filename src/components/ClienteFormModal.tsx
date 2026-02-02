// src/components/cliente/ClienteFormModal.tsx - VERSÃO CORRIGIDA (SEM VALIDAÇÃO PIX)
import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Button, MenuItem, Alert, CircularProgress,
    Box, IconButton, Tooltip, Chip,
    Typography
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
import { QrCode, CheckCircle } from '@mui/icons-material';
import { ClientePixModal } from './cliente/ClientePixModal';
import EditIcon from '@mui/icons-material/Edit';

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
    const [pixModalOpen, setPixModalOpen] = useState(false);
    const [clienteCompleto, setClienteCompleto] = useState<Cliente | null>(clienteToEdit || null);

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
        resolver: yupResolver(clienteValidationSchema) as any,
        defaultValues,
    });

    const formatCPF = (cpf: string): string => {
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    };

    const formatTelefone = (telefone: string | null): string => {
        if (!telefone) return '';
        const cleaned = telefone.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
        }
        return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    };

    // Buscar cliente completo para atualizar dados PIX
    const buscarClienteCompleto = async (clienteId: string) => {
        try {
            const response = await api.get(`/clientes/${clienteId}`);
            setClienteCompleto(response.data);
        } catch (err) {
            console.error('Erro ao buscar dados do cliente:', err);
        }
    };

    useEffect(() => {
        if (open) {
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
                setClienteCompleto(clienteToEdit);

                // Buscar dados atualizados se necessário
                if (clienteToEdit._id) {
                    buscarClienteCompleto(clienteToEdit._id);
                }
            } else {
                reset(defaultValues);
                setClienteCompleto(null);
            }
            setError(null);
        }
    }, [open, isEdit, clienteToEdit, reset]);

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

            let clienteSalvo: Cliente;

            if (isEdit && clienteToEdit) {
                const res = await api.put(`/clientes/${clienteToEdit._id}`, dadosEnviar);
                clienteSalvo = res.data;

                // Atualizar dados locais
                setClienteCompleto(clienteSalvo);
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

    // Função para verificar se cliente tem PIX configurado
    const temPixConfigurado = (cliente: Cliente | null): boolean => {
        if (!cliente) return false;
        return !!cliente.chavePix?.chave; // REMOVIDA VERIFICAÇÃO DE VALIDADO
    };

    // Função para formatar chave PIX para exibição
    const formatarChavePix = (chavePix: any): string => {
        if (!chavePix?.chave) return '';

        switch (chavePix.tipo) {
            case 'CPF':
                return chavePix.chave.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            case 'CNPJ':
                return chavePix.chave.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            case 'TELEFONE':
                const cleaned = chavePix.chave.replace(/\D/g, '');
                if (cleaned.length === 11) {
                    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                }
                return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            default:
                return chavePix.chave;
        }
    };

    // Status da chave PIX - SEM VALIDAÇÃO PENDENTE
    const getStatusPix = () => {
        if (!clienteCompleto?.chavePix?.chave) return null;

        // SEMPRE considera como validado
        return {
            label: 'PIX Configurado',
            color: 'success' as const,
            icon: <CheckCircle fontSize="small" />
        };
    };

    const statusPix = getStatusPix();

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{isEdit ? `Editar Cliente: ${clienteToEdit?.nome}` : 'Novo Cliente'}</span>

                        {isEdit && clienteCompleto && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {statusPix && (
                                    <Tooltip title={
                                        <Box>
                                            <Typography variant="body2">
                                                <strong>Chave PIX:</strong> {formatarChavePix(clienteCompleto.chavePix)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'success.main' }}>
                                                Configurado
                                            </Typography>
                                        </Box>
                                    }>
                                        <Chip
                                            icon={statusPix.icon}
                                            label={statusPix.label}
                                            size="small"
                                            color={statusPix.color}
                                            variant="outlined"
                                        />
                                    </Tooltip>
                                )}

                                <Tooltip title={clienteCompleto?.chavePix?.chave ? "Alterar Chave PIX" : "Configurar PIX"}>
                                    <IconButton
                                        onClick={() => setPixModalOpen(true)}
                                        color="primary"
                                        size="small"
                                    >
                                        {clienteCompleto?.chavePix?.chave ? <EditIcon /> : <QrCode />}
                                    </IconButton>
                                </Tooltip>
                                
                            </Box>
                        )}
                    </Box>
                </DialogTitle>

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        {/* EXIBIR CHAVE PIX CONFIGURADA */}
                        {isEdit && clienteCompleto?.chavePix?.chave && (
                            <Box sx={{
                                mb: 3,
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: 'text.primary',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <QrCode fontSize="small" sx={{ color: 'primary.main' }} />
                                        <span>Chave PIX Configurada:</span>
                                    </Typography>

                                    <Tooltip title="Alterar Chave PIX">
                                        <IconButton
                                            onClick={() => setPixModalOpen(true)}
                                            color="primary"
                                            size="small"
                                            sx={{ p: 0.5 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {/* TIPO E CHAVE NA MESMA LINHA */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    flexWrap: 'wrap'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Tipo:
                                        </Typography>
                                        <Chip
                                            label={clienteCompleto.chavePix.tipo}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        flex: 1,
                                        minWidth: 0 // Permite quebra de texto
                                    }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                            Chave:
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            color: 'text.primary',
                                            fontFamily: 'monospace',
                                            fontSize: '0.9rem',
                                            wordBreak: 'break-all',
                                            flex: 1
                                        }}>
                                            {formatarChavePix(clienteCompleto.chavePix)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                            <Controller
                                name="nome"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Nome Completo" fullWidth required error={!!errors.nome} helperText={errors.nome?.message} />
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
                                    <TextField {...field} label="Email" fullWidth required error={!!errors.email} helperText={errors.email?.message} type="email" />
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

                            <Controller
                                name="endereco"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Endereço / Bairro" fullWidth value={field.value || ''} error={!!errors.endereco} helperText={errors.endereco?.message} />
                                )}
                            />

                            <Controller
                                name="cidade"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Cidade/UF" fullWidth value={field.value || ''} error={!!errors.cidade} helperText={errors.cidade?.message} />
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
                        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : (isEdit ? 'Salvar Alterações' : 'Criar Cliente')}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Modal de Configuração PIX */}
            {isEdit && clienteCompleto && (
                <ClientePixModal
                    open={pixModalOpen}
                    onClose={() => setPixModalOpen(false)}
                    cliente={clienteCompleto}
                    onSuccess={() => {
                        setPixModalOpen(false);
                        // Atualizar dados do cliente
                        if (clienteCompleto._id) {
                            buscarClienteCompleto(clienteCompleto._id);
                        }
                        onSuccess(clienteCompleto);
                    }}
                />
            )}
        </>
    );
};