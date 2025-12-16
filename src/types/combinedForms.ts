// src/types/combinedForms.ts (Exemplo)

import { EmpresaFormInputs } from './empresa'; // Tipagem da Empresa

// 1. Campos de Usuário necessários para o registro
export interface UserMasterFormInputs {
    email: string;
    senha: string;
    nomeCompleto: string;
}

// 2. Tipagem completa para o formulário de Registro Master
// Note que 'ativa' está em EmpresaFormInputs, mas é mantido aqui
export interface EmpresaRegistroMasterFormInputs extends EmpresaFormInputs, UserMasterFormInputs { }

// 3. Payload de envio para o Backend (Rota pública /auth/register-master)
export interface RegistroMasterPayload extends EmpresaRegistroMasterFormInputs { }