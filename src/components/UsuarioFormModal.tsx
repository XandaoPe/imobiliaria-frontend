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

type UsuarioFormInputs = UpdateUsuarioFormData & { senha?: string }; // Alterado para opcional

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

    // Verifica se o usuário editado é o mesmo que está logado
    const isEditingSelf = React.useMemo(() => {
        if (!isEditing || !loggedInUser || !usuarioToEdit) return false;

        // Compara por ID ou _ID
        const editedUserId = usuarioToEdit.id || usuarioToEdit._id;
        const loggedInUserId = loggedInUser.id || loggedInUser._id;

        return editedUserId?.toString() === loggedInUserId?.toString();
    }, [isEditing, loggedInUser, usuarioToEdit]);

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
                // Para edição de outro usuário, não preenchemos senha
                const resetData: UsuarioFormInputs = {
                    email: usuarioToEdit.email,
                    nome: usuarioToEdit.nome,
                    perfil: usuarioToEdit.perfil,
                    ativo: usuarioToEdit.ativo,
                    // Se for edição de outro usuário, deixamos senha vazia
                    senha: isEditingSelf ? '' : undefined
                };

                reset(resetData);
                setUsuarioCompleto(usuarioToEdit);
                if (id) buscarUsuarioCompleto(id.toString());
            } else {
                // Para criação de novo usuário, mostramos o campo senha
                reset({
                    email: '',
                    nome: '',
                    perfil: PerfisEnum.CORRETOR,
                    ativo: true,
                    senha: ''
                });
                setUsuarioCompleto(null);
            }
            setError(null);
        }
    }, [usuarioToEdit, reset, open, isEditingSelf]);

    const onSubmit: SubmitHandler<UsuarioFormInputs> = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const idParaEnvio = usuarioToEdit?.id || usuarioToEdit?._id;

            if (isEditing) {
                // Para edição de outro usuário, não enviamos senha no payload
                const updatePayload: UpdateUsuarioFormData = {
                    email: data.email,
                    nome: data.nome,
                    perfil: data.perfil,
                    ativo: data.ativo,
                };

                // Só adiciona senha se for edição própria E tiver preenchido
                if (isEditingSelf && data.senha && data.senha.trim() !== '') {
                    updatePayload.senha = data.senha;
                }

                await api.put(`/usuarios/${idParaEnvio}`, updatePayload);
            } else {
                // Para criação, sempre envia senha (é obrigatória)
                const createPayload: CreateUsuarioFormData = {
                    ...data,
                    senha: data.senha || '' // Garante que tenha senha
                };
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

    // Determina quando mostrar o campo senha
    const shouldShowPasswordField = () => {
        if (!isEditing) {
            return true; // Para criação, sempre mostra
        }
        return isEditingSelf; // Para edição, só mostra se for o próprio usuário
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                            {isEditing
                                ? `Editar Usuário: ${usuarioToEdit?.nome}`
                                : 'Novo Usuário'
                            }
                            {isEditingSelf && (
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                    (Seus dados)
                                </Typography>
                            )}
                        </span>

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
                                <TextField
                                    {...field}
                                    label="Nome Completo"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.nome}
                                    helperText={errors.nome?.message}
                                />
                            )}
                        />

                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: 'O e-mail é obrigatório.',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'E-mail inválido'
                                }
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="E-mail"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    disabled={isEditingSelf}
                                />
                            )}
                        />

                        {/* Campo Senha - Condicional */}
                        {shouldShowPasswordField() && (
                            <Controller
                                name="senha"
                                control={control}
                                rules={{
                                    // Para criação, senha é obrigatória
                                    // Para edição própria, senha é opcional
                                    required: !isEditing ? 'A senha é obrigatória' : false,
                                    minLength: isEditingSelf ? {
                                        value: 6,
                                        message: 'A senha deve ter pelo menos 6 caracteres'
                                    } : undefined
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={
                                            isEditingSelf
                                                ? "Alterar Senha (Deixe em branco para manter a atual)"
                                                : isEditing
                                                    ? "Nova Senha (Opcional)"
                                                    : "Senha"
                                        }
                                        type="password"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.senha}
                                        helperText={errors.senha?.message}
                                        placeholder={isEditingSelf ? "Digite nova senha..." : "Digite a senha..."}
                                    />
                                )}
                            />
                        )}

                        {/* Mensagem informativa quando não é possível alterar senha */}
                        {isEditing && !isEditingSelf && (
                            <Box sx={{
                                mb: 2,
                                p: 1.5,
                                bgcolor: 'info.light',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'info.main'
                            }}>
                                <Typography variant="caption" sx={{ color: 'info.contrastText' }}>
                                    <strong>Nota:</strong> Apenas o próprio usuário pode alterar sua senha.
                                    Para redefinir senha de outro usuário, use a opção "Esqueci minha senha"
                                    no login ou entre em contato com o administrador.
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Controller
                                name="perfil"
                                control={control}
                                rules={{ required: 'O perfil é obrigatório' }}
                                render={({ field }) => (
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Perfil</InputLabel>
                                        <Select
                                            {...field}
                                            label="Perfil"
                                            error={!!errors.perfil}
                                            disabled={isEditingSelf}
                                        >
                                            {Object.values(PerfisEnum).map((p) => (
                                                <MenuItem key={p} value={p}>{p}</MenuItem>
                                            ))}
                                        </Select>
                                        {errors.perfil && (
                                            <Typography variant="caption" color="error">
                                                {errors.perfil.message}
                                            </Typography>
                                        )}
                                    </FormControl>
                                )}
                            />
                            <Controller
                                name="ativo"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        }
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