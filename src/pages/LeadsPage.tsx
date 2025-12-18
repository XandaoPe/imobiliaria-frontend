import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface Lead {
    _id: string;
    nome: string;
    contato: string;
    imovel: any; // Facilitando para aceitar o objeto do populate
    empresa: any; // ⭐️ Mudando para any para aceitar o objeto populado
    status: 'NOVO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
    createdAt: string;
}

export const LeadsPage: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const { user } = useAuth();

    const fetchLeads = async () => {
        try {
            const response = await axios.get('http://localhost:5000/leads', {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setLeads(response.data);
        } catch (error) {
            console.error("Erro ao buscar leads", error);
        }
    };

    const handleUpdateStatus = async (id: string, novoStatus: string) => {
        try {
            await axios.patch(`http://localhost:5000/leads/${id}/status`,
                { status: novoStatus },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            fetchLeads(); // Recarrega a lista
        } catch (error) {
            console.error("Erro ao atualizar status", error);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NOVO': return 'error';
            case 'EM_ATENDIMENTO': return 'warning';
            case 'CONCLUIDO': return 'success';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Gestão de Leads</Typography>
            <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
                Acompanhe as pessoas interessadas nos seus imóveis.
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Contato</TableCell>
                            <TableCell>Imóvel de Interesse</TableCell>
                            <TableCell>Empresa</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leads.map((lead) => (
                            <TableRow key={lead._id}>
                                <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell><strong>{lead.nome}</strong></TableCell>
                                <TableCell>{lead.contato}</TableCell>

                                {/* Coluna do Imóvel (Já corrigida com typeof) */}
                                <TableCell>
                                    {typeof lead.imovel === 'object' && lead.imovel !== null
                                        ? (lead.imovel as any).titulo
                                        : 'ID: ' + lead.imovel}
                                </TableCell>

                                {/* ⭐️ NOVA COLUNA: Empresa/Responsável */}
                                <TableCell>
                                    {typeof lead.empresa === 'object' && lead.empresa !== null
                                        ? (lead.empresa as any).nome
                                        : 'ID: ' + String(lead.empresa).substring(0, 6)}
                                </TableCell>

                                <TableCell>
                                    <Chip
                                        label={lead.status}
                                        size="small"
                                        color={getStatusColor(lead.status) as any}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Chamar no WhatsApp">
                                        <IconButton color="success" onClick={() => window.open(`https://wa.me/${lead.contato.replace(/\D/g, '')}`)}>
                                            <WhatsAppIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Marcar como Concluído">
                                        <IconButton color="primary" onClick={() => handleUpdateStatus(lead._id, 'CONCLUIDO')}>
                                            <CheckCircleOutlineIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};