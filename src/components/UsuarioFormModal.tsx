// src/components/usuario/UsuarioFormModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Alert, FormControlLabel, Switch, MenuItem, Select,
    InputLabel, FormControl, Box, Typography, IconButton, Tooltip, Chip
} from '@mui/material';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import {
    Usuario,
    PerfisEnum,
    UpdateUsuarioFormData,
    CreateUsuarioFormData
} from '../types/usuario';
import api from '../services/api';

// Ícones
import { QrCode, CheckCircle, Edit as EditIcon } from '@mui/icons-material';
import { UsuarioPixModal } from './usuario/UsuarioPixModal';
// Assumindo que você criará/renomeará o modal de PIX para Usuários

type UsuarioFormInputs = UpdateUsuarioFormData & { senha: string };

interface UsuarioFormModalProps {
    open: boolean;
    onClose: () => void;
    usuarioToEdit: Usuario | null;
    onSuccess: () => void;
}

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({ open, onClose, usuarioToEdit, onSuccess }) => {
    const { user: loggedInUser } = useAuth();
    const isEditing = !!usuarioToEdit;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pixModalOpen, setPixModalOpen] = useState(false);
    const [usuarioCompleto, setUsuarioCompleto] = useState<Usuario | null>(usuarioToEdit || null);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<UsuarioFormInputs>({
        defaultValues: {
            email: '', nome: '', perfil: PerfisEnum.CORRETOR, ativo: true, senha: ''
        }
    });

    // --- HELPERS DE FORMATAÇÃO (PIX) ---
    const formatarChavePix = (chavePix: any): string => {
        if (!chavePix?.chave) return '';
        const chave = chavePix.chave;
        switch (chavePix.tipo) {
            case 'CPF': return chave.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            case 'TELEFONE':
                const c = chave.replace(/\D/g, '');
                return c.length === 11 ? c.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : c.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            case 'EMAIL': return chave;
            default: return chave;
        }
    };

    const buscarUsuarioCompleto = async (id: string) => {
        try {
            const response = await api.get(`/usuarios/${id}`);
            setUsuarioCompleto(response.data);
        } catch (err) {
            console.error('Erro ao buscar dados do usuário:', err);
        }
    };

    useEffect(() => {
        if (open) {
            if (usuarioToEdit) {
                const id = usuarioToEdit.id || usuarioToEdit._id;
                reset({
                    email: usuarioToEdit.email,
                    nome: usuarioToEdit.nome,
                    perfil: usuarioToEdit.perfil,
                    ativo: usuarioToEdit.ativo,
                    senha: '',
                });
                setUsuarioCompleto(usuarioToEdit);
                if (id) buscarUsuarioCompleto(id.toString());
            } else {
                reset({ email: '', nome: '', perfil: PerfisEnum.CORRETOR, ativo: true, senha: '' });
                setUsuarioCompleto(null);
            }
            setError(null);
        }
    }, [usuarioToEdit, reset, open]);

    const isEditingSelf = isEditing &&
        !!(usuarioToEdit && loggedInUser &&
            (usuarioToEdit.id?.toString() === loggedInUser.id?.toString() ||
                usuarioToEdit._id?.toString() === loggedInUser._id?.toString()));

    const onSubmit: SubmitHandler<UsuarioFormInputs> = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const idParaEnvio = usuarioToEdit?.id || usuarioToEdit?._id;
            if (isEditing) {
                const updatePayload: UpdateUsuarioFormData = {
                    email: data.email,
                    nome: data.nome,
                    perfil: data.perfil,
                    ativo: data.ativo,
                    ...(data.senha ? { senha: data.senha } : {})
                };
                await api.put(`/usuarios/${idParaEnvio}`, updatePayload);
            } else {
                const createPayload: CreateUsuarioFormData = { ...data };
                await api.post('/usuarios', createPayload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao processar requisição.';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{isEditing ? `Editar Usuário: ${usuarioToEdit?.nome}` : 'Novo Usuário'}</span>

                        {isEditing && usuarioCompleto && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {usuarioCompleto.chavePix?.chave && (
                                    <Chip
                                        icon={<CheckCircle fontSize="small" />}
                                        label="PIX Configurado"
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                )}
                                <Tooltip title="Configurar PIX">
                                    <IconButton onClick={() => setPixModalOpen(true)} color="primary" size="small">
                                        {usuarioCompleto.chavePix?.chave ? <EditIcon /> : <QrCode />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>
                </DialogTitle>

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        {/* Visualização da Chave PIX Atual */}
                        {isEditing && usuarioCompleto?.chavePix?.chave && (
                            <Box sx={{
                                mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1,
                                border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <QrCode fontSize="small" color="primary" /> Chave PIX Principal
                                    </Typography>
                                    <Button size="small" onClick={() => setPixModalOpen(true)} startIcon={<EditIcon />}>Alterar</Button>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Typography variant="caption"><strong>Tipo:</strong> {usuarioCompleto.chavePix.tipo}</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {formatarChavePix(usuarioCompleto.chavePix)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        <Controller
                            name="nome"
                            control={control}
                            rules={{ required: 'O nome é obrigatório.' }}
                            render={({ field }) => (
                                <TextField {...field} label="Nome Completo" fullWidth margin="normal" error={!!errors.nome} helperText={errors.nome?.message} />
                            )}
                        />

                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="E-mail" fullWidth margin="normal" error={!!errors.email} helperText={errors.email?.message} disabled={isEditingSelf} />
                            )}
                        />

                        <Controller
                            name="senha"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label={isEditing ? "Alterar Senha (Opcional)" : "Senha"} type="password" fullWidth margin="normal" error={!!errors.senha} helperText={errors.senha?.message} />
                            )}
                        />

                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Controller
                                name="perfil"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Perfil</InputLabel>
                                        <Select {...field} label="Perfil" disabled={isEditingSelf}>
                                            {Object.values(PerfisEnum).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                            <Controller
                                name="ativo"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                                        label={field.value ? "Ativo" : "Inativo"}
                                        disabled={isEditingSelf}
                                        sx={{ mt: 2 }}
                                    />
                                )}
                            />
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={onClose} color="secondary">Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : (isEditing ? 'Salvar' : 'Criar')}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Modal de Configuração PIX para Usuário */}
            {isEditing && usuarioCompleto && (usuarioCompleto.id || usuarioCompleto._id) && (
                <UsuarioPixModal
                    open={pixModalOpen}
                    onClose={() => setPixModalOpen(false)}
                    // Garante que o objeto passado tenha o campo 'id' preenchido para o service
                    usuario={{
                        ...usuarioCompleto,
                        id: (usuarioCompleto.id || usuarioCompleto._id)?.toString() || ''
                    }}
                    onSuccess={() => {
                        const id = usuarioCompleto.id || usuarioCompleto._id;
                        if (id) buscarUsuarioCompleto(id.toString());
                        onSuccess();
                    }}
                />
            )}
        </>
    );
};