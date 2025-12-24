import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { Imovel } from '../types/imovel';
import axios from 'axios';
import { API_URL } from '../services/api';

interface LeadModalProps {
    open: boolean;
    onClose: () => void;
    imovel: Imovel | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ open, onClose, imovel }) => {
    const [nome, setNome] = useState('');
    const [contato, setContato] = useState('');

    const handleSubmit = async () => {
        // Busca o ID da empresa independentemente de como ele venha (objeto ou string)
        const empresaId = typeof imovel?.empresa === 'object'
            ? (imovel?.empresa as any)._id
            : imovel?.empresa;

        if (!empresaId || !imovel?._id) {
            alert("Erro: Dados de identificação do imóvel ou imobiliária não encontrados.");
            return;
        }

        try {
            await axios.post(`${API_URL}/leads/publico`, {
                nome: nome.trim(),
                contato: contato.trim(),
                imovel: imovel._id, // Envia String
                empresa: empresaId  // Envia String
            });

            alert(`Obrigado, ${nome}! Seus dados foram enviados com sucesso.`);

            // Limpeza e fechamento
            setNome('');
            setContato('');
            onClose();
        } catch (error: any) {
            console.error("DETALHE DO ERRO:", error.response?.data);
            const msg = error.response?.data?.message;
            alert(`Erro: ${Array.isArray(msg) ? msg.join(', ') : msg || 'Erro interno'}`);
        }
    };

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
                    <TextField label="WhatsApp" fullWidth value={contato} onChange={(e) => setContato(e.target.value)} />
                    <Button variant="contained" fullWidth onClick={handleSubmit} disabled={!nome || !contato}>
                        Enviar Contato
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};