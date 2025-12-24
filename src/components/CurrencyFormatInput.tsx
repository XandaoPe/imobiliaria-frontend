// src/components/CurrencyFormatInput.tsx
import React, { forwardRef } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { TextField } from '@mui/material';

// Define a interface para as propriedades do componente customizado.
interface CustomProps {
    onChange: (event: { target: { name: string; value: number } }) => void;
    name: string;
}

// O componente de formatação que será usado dentro do Controller
const NumericFormatCustom = forwardRef<NumericFormatProps, CustomProps>(
    function NumericFormatCustom(props, ref) {
        const { onChange, ...other } = props;

        const handleValueChange: NumericFormatProps['onValueChange'] = (values) => {
            onChange({
                target: {
                    name: props.name,
                    value: values.floatValue ?? 0,
                },
            });
        };

        return (
            <NumericFormat
                {...other}
                getInputRef={ref}
                onValueChange={handleValueChange}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
            />
        );
    },
);

// ⭐️ ATUALIZE A INTERFACE para incluir 'required' e 'disabled'
interface CurrencyFormatInputProps {
    name: string;
    label: string;
    value: number | null;
    onChange: (value: number | null) => void;
    error?: boolean;
    helperText?: React.ReactNode;
    required?: boolean; // ⭐️ ADICIONE
    disabled?: boolean; // ⭐️ ADICIONE
}

export const CurrencyFormatInput: React.FC<CurrencyFormatInputProps> = ({
    name,
    label,
    value,
    onChange,
    error,
    helperText,
    required = false, // ⭐️ VALOR PADRÃO
    disabled = false, // ⭐️ VALOR PADRÃO
}) => {
    // Converte o valor para string (vazio se for null)
    const displayValue = value === null ? '' : String(value);

    return (
        <TextField
            label={label}
            fullWidth
            required={required} // ⭐️ PASSA A PROP
            error={error}
            helperText={helperText}
            margin="normal"
            disabled={disabled} // ⭐️ PASSA A PROP
            // Aqui passamos o Custom Input
            InputProps={{
                inputComponent: NumericFormatCustom as any,
                inputProps: {
                    name: name,
                    value: displayValue,
                    onChange: (e: any) => {
                        // Converte para número ou null
                        const numValue = e.target.value === '' ? null : Number(e.target.value);
                        onChange(numValue);
                    },
                }
            }}
            value={displayValue}
        />
    );
};