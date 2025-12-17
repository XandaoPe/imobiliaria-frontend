import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack } from '@mui/material';

interface ModalInteresseProps {
    open: boolean;
    onClose: () => void;
    imovelTitulo: string;
    empresaId: string; // Para saber quem recebe o lead
}

export const ModalInteresse = ({ open, onClose, imovelTitulo, empresaId }: ModalInteresseProps) => {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');

    const handleEnviar = () => {
        console.log(`Lead para empresa ${empresaId}: ${nome} tem interesse no ${imovelTitulo}`);
        // Aqui faremos o POST para sua futura tabela de 'Leads' ou 'Mensagens'
        alert('Mensagem enviada com sucesso! A imobiliária entrará em contato.');
        onClose();
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
                    <TextField label="Seu Nome" fullWidth value={nome} onChange={(e) => setNome(e.target.value)} />
                    <TextField label="WhatsApp/Telefone" fullWidth value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                    <Button variant="contained" fullWidth onClick={handleEnviar}>Enviar Contato</Button>
                </Stack>
            </Box>
        </Modal>
    );
};