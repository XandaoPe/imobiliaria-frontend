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
// Ele se comporta como um input normal, mas formata o valor.
const NumericFormatCustom = forwardRef<NumericFormatProps, CustomProps>(
    function NumericFormatCustom(props, ref) {
        const { onChange, ...other } = props;

        // A função customizada para lidar com a mudança. 
        // O valor formatado é convertido de volta para um número (sem formatação)
        // antes de chamar o `onChange` do React Hook Form.
        const handleValueChange: NumericFormatProps['onValueChange'] = (values) => {
            // Passa o valor numérico puro (value) para o React Hook Form.
            onChange({
                target: {
                    name: props.name,
                    value: values.floatValue ?? 0, // floatValue é o valor numérico puro
                },
            });
        };

        return (
            <NumericFormat
                {...other}
                getInputRef={ref}
                onValueChange={handleValueChange}
                thousandSeparator="." // Separador de milhar (padrão Brasil)
                decimalSeparator="," // Separador decimal (padrão Brasil)
                prefix="R$ " // Prefixo de moeda
                decimalScale={2} // Duas casas decimais
                fixedDecimalScale // Fixa as casas decimais (ex: 100,00)
            />
        );
    },
);

// Componente principal para usar no formulário
interface CurrencyFormatInputProps {
    name: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    error?: boolean;
    helperText?: React.ReactNode;
}

export const CurrencyFormatInput: React.FC<CurrencyFormatInputProps> = ({
    name,
    label,
    value,
    onChange,
    error,
    helperText
}) => {

    // A propriedade value precisa ser passada como string para o NumericFormat
    // Por isso, convertemos o 'number' que vem do RHF para 'string' para exibição.
    const displayValue = value === 0 ? '' : String(value);

    return (
        <TextField
            label={label}
            fullWidth
            required
            error={error}
            helperText={helperText}
            margin="normal"
            // Aqui passamos o Custom Input
            InputProps={{
                inputComponent: NumericFormatCustom as any,
                // O NumericFormat precisa de uma prop 'value' para controlar a exibição
                inputProps: {
                    name: name,
                    value: displayValue,
                    onChange: (e: any) => onChange(e.target.value),
                }
            }}
            // O valor do TextField é controlado pelo value real (number)
            value={displayValue}
        />
    );
};