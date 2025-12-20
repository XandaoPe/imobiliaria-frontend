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
// ⭐️ NOVO IMPORT: Passo de fotos
import { ImovelPhotosStep } from './steps/ImovelPhotosStep';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ImovelFormModalProps {
    open: boolean;
    onClose: () => void;
    // ⭐️ ATUALIZADO: Usamos 'imovelToEdit' para ter o ID
    imovelToEdit?: Imovel | null;
    onSuccess: () => void;
}

const API_URL = 'http://192.168.1.5:5000/imoveis';
const steps = ['Dados Principais', 'Detalhes', 'Fotos (Opcional)']; // ⭐️ NOVO PASSO

// Usamos um state local para o imóvel, pois ele pode ser criado no meio do processo
type ImovelState = Imovel | null;

const ImovelFormModal: React.FC<ImovelFormModalProps> = ({ open, onClose, imovelToEdit, onSuccess }) => {
    const isEdit = !!imovelToEdit;
    const { user } = useAuth(); // Usado para o componente de fotos

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    // ⭐️ NOVO ESTADO: O imóvel que está sendo editado/criado
    const [currentImovel, setCurrentImovel] = useState<ImovelState>(imovelToEdit || null);

    // ⭐️ O ESTADO DE FOTOS SÓ É NECESSÁRIO NO FLUXO DE CRIAÇÃO, POIS ELE TEM QUE SER RECARREGADO
    // Mas vamos mantê-lo para consistência na edição também.
    const [currentPhotos, setCurrentPhotos] = useState<string[]>(imovelToEdit?.fotos || []);

    // Valores padrão completos para o formulário
    const defaultValues: ImovelFormData = {
        titulo: '', tipo: 'CASA', endereco: '', valor: 0, disponivel: true,
        cidade: '', descricao: null, detalhes: null, quartos: null, banheiros: null, area_terreno: null, area_construida:null, garagem: false,
    };

    const {
        handleSubmit, control, reset,
        formState: { errors }, trigger, getValues,
    } = useForm<ImovelFormData>({
        resolver: yupResolver(imovelValidationSchema),
        defaultValues,
        mode: 'onBlur',
    });

    useEffect(() => {
        if (open) {
            // Inicialização
            if (isEdit && imovelToEdit) {
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
                    area_terreno: imovelToEdit.area_terreno || null,
                    area_construida: imovelToEdit.area_construida || null,
                    garagem: imovelToEdit.garagem ?? false,
                });
                setCurrentImovel(imovelToEdit);
                setCurrentPhotos(imovelToEdit.fotos || []);

            } else {
                reset(defaultValues);
                setCurrentImovel(null);
                setCurrentPhotos([]);
            }
            setError(null);
            setActiveStep(0);
        }
    }, [open, isEdit, imovelToEdit, reset]);


    // Lógica para avançar para o PRÓXIMO passo (Passo 0 -> Passo 1)
    const handleNext = async () => {
        let fieldsToValidate: (keyof ImovelFormData)[] = [];

        if (activeStep === 0) {
            // Valida os campos do Passo 1
            fieldsToValidate = ['titulo', 'tipo', 'endereco', 'valor', 'disponivel', 'cidade'];
        }

        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else {
            setError(null);
            console.error("Validação do passo falhou.");
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    // Lógica principal: Submete os dados para o backend.
    const onDataSubmit: SubmitHandler<ImovelFormData> = async (data) => {
        setLoading(true);
        setError(null);

        try {
            const dadosEnviar = data;
            let response;

            if (isEdit && currentImovel) {
                // FLUXO DE EDIÇÃO: PUT
                response = await axios.put(`${API_URL}/${currentImovel._id}`, dadosEnviar);
            } else {
                // FLUXO DE CRIAÇÃO: POST
                response = await axios.post(API_URL, dadosEnviar);
            }

            const imovelResult = response.data as Imovel;
            setCurrentImovel(imovelResult);
            setCurrentPhotos(imovelResult.fotos || []); // Atualiza as fotos para o componente de fotos

            if (isEdit) {
                // Se é edição, e o usuário está no passo de Dados, avança para Fotos.
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
            } else {
                // Se é criação, avança para Fotos. O ID está em imovelResult._id
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }

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
            case 2:
                // Passa o ID do imóvel e a lista de fotos atuais
                return (
                    <ImovelPhotosStep
                        imovelId={currentImovel?._id}
                        currentPhotos={currentPhotos}
                        onPhotosUpdate={setCurrentPhotos}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{currentImovel?._id ? `Editar Imóvel: ${currentImovel.titulo}` : 'Novo Imóvel'}</DialogTitle>

            <Stepper activeStep={activeStep} sx={{ p: 3, pb: 1 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* O formulário do React Hook Form é o container principal. 
                Usamos handleSubmit(onDataSubmit) apenas quando queremos salvar os dados do formulário. */}
            <Box component="form" noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {getStepContent(activeStep)}

                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>

                    {activeStep > 0 && activeStep < steps.length - 1 && ( // Voltar só aparece nos passos de dados
                        <Button onClick={handleBack} disabled={loading}>
                            Voltar
                        </Button>
                    )}

                    {activeStep === 0 && (
                        // Passo 0: Apenas avança
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={loading}
                            type="button"
                        >
                            Próximo
                        </Button>
                    )}

                    {activeStep === steps.length - 2 && ( // Penúltimo passo (Detalhes)
                        // Botão que SALVA os dados e AVANÇA para o passo de fotos
                        <Button
                            variant="contained"
                            color="primary"
                            // Chama o submit do React Hook Form, que chama onDataSubmit se a validação passar
                            onClick={handleSubmit(onDataSubmit)}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : (isEdit ? 'Salvar Dados e Ir para Fotos' : 'Criar Imóvel e Ir para Fotos')}
                        </Button>
                    )}

                    {activeStep === steps.length - 1 && ( // Último passo (Fotos)
                        // Botão que apenas CONCLUI a modal
                        <Button
                            type="button"
                            onClick={() => {
                                onClose();
                                onSuccess();
                            }}
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            Concluir
                        </Button>
                    )}

                </DialogActions>
            </Box>
        </Dialog>
    );
};

export { ImovelFormModal };