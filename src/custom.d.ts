import 'react';

// Declara as variáveis CSS customizadas que o Swiper utiliza
// Elas são globais para todos os elementos que aceitam a prop 'style'.
declare module 'react' {
    interface CSSProperties {
        '--swiper-navigation-color'?: string;
        '--swiper-pagination-color'?: string;
        // Adicione outras variáveis do Swiper se precisar, como --swiper-pagination-bullet-inactive-color
    }
}

// Opcional: Se quiser que funcione no componente Box do Material UI também
import '@mui/system';

declare module '@mui/system' {
    interface BoxPropsCSSProperty {
        '--swiper-navigation-color'?: string;
        '--swiper-pagination-color'?: string;
    }
}