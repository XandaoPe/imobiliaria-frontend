// src/components/steps/DadosPrincipaisStep.tsx
import React from 'react';
import { Controller, Control, FieldErrors, useWatch } from 'react-hook-form';
import {
    TextField,
    MenuItem,
    Box,
    FormControl,
    InputLabel,
    Select,
    Switch,
    FormControlLabel,
    Typography,
    Checkbox,
} from '@mui/material';
import { ImovelFormData } from '../../types/imovel';
import { CurrencyFormatInput } from '../CurrencyFormatInput';

interface DadosPrincipaisStepProps {
    control: Control<ImovelFormData>;
    errors: FieldErrors<ImovelFormData>;
}

export const DadosPrincipaisStep: React.FC<DadosPrincipaisStepProps> = ({ control, errors }) => {
    const paraVenda = useWatch({ control, name: 'para_venda' });
    const paraAluguel = useWatch({ control, name: 'para_aluguel' });

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
            {/* Título */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Controller
                    name="titulo"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Título do Imóvel"
                            fullWidth
                            required
                            error={!!errors.titulo}
                            helperText={errors.titulo?.message}
                            margin="normal"
                        />
                    )}
                />
            </Box>

            {/* Tipo */}
            <Box>
                <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth margin="normal" required error={!!errors.tipo}>
                            <InputLabel id="tipo-label">Tipo do Imóvel</InputLabel>
                            <Select
                                {...field}
                                labelId="tipo-label"
                                label="Tipo do Imóvel"
                            >
                                <MenuItem value="CASA">Casa</MenuItem>
                                <MenuItem value="APARTAMENTO">Apartamento</MenuItem>
                                <MenuItem value="TERRENO">Terreno</MenuItem>
                                <MenuItem value="COMERCIAL">Comercial</MenuItem>
                            </Select>
                            {errors.tipo && (
                                <Typography color="error" variant="caption">
                                    {errors.tipo.message}
                                </Typography>
                            )}
                        </FormControl>
                    )}
                />
            </Box>

            {/* Cidade */}
            <Box>
                <Controller
                    name="cidade"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Cidade"
                            fullWidth
                            margin="normal"
                            value={field.value || ''}
                        />
                    )}
                />
            </Box>

            {/* Checkboxes para Venda e Aluguel */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Box sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                    backgroundColor: '#f9f9f9'
                }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Finalidade do Imóvel
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Controller
                            name="para_venda"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={field.value}
                                            onChange={field.onChange}
                                            color="primary"
                                        />
                                    }
                                    label="Para Venda"
                                />
                            )}
                        />

                        <Controller
                            name="para_aluguel"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={field.value}
                                            onChange={field.onChange}
                                            color="primary"
                                        />
                                    }
                                    label="Para Aluguel"
                                />
                            )}
                        />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        * Marque uma ou ambas as opções conforme a finalidade do imóvel
                    </Typography>
                </Box>
            </Box>

            {/* Valor Venda (condicional) */}
            <Box>
                {paraVenda && (
                    <Controller
                        name="valor_venda"
                        control={control}
                        render={({ field }) => (
                            <CurrencyFormatInput
                                name={field.name}
                                label="Valor da Venda (R$)"
                                value={field.value}
                                onChange={field.onChange}
                                error={!!errors.valor_venda}
                                helperText={errors.valor_venda?.message}
                                required={paraVenda}
                            />
                        )}
                    />
                )}
            </Box>

            {/* Valor Aluguel (condicional) */}
            <Box>
                {paraAluguel && (
                    <Controller
                        name="valor_aluguel"
                        control={control}
                        render={({ field }) => (
                            <CurrencyFormatInput
                                name={field.name}
                                label="Valor do Aluguel (R$)"
                                value={field.value}
                                onChange={field.onChange}
                                error={!!errors.valor_aluguel}
                                helperText={errors.valor_aluguel?.message}
                                required={paraAluguel}
                            />
                        )}
                    />
                )}
            </Box>

            {/* Endereço */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Controller
                    name="endereco"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Endereço Completo"
                            fullWidth
                            required
                            error={!!errors.endereco}
                            helperText={errors.endereco?.message}
                            margin="normal"
                            multiline
                            rows={2}
                        />
                    )}
                />
            </Box>

            {/* Disponibilidade */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Controller
                    name="disponivel"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value}
                                    onChange={field.onChange}
                                    color="primary"
                                />
                            }
                            label={field.value ? "Disponível" : "Indisponível"}
                        />
                    )}
                />
            </Box>
        </Box>
    );
};