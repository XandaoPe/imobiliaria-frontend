import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    CircularProgress, Alert, FormControlLabel, Switch, Box, Typography,
    Avatar, IconButton, Divider
} from '@mui/material';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { PhotoCamera, CloudUpload, AssignmentInd, CheckCircle } from '@mui/icons-material';
import { Empresa, EmpresaFormInputs } from '../types/empresa';
import { useAuth } from '../contexts/AuthContext';
import { PerfisEnum } from '../types/usuario';
import api from '../services/api';

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
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSign, setUploadingSign] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formKey, setFormKey] = useState(0);

    // NOVO ESTADO: armazena o ID da empresa recém-criada
    const [novaEmpresaId, setNovaEmpresaId] = useState<string | null>(null);
    const [empresaCriada, setEmpresaCriada] = useState<Empresa | null>(null);

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(null);

    // VARIÁVEL AUXILIAR: verifica se temos um ID para upload
    const empresaIdParaUpload = empresaToEdit?._id || novaEmpresaId;
    const podeFazerUpload = !!empresaIdParaUpload;

    const formatTelefone = (telefone: string | null): string => {
        if (!telefone) return '';
        const cleaned = telefone.replace(/\D/g, '');
        return cleaned.length <= 10
            ? cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
            : cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    };

    const normalizeTelefone = (value: string | null): string => value ? value.replace(/\D/g, '') : '';

    const { control, handleSubmit, reset, formState: { errors } } = useForm<EmpresaFormInputs>({
        defaultValues: { nome: '', cnpj: '', fone: '', isAdmGeral: false, ativa: true }
    });

    useEffect(() => {
        if (open) {
            setFormKey(prev => prev + 1);
            if (empresaToEdit) {
                reset({
                    nome: empresaToEdit.nome,
                    cnpj: empresaToEdit.cnpj,
                    fone: normalizeTelefone(empresaToEdit.fone || ''),
                    isAdmGeral: empresaToEdit.isAdmGeral,
                    ativa: empresaToEdit.ativa,
                });
                setLogoUrl(empresaToEdit.logo || null);
                setAssinaturaUrl(empresaToEdit.assinatura_url || null);
                setNovaEmpresaId(null);
                setEmpresaCriada(null);
            } else {
                reset({ nome: '', cnpj: '', fone: '', isAdmGeral: false, ativa: true });
                setLogoUrl(null);
                setAssinaturaUrl(null);
                setNovaEmpresaId(null);
                setEmpresaCriada(null);
            }
            setError(null);
        }
    }, [empresaToEdit, reset, open]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'assinatura') => {
        const file = event.target.files?.[0];
        if (!file || !empresaIdParaUpload) return;

        const isLogo = type === 'logo';
        isLogo ? setUploadingLogo(true) : setUploadingSign(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = isLogo ? 'logo' : 'assinatura';
            const response = await api.post(`/empresas/${empresaIdParaUpload}/${endpoint}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (isLogo) setLogoUrl(response.data.logo);
            else setAssinaturaUrl(response.data.assinatura_url);

            onSuccess(); // Atualiza a lista
        } catch (err: any) {
            setError(`Erro no upload: ${err.response?.data?.message || 'Falha na comunicação'}`);
        } finally {
            isLogo ? setUploadingLogo(false) : setUploadingSign(false);
        }
    };

    const onSubmit: SubmitHandler<EmpresaFormInputs> = async (data) => {
        setLoading(true);
        setError(null);
        const payloadFinal = { ...data, fone: normalizeTelefone(data.fone || null) };

        try {
            if (isEditing) {
                // EDIÇÃO NORMAL: remove CNPJ do payload
                const { cnpj, ...updatePayload } = payloadFinal;
                await api.put(`/empresas/${empresaToEdit!._id}`, updatePayload);
                onSuccess();
                onClose(); // Fecha após edição
            } else if (novaEmpresaId) {
                // ATUALIZAÇÃO APÓS CRIAÇÃO: também remove CNPJ
                const { cnpj, ...updatePayload } = payloadFinal;
                await api.put(`/empresas/${novaEmpresaId}`, updatePayload);
                onSuccess();

                // AGORA FECHA O MODAL após salvar alterações
                handleCloseModal();
            } else {
                // CRIAÇÃO INICIAL
                const response = await api.post(`/empresas`, payloadFinal);
                const empresaCriadaData = response.data;

                // Armazena o ID da empresa recém-criada
                setNovaEmpresaId(empresaCriadaData._id);
                setEmpresaCriada(empresaCriadaData);

                onSuccess();

                // Reseta o formulário com os dados da empresa criada
                reset({
                    nome: empresaCriadaData.nome,
                    cnpj: empresaCriadaData.cnpj,
                    fone: normalizeTelefone(empresaCriadaData.fone || ''),
                    isAdmGeral: empresaCriadaData.isAdmGeral,
                    ativa: empresaCriadaData.ativa,
                });
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao salvar.';
            setError(Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    // NOVA FUNÇÃO: resetar tudo ao fechar
    const handleCloseModal = () => {
        setNovaEmpresaId(null);
        setEmpresaCriada(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="sm">
            <DialogTitle>
                {novaEmpresaId ? `Configurar Empresa` :
                    isEditing ? `Editar Empresa` : 'Nova Empresa'}
            </DialogTitle>

            <Box key={formKey} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* MENSAGEM DE SUCESSO APÓS CRIAÇÃO */}
                    {novaEmpresaId && !isEditing && (
                        <Alert
                            severity="success"
                            icon={<CheckCircle />}
                            sx={{ mb: 2 }}
                        >
                            Empresa criada com sucesso! Agora você pode configurar a identidade visual.
                        </Alert>
                    )}

                    {/* Container Principal Vertical */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                        <Controller
                            name="nome"
                            control={control}
                            rules={{ required: 'O nome é obrigatório.' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nome da Empresa/Imobiliária"
                                    fullWidth
                                    size="small"
                                    error={!!errors.nome}
                                    helperText={errors.nome?.message}
                                />
                            )}
                        />

                        {/* Box Horizontal para CNPJ e Telefone */}
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Controller
                                name="cnpj"
                                control={control}
                                rules={{ required: 'CNPJ obrigatório.' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="CNPJ"
                                        sx={{ flex: 1 }}
                                        size="small"
                                        disabled={isEditing || !!novaEmpresaId}
                                        error={!!errors.cnpj}
                                        helperText={errors.cnpj?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="fone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Telefone"
                                        sx={{ flex: 1 }}
                                        size="small"
                                        value={formatTelefone(field.value || null)}
                                        onChange={(e) => field.onChange(normalizeTelefone(e.target.value))}
                                    />
                                )}
                            />
                        </Box>

                        {/* SEÇÃO DE UPLOAD (APENAS QUANDO TEM ID) */}
                        {podeFazerUpload && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                    Identidade Visual e Assinatura
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {/* Container das Imagens */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', gap: 2 }}>

                                    {/* Upload Logo */}
                                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>Logo</Typography>
                                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                            <Avatar src={logoUrl || ''} sx={{ width: 80, height: 80, border: '1px solid #ddd', bgcolor: '#f5f5f5' }}>
                                                {!logoUrl && <CloudUpload />}
                                            </Avatar>
                                            {uploadingLogo && <CircularProgress size={24} sx={{ position: 'absolute', top: 28, left: 28 }} />}
                                            <IconButton
                                                color="primary"
                                                component="label"
                                                sx={{ position: 'absolute', bottom: -10, right: -10, bgcolor: 'white', boxShadow: 2 }}
                                                disabled={uploadingLogo}
                                            >
                                                <input hidden accept="image/*" type="file" onChange={(e) => handleFileUpload(e, 'logo')} />
                                                <PhotoCamera fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Upload Assinatura */}
                                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>Assinatura Digital</Typography>
                                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                            <Box sx={{
                                                width: 120,
                                                height: 80,
                                                border: '1px dashed #ccc',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: '#fafafa',
                                                overflow: 'hidden'
                                            }}>
                                                {assinaturaUrl ? <img src={assinaturaUrl} alt="Assinatura" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <AssignmentInd color="disabled" />}
                                            </Box>
                                            {uploadingSign && <CircularProgress size={24} sx={{ position: 'absolute', top: 28, left: 48 }} />}
                                            <IconButton
                                                color="secondary"
                                                component="label"
                                                sx={{ position: 'absolute', bottom: -10, right: -10, bgcolor: 'white', boxShadow: 2 }}
                                                disabled={uploadingSign}
                                            >
                                                <input hidden accept="image/*" type="file" onChange={(e) => handleFileUpload(e, 'assinatura')} />
                                                <PhotoCamera fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Controller
                                name="ativa"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        }
                                        label="Ativa"
                                    />
                                )}
                            />
                            {user?.perfil === PerfisEnum.ADM_GERAL && (
                                <Controller
                                    name="isAdmGeral"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    color="secondary"
                                                    checked={field.value}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                            }
                                            label="Adm Geral"
                                        />
                                    )}
                                />
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCloseModal}
                        disabled={loading || uploadingLogo || uploadingSign}
                    >
                        {novaEmpresaId ? 'Fechar' : 'Cancelar'}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || uploadingLogo || uploadingSign}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {novaEmpresaId ? 'Salvar Alterações' :
                            isEditing ? 'Atualizar Dados' : 'Criar Empresa'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};