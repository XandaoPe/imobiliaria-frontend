import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { Imovel } from '../types/imovel';

interface LeadModalProps {
    open: boolean;
    onClose: () => void;
    imovel: Imovel | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ open, onClose, imovel }) => {
    const [nome, setNome] = useState('');
    const [contato, setContato] = useState('');

    const handleSubmit = () => {
        // Por enquanto, apenas logamos. No futuro, faremos um POST para /leads
        console.log('Interesse registrado:', {
            imovelId: imovel?._id,
            empresaId: imovel?.empresa,
            cliente: nome,
            contato: contato
        });
        alert(`Obrigado, ${nome}! A imobiliária entrará em contato sobre o imóvel: ${imovel?.titulo}`);
        onClose();
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
                    <TextField label="WhatsApp ou E-mail" fullWidth value={contato} onChange={(e) => setContato(e.target.value)} />
                    <Button variant="contained" fullWidth onClick={handleSubmit} disabled={!nome || !contato}>
                        Enviar Contato
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};