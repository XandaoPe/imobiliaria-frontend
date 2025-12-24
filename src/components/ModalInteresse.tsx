import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, CircularProgress } from '@mui/material';
import api from '../services/api'; // Certifique-se de que o caminho está correto

interface ModalInteresseProps {
    open: boolean;
    onClose: () => void;
    imovelTitulo: string;
    imovelId: string;   // ⭐️ Adicionado ID do Imóvel
    empresaId: string;  // ID da Empresa
}

export const ModalInteresse = ({ open, onClose, imovelTitulo, imovelId, empresaId }: ModalInteresseProps) => {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEnviar = async () => {
        if (!nome || !telefone) {
            alert('Por favor, preencha seu nome e telefone.');
            return;
        }

        setLoading(true);
        try {
            // Montando o payload EXATAMENTE como o CreateLeadDto e o LeadSchema esperam
            const payload = {
                nome: nome,
                contato: telefone, // O backend mapeia 'contato', você usa o campo telefone
                imovel: imovelId,
                empresa: empresaId
            };

            await api.post('/leads/publico', payload);

            alert('Mensagem enviada com sucesso! A imobiliária entrará em contato.');
            setNome('');
            setTelefone('');
            onClose();
        } catch (error) {
            console.error('Erro ao enviar lead:', error);
            alert('Erro ao enviar mensagem. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2
            }}>
                <Typography variant="h6" gutterBottom>Tenho Interesse</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Deixe seus dados para saber mais sobre: <strong>{imovelTitulo}</strong>
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="Seu Nome"
                        fullWidth
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        label="WhatsApp/Telefone"
                        fullWidth
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        disabled={loading}
                    />
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleEnviar}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Contato'}
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};