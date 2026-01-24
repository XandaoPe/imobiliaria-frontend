import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Divider, Box, Chip, useTheme
} from '@mui/material';
import {
    Person, HomeWork, ReceiptLong,
    AttachMoney, Info
} from '@mui/icons-material';

interface FinanceiroDetalhesModalProps {
    open: boolean;
    onClose: () => void;
    data: any; // Recebe o objeto populado do backend
}

export const FinanceiroDetalhesModal: React.FC<FinanceiroDetalhesModalProps> = ({ open, onClose, data }) => {
    const theme = useTheme();

    if (!data) return null;

    console.log('Dados do Lançamento Financeiro:', data);

    // Componente interno para Seções
    const InfoSection = ({ title, icon, children }: any) => (
        <Box sx={{ mb: 3, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                {icon}
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    {title}
                </Typography>
            </Box>
            <Box sx={{ pl: 4 }}>{children}</Box>
            <Divider sx={{ mt: 2, borderColor: 'divider' }} />
        </Box>
    );

    // Componente interno para Rótulo e Valor
    const LabelValue = ({ label, value, color, bold = false }: any) => (
        <Box sx={{ mb: 1.5 }}>
            <Typography
                variant="caption"
                sx={{
                    color: 'text.secondary',
                    display: 'block',
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: 0.5
                }}
            >
                {label}
            </Typography>
            <Typography
                variant="body2"
                fontWeight={bold ? 700 : 500}
                sx={{ color: color || 'text.primary' }}
            >
                {value || '---'}
            </Typography>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper'
                }
            }}
        >
            <DialogTitle sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2,
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info sx={{ color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText' }} />
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText' }}
                    >
                        Ficha de Lançamento Financeiro
                    </Typography>
                </Box>
                <Chip
                    label={data.status}
                    color={data.status === 'PAGO' ? 'success' : data.status === 'CANCELADO' ? 'error' : 'warning'}
                    sx={{
                        fontWeight: 'bold',
                        px: 1,
                        color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
                    }}
                />
            </DialogTitle>

            <DialogContent dividers sx={{
                p: 3,
                bgcolor: 'background.default'
            }}>
                {/* CONTAINER PRINCIPAL (Substituindo Grid Container) */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 4,
                    mt: 1
                }}>

                    {/* COLUNA 1: ORIGEM E IDENTIFICAÇÃO */}
                    <Box sx={{ flex: 1 }}>
                        <InfoSection title="Origem do Lançamento" icon={<ReceiptLong fontSize="small" />}>
                            <LabelValue
                                label="Código da Negociação"
                                value={data.negociacaoCodigo}
                                bold
                                color="primary.main"
                            />
                            <LabelValue label="Categoria / Finalidade" value={data.categoria} />
                            <LabelValue label="Descrição do Título" value={data.descricao} />
                            {data.parcelaNumero && (
                                <LabelValue
                                    label="Controle de Parcelas"
                                    value={`Parcela nº ${data.parcelaNumero} / ${data.totalParcelas || '---'}`}
                                />
                            )}
                        </InfoSection>

                        <InfoSection title="Dados do Imóvel" icon={<HomeWork fontSize="small" />}>
                            {/* Verificamos se imovel é um objeto e tem propriedades */}
                            {data.imovel && typeof data.imovel === 'object' ? (
                                <Box>
                                    <LabelValue
                                        label="Ref. Imóvel"
                                        value={data.imovel.titulo || 'Sem título'}
                                        bold
                                    />
                                    <LabelValue
                                        label="Endereço"
                                        value={data.imovel.endereco || 'Endereço não informado'}
                                    />
                                    <LabelValue
                                        label="Cidade"
                                        value={data.imovel.cidade || '---'}
                                    />
                                    <LabelValue
                                        label="Proprietário"
                                        value={data.imovel.proprietario?.nome || '---'}
                                    />
                                </Box>
                            ) : (
                                /* Caso o backend envie apenas o ID ou nada */
                                <Typography variant="caption" sx={{ color: 'error.main' }}>
                                    {data.imovel ? `ID do Imóvel: ${data.imovel}` : 'Imóvel não vinculado.'}
                                </Typography>
                            )}
                        </InfoSection>
                    </Box>

                    {/* COLUNA 2: VALORES E PESSOAS */}
                    <Box sx={{ flex: 1 }}>
                        <InfoSection title="Valores e Datas" icon={<AttachMoney fontSize="small" />}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ minWidth: '140px', flex: 1 }}>
                                    <LabelValue
                                        label="Valor Previsto"
                                        value={`R$ ${data.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                        bold
                                    />
                                </Box>
                                <Box sx={{ minWidth: '140px', flex: 1 }}>
                                    <LabelValue
                                        label="Valor Pago"
                                        value={data.valorPago ? `R$ ${data.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}
                                        color="success.main"
                                        bold={!!data.valorPago}
                                    />
                                </Box>
                                <Box sx={{ minWidth: '140px', flex: 1 }}>
                                    <LabelValue
                                        label="Vencimento"
                                        value={new Date(data.dataVencimento).toLocaleDateString('pt-BR')}
                                    />
                                </Box>
                                <Box sx={{ minWidth: '140px', flex: 1 }}>
                                    <LabelValue
                                        label="Data Pagamento"
                                        value={data.dataPagamento ? new Date(data.dataPagamento).toLocaleDateString('pt-BR') : 'Aguardando'}
                                    />
                                </Box>
                            </Box>
                        </InfoSection>

                        <InfoSection title="Cliente / Envolvido" icon={<Person fontSize="small" />}>
                            <LabelValue
                                label="Nome"
                                value={data.cliente?.nome || 'Lançamento Avulso'}
                                bold
                            />
                            <LabelValue
                                label="Telefone"
                                value={data.cliente?.telefone || 'Não informado'}
                                bold
                            />
                            <LabelValue
                                label="Tipo de Lançamento"
                                value={data.tipo}
                                color={data.tipo === 'RECEITA' ? 'success.main' : 'error.main'}
                            />
                        </InfoSection>
                    </Box>
                </Box>

                {/* OBSERVAÇÕES (Ocupa a largura total abaixo das colunas) */}
                <Box sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'warning.dark' : 'warning.light',
                    borderRadius: 1,
                    borderLeft: `5px solid ${theme.palette.warning.main}`,
                    width: '100%'
                }}>
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{ color: theme.palette.mode === 'dark' ? 'warning.contrastText' : 'warning.dark' }}
                    >
                        OBSERVAÇÕES INTERNAS:
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 0.5,
                            whiteSpace: 'pre-line',
                            color: theme.palette.mode === 'dark' ? 'text.primary' : 'inherit'
                        }}
                    >
                        {data.observacoes || 'Nenhuma observação registrada para este lançamento.'}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                gap: 1,
                borderTop: `1px solid ${theme.palette.divider}`
            }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    sx={{
                        color: 'text.secondary',
                        borderColor: 'divider'
                    }}
                >
                    Fechar Ficha
                </Button>
                {data.status === 'PENDENTE' && (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<AttachMoney />}
                    >
                        Registrar Pagamento
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};