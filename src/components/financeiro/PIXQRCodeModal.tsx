// src/components/financeiro/PIXQRCodeModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, IconButton,
    Chip, Alert, Stack, Paper, CircularProgress,
    Tab, Tabs
} from '@mui/material';
import { QrCode2, ContentCopy, Download, CheckCircle, Close } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react'; // ✅ Use QRCodeSVG ao invés de QRCode
import { Transacao } from '../../types/financeiro';
import api from '../../services/api';

interface PIXQRCodeModalProps {
    open: boolean;
    onClose: () => void;
    transacao: Transacao | null;
}

interface PIXData {
    transacaoId: string;
    lancamentoId: string;
    qrCodeBase64: string;
    codigoPix: string;
    valor: number;
    destinatario: string;
    descricao: string;
    dataExpiracao: string;
    dataCriacao: string;
    status: string;
}

export const PIXQRCodeModal: React.FC<PIXQRCodeModalProps> = ({
    open, onClose, transacao
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pixData, setPixData] = useState<PIXData | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open && transacao) {
            gerarQRCode();
        } else {
            resetState();
        }
    }, [open, transacao]);

    const resetState = () => {
        setPixData(null);
        setError(null);
        setCopied(false);
        setTabValue(0);
    };

    const gerarQRCode = async () => {
        if (!transacao) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/pix/gerar-qrcode', {
                lancamentoId: transacao._id,
                descricaoPersonalizada: `PIX ${transacao.descricao} - ${transacao.negociacaoCodigo || ''}`,
                valorPersonalizado: transacao.valor
            });

            setPixData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao gerar QR Code PIX');
            console.error('Erro ao gerar PIX:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!pixData?.codigoPix) return;

        try {
            await navigator.clipboard.writeText(pixData.codigoPix);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    const handleDownloadQRCode = () => {
        if (!pixData?.qrCodeBase64) return;

        const link = document.createElement('a');
        link.href = pixData.qrCodeBase64;
        link.download = `pix-${transacao?._id || 'qr'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAGO': return 'success';
            case 'GERADO': return 'primary';
            case 'PENDENTE': return 'warning';
            case 'EXPIRADO': return 'error';
            case 'CANCELADO': return 'default';
            default: return 'default';
        }
    };

    if (!transacao) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <QrCode2 sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">
                        QR Code PIX
                    </Typography>
                    {pixData && (
                        <Chip
                            label={pixData.status}
                            size="small"
                            color={getStatusColor(pixData.status) as any}
                        />
                    )}
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Gerando QR Code PIX...</Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                ) : pixData ? (
                    <Stack spacing={3}>
                        {/* Informações da Transação */}
                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Lançamento
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {formatCurrency(pixData.valor)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {pixData.descricao}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Destinatário
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {pixData.destinatario}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* Tabs */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                                <Tab label="QR Code" />
                                <Tab label="Código PIX" />
                                <Tab label="Informações" />
                            </Tabs>
                        </Box>

                        {/* Conteúdo das Tabs */}
                        {tabValue === 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Escaneie para pagar
                                </Typography>

                                <Paper
                                    elevation={3}
                                    sx={{
                                        p: 3,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        border: '2px solid',
                                        borderColor: 'divider',
                                        mb: 2
                                    }}
                                >
                                    {pixData.qrCodeBase64 ? (
                                        <img
                                            src={pixData.qrCodeBase64}
                                            alt="QR Code PIX"
                                            style={{ width: '250px', height: '250px' }}
                                        />
                                    ) : (
                                        <QRCodeSVG
                                            value={pixData.codigoPix}
                                            size={250}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    )}
                                </Paper>

                                <Typography variant="caption" color="text.secondary" align="center">
                                    Abra o app do seu banco e escaneie o código
                                </Typography>
                            </Box>
                        )}

                        {tabValue === 1 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Código PIX Copia e Cola
                                </Typography>
                                <TextField
                                    value={pixData.codigoPix}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    InputProps={{
                                        readOnly: true,
                                        sx: {
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            bgcolor: 'background.default'
                                        }
                                    }}
                                    sx={{ mb: 2 }}
                                />
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="contained"
                                        startIcon={<ContentCopy />}
                                        onClick={handleCopyCode}
                                        color={copied ? "success" : "primary"}
                                    >
                                        {copied ? 'Copiado!' : 'Copiar Código'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Download />}
                                        onClick={handleDownloadQRCode}
                                    >
                                        Baixar QR Code
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        {tabValue === 2 && (
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        ID da Transação
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {pixData.transacaoId}
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={4}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Data de Criação
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(pixData.dataCriacao)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Expira em
                                        </Typography>
                                        <Typography variant="body1" color={
                                            new Date(pixData.dataExpiracao) < new Date()
                                                ? 'error.main'
                                                : 'text.primary'
                                        }>
                                            {formatDate(pixData.dataExpiracao)}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Alert severity="info">
                                    <Typography variant="body2">
                                        <strong>Instruções:</strong>
                                        <br />• Escaneie o QR Code com seu app bancário
                                        <br />• Ou copie o código PIX e cole no app
                                        <br />• O pagamento será confirmado automaticamente
                                    </Typography>
                                </Alert>
                            </Stack>
                        )}
                    </Stack>
                ) : null}
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} color="secondary">
                    Fechar
                </Button>
                {pixData && pixData.status === 'GERADO' && (
                    <Button
                        variant="contained"
                        onClick={gerarQRCode}
                        startIcon={<QrCode2 />}
                    >
                        Gerar Novo
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};