// src/components/steps/DadosPrincipaisStep.tsx
import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
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
} from '@mui/material';
import { ImovelFormData } from '../../types/imovel';
// ⭐️ Importar o novo componente de máscara
import { CurrencyFormatInput } from '../CurrencyFormatInput';

interface DadosPrincipaisStepProps {
    control: Control<ImovelFormData>;
    errors: FieldErrors<ImovelFormData>;
}

export const DadosPrincipaisStep: React.FC<DadosPrincipaisStepProps> = ({ control, errors }) => {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
            {/* Título (inalterado) */}
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

            {/* Tipo (inalterado) */}
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

            {/* ⭐️ Valor (CAMPO ATUALIZADO COM MÁSCARA) */}
            <Box>
                <Controller
                    name="valor"
                    control={control}
                    render={({ field }) => (
                        <CurrencyFormatInput
                            name={field.name}
                            label="Valor (R$)"
                            value={field.value} // RHF passa o valor numérico
                            onChange={field.onChange} // RHF recebe o valor numérico de volta
                            error={!!errors.valor}
                            helperText={errors.valor?.message}
                        />
                    )}
                />
            </Box>

            {/* Endereço (inalterado) */}
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

            {/* Cidade (inalterado) */}
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

            {/* Disponibilidade (inalterado) */}
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