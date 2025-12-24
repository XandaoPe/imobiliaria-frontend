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
import { ImovelPhotosStep } from './steps/ImovelPhotosStep';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ImovelFormModalProps {
    open: boolean;
    onClose: () => void;
    imovelToEdit?: Imovel | null;
    onSuccess: () => void;
}

const steps = ['Dados Principais', 'Detalhes', 'Fotos (Opcional)'];

type ImovelState = Imovel | null;

const ImovelFormModal: React.FC<ImovelFormModalProps> = ({ open, onClose, imovelToEdit, onSuccess }) => {
    const isEdit = !!imovelToEdit;
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const [currentImovel, setCurrentImovel] = useState<ImovelState>(imovelToEdit || null);
    const [currentPhotos, setCurrentPhotos] = useState<string[]>(imovelToEdit?.fotos || []);

    // Valores padrão completos para o formulário
    const defaultValues: ImovelFormData = {
        titulo: '',
        tipo: 'CASA',
        endereco: '',
        disponivel: true,
        para_venda: false,
        para_aluguel: false,
        valor_venda: null,
        valor_aluguel: null,
        cidade: '',
        descricao: null,
        detalhes: null,
        quartos: null,
        banheiros: null,
        area_terreno: null,
        area_construida: null,
        garagem: false,
    };

    // ⭐️ CORRIGIDO: Especifica o tipo genérico corretamente
    const {
        handleSubmit, control, reset,
        formState: { errors }, trigger, getValues,
    } = useForm<ImovelFormData>({
        resolver: yupResolver(imovelValidationSchema) as any, // ⭐️ CAST para any para evitar erro de tipos
        defaultValues,
        mode: 'onBlur',
    });

    useEffect(() => {
        if (open) {
            if (isEdit && imovelToEdit) {
                reset({
                    titulo: imovelToEdit.titulo || '',
                    tipo: normalizeTipoImovel(imovelToEdit.tipo || 'CASA'),
                    endereco: imovelToEdit.endereco || '',
                    para_venda: imovelToEdit.para_venda || false,
                    para_aluguel: imovelToEdit.para_aluguel || false,
                    valor_venda: imovelToEdit.valor_venda || null,
                    valor_aluguel: imovelToEdit.valor_aluguel || null,
                    disponivel: imovelToEdit.disponivel ?? true,
                    cidade: imovelToEdit.cidade || '',
                    descricao: imovelToEdit.descricao ?? null,
                    detalhes: imovelToEdit.detalhes ?? null,
                    quartos: imovelToEdit.quartos ?? null,
                    banheiros: imovelToEdit.banheiros ?? null,
                    area_terreno: imovelToEdit.area_terreno ?? null,
                    area_construida: imovelToEdit.area_construida ?? null,
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

    const handleNext = async () => {
        let fieldsToValidate: (keyof ImovelFormData)[] = [];

        if (activeStep === 0) {
            fieldsToValidate = ['titulo', 'tipo', 'endereco', 'disponivel', 'cidade'];

            // Validação condicional
            const formValues = getValues();
            if (formValues.para_venda) {
                fieldsToValidate.push('valor_venda');
            }
            if (formValues.para_aluguel) {
                fieldsToValidate.push('valor_aluguel');
            }
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

    const onDataSubmit: SubmitHandler<ImovelFormData> = async (data) => {

        console.log("🚀 SUBMIT INICIADO - Verificando dados e erros:");
        console.log("📊 Dados do formulário:", data);
        console.log("❌ Erros de validação:", errors);
        console.log("📍 Passo atual:", activeStep);

        setLoading(true);
        setError(null);

        try {
            // ⭐️ Tratamento manual para garantir Tipagem Correta
            const payload = {
                ...data,
                valor_venda: data.valor_venda ? Number(data.valor_venda) : null,
                valor_aluguel: data.valor_aluguel ? Number(data.valor_aluguel) : null,
                quartos: data.quartos ? Number(data.quartos) : null,
                banheiros: data.banheiros ? Number(data.banheiros) : null,
                area_terreno: data.area_terreno ? Number(data.area_terreno) : null,
                area_construida: data.area_construida ? Number(data.area_construida) : null,
                garagem: !!data.garagem,
                disponivel: !!data.disponivel,
                para_venda: !!data.para_venda,
                para_aluguel: !!data.para_aluguel,
            };

            console.log("Payload Final enviado ao Axios:", payload);

            let response;
            if (isEdit && currentImovel?._id) {
                response = await api.put(`/imoveis/${currentImovel._id}`, payload);
            } else {
                response = await api.post(`/imoveis`, payload);
            }

            const imovelResult = response.data;
            console.log("Resposta do Servidor:", imovelResult);

            setCurrentImovel(imovelResult);
            setCurrentPhotos(imovelResult.fotos || []);

            // Sincroniza o formulário com o banco
            reset({
                ...imovelResult,
                tipo: normalizeTipoImovel(imovelResult.tipo)
            });

            setActiveStep((prev) => prev + 1);
        } catch (err: any) {
            console.error("Erro na requisição:", err.response?.data);
            setError(err.response?.data?.message || "Erro ao salvar");
        } finally {
            setLoading(false);
        }
    };

    const getStepContent = (step: number) => {
        switch (step) {
            case 0:
                return <DadosPrincipaisStep control={control} errors={errors} />;
            case 1:
                return <DetalhesStep control={control} errors={errors} />;
            case 2:
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

            <Box component="form" noValidate>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {getStepContent(activeStep)}
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>

                    {activeStep > 0 && activeStep < steps.length - 1 && (
                        <Button onClick={handleBack} disabled={loading}>
                            Voltar
                        </Button>
                    )}

                    {activeStep === 0 && (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={loading}
                            type="button"
                        >
                            Próximo
                        </Button>
                    )}

                    {activeStep === steps.length - 2 && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                console.log("🔘 Botão clicado!");

                                // ⭐️ SOLUÇÃO CORRETA: Use desta forma
                                handleSubmit(async (data) => {
                                    console.log("✅ Validação passou, dados:", data);

                                    setLoading(true);
                                    setError(null);

                                    try {
                                        // ⭐️ Tratamento manual para garantir Tipagem Correta
                                        const payload = {
                                            ...data,
                                            valor_venda: data.valor_venda ? Number(data.valor_venda) : null,
                                            valor_aluguel: data.valor_aluguel ? Number(data.valor_aluguel) : null,
                                            quartos: data.quartos ? Number(data.quartos) : null,
                                            banheiros: data.banheiros ? Number(data.banheiros) : null,
                                            area_terreno: data.area_terreno ? Number(data.area_terreno) : null,
                                            area_construida: data.area_construida ? Number(data.area_construida) : null,
                                            garagem: !!data.garagem,
                                            disponivel: !!data.disponivel,
                                            para_venda: !!data.para_venda,
                                            para_aluguel: !!data.para_aluguel,
                                        };

                                        console.log("📤 Payload enviado ao Axios:", payload);

                                        let response;
                                        if (isEdit && currentImovel?._id) {
                                            response = await api.put(`/imoveis/${currentImovel._id}`, payload);
                                        } else {
                                            response = await api.post(`/imoveis`, payload);
                                        }

                                        const imovelResult = response.data;
                                        console.log("📥 Resposta do Servidor:", imovelResult);

                                        setCurrentImovel(imovelResult);
                                        setCurrentPhotos(imovelResult.fotos || []);

                                        // Sincroniza o formulário com o banco
                                        reset({
                                            ...imovelResult,
                                            tipo: normalizeTipoImovel(imovelResult.tipo)
                                        });

                                        // ⭐️ AVANÇA PARA O PRÓXIMO PASSO
                                        setActiveStep((prev) => prev + 1);
                                    } catch (err: any) {
                                        console.error("❌ Erro na requisição:", err.response?.data);
                                        setError(err.response?.data?.message || "Erro ao salvar");
                                    } finally {
                                        setLoading(false);
                                    }
                                })();
                            }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : (isEdit ? 'Salvar Dados e Ir para Fotos' : 'Criar Imóvel e Ir para Fotos')}
                        </Button>
                    )}

                    {activeStep === steps.length - 1 && (
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