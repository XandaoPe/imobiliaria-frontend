import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { Imovel } from '../types/imovel';
import axios from 'axios';

interface LeadModalProps {
    open: boolean;
    onClose: () => void;
    imovel: Imovel | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ open, onClose, imovel }) => {
    const [nome, setNome] = useState('');
    const [contato, setContato] = useState('');

    const handleSubmit = async () => {
        try {
            await axios.post('http://192.168.1.5:5000/leads/publico', {
                nome,
                contato,
                imovel: imovel?._id,
                empresa: imovel?.empresa // Certifique-se que o imovel vem com o ID da empresa
            });

            alert(`Obrigado, ${nome}! Seus dados foram enviados com sucesso.`);
            onClose();
            // Limpar campos
            setNome('');
            setContato('');
        } catch (error) {
            console.error("Erro ao enviar lead", error);
            alert("Ocorreu um erro ao enviar sua mensagem. Tente novamente.");
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: { xs: '90%', sm: 400 }, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2
            }}>
                <Typography variant="h6" gutterBottom>Tenho Interesse</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Você está interessado em: <strong>{imovel?.titulo}</strong>
                </Typography>
                <Stack spacing={2}>
                    <TextField label="Seu Nome" fullWidth value={nome} onChange={(e) => setNome(e.target.value)} />
                    <TextField label="WhatsApp ou E-mail" fullWidth value={contato} onChange={(e) => setContato(e.target.value)} />
                    <Button variant="contained" fullWidth onClick={handleSubmit} disabled={!nome || !contato}>
                        Enviar Contato
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};