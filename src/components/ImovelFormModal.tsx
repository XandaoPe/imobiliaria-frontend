// src/components/ImovelFormModal.tsx
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Alert, CircularProgress, Box, Stepper, Step, StepLabel,
} from '@mui/material';
import { Imovel, ImovelFormData, imovelValidationSchema, normalizeTipoImovel } from '../types/imovel';
import { DadosPrincipaisStep } from './steps/DadosPrincipaisStep';
import { DetalhesStep } from './steps/DetalhesStep';
import axios from 'axios';

interface ImovelFormModalProps {
    open: boolean;
    onClose: () => void;
    imovelToEdit?: Imovel | null;
    onSuccess: () => void;
}

const API_URL = 'http://localhost:5000/imoveis';
const steps = ['Dados Principais', 'Detalhes do Imóvel'];

const ImovelFormModal: React.FC<ImovelFormModalProps> = ({ open, onClose, imovelToEdit, onSuccess }) => {
    const isEdit = !!imovelToEdit;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    // Valores padrão completos para o formulário
    const defaultValues: ImovelFormData = {
        titulo: '',
        tipo: 'CASA',
        endereco: '',
        valor: 0,
        disponivel: true,
        cidade: '',
        descricao: null,
        detalhes: null,
        quartos: null,
        banheiros: null,
        garagem: false,
    };

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
        trigger,
    } = useForm<ImovelFormData>({
        resolver: yupResolver(imovelValidationSchema),
        defaultValues,
        mode: 'onBlur',
    });

    useEffect(() => {
        if (isEdit && imovelToEdit) {
            // Inicializa o formulário com dados do imóvel
            reset({
                titulo: imovelToEdit.titulo || '',
                tipo: normalizeTipoImovel(imovelToEdit.tipo || 'CASA'),
                endereco: imovelToEdit.endereco || '',
                valor: imovelToEdit.valor || 0,
                disponivel: imovelToEdit.disponivel ?? true,
                cidade: imovelToEdit.cidade || '',
                descricao: imovelToEdit.descricao || null,
                detalhes: imovelToEdit.detalhes || null,
                quartos: imovelToEdit.quartos || null,
                banheiros: imovelToEdit.banheiros || null,
                garagem: imovelToEdit.garagem ?? false,
            });
        } else {
            reset(defaultValues);
        }
        setError(null);
        setActiveStep(0);
    }, [isEdit, imovelToEdit, reset]);

    // Função que valida o passo atual antes de avançar
    const handleNext = async () => {
        let fieldsToValidate: (keyof ImovelFormData)[] = [];

        if (activeStep === 0) {
            // Valida apenas os campos obrigatórios para avançar para o Passo 1
            fieldsToValidate = ['titulo', 'tipo', 'endereco', 'valor', 'disponivel', 'cidade'];
            // Incluí 'cidade' aqui, pois está no Passo 0 e é bom validá-lo.
        }
        // Não precisamos de um bloco 'else if (activeStep === 1)'
        // A validação final antes do submit ocorrerá no 'handleSubmit'.

        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else {
            // Opcional: Se a validação falhar, você pode resetar o erro para null
            setError(null);
            console.error("Validação do passo falhou. Fique no passo atual.");
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const onSubmit: SubmitHandler<ImovelFormData> = async (data) => {
        setLoading(true);
        setError(null);

        try {
            // Enviando o objeto de dados completo (já corrigido em passos anteriores)
            const dadosEnviar = data;

            if (isEdit && imovelToEdit) {
                await axios.put(`${API_URL}/${imovelToEdit._id}`, dadosEnviar);
                console.log('Imóvel atualizado com sucesso:', dadosEnviar);
            } else {
                await axios.post(API_URL, dadosEnviar);
                console.log('Imóvel criado com sucesso:', dadosEnviar);
            }

            onSuccess();
            onClose();

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erro ao salvar imóvel.';
            setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
            console.error('Erro ao salvar imóvel:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    // Função para renderizar o conteúdo do passo atual
    const getStepContent = (step: number) => {
        switch (step) {
            case 0:
                return <DadosPrincipaisStep control={control} errors={errors} />;
            case 1:
                return <DetalhesStep control={control} errors={errors} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{isEdit ? `Editar Imóvel: ${imovelToEdit?.titulo}` : 'Novo Imóvel'}</DialogTitle>

            <Stepper activeStep={activeStep} sx={{ p: 3, pb: 1 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Conteúdo do passo atual */}
                    {getStepContent(activeStep)}

                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>

                    <Button disabled={activeStep === 0} onClick={handleBack}>
                        Voltar
                    </Button>

                    {activeStep === steps.length - 1 ? (
                        <Button type="submit" variant="contained" color="primary" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : (isEdit ? 'Salvar Alterações' : 'Criar Imóvel')}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            // ⭐️ CORREÇÃO CHAVE: Passe o evento de clique para a função
                            onClick={(e) => {
                                e.preventDefault(); // IMPEDE o comportamento padrão de submit
                                e.stopPropagation(); // IMPEDE a propagação para o formulário pai
                                handleNext(); // APENAS avança o passo
                            }}
                            disabled={loading}
                            type="button" // Mantemos o type="button" como boa prática
                        >
                            Próximo
                        </Button>
                    )}

                </DialogActions>
            </Box>
        </Dialog>
    );
};

// ⭐️ Exportação CORRETA do componente
export { ImovelFormModal };