import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { UsuarioLogado, PerfisEnum } from '../types/usuario';

// 1. Interface para o Payload do JWT (Como ele vem decodificado)
// Note que as chaves são as do JWT (sub, empresaId)
interface JWTPayload {
    sub: string; // Mapeado para _id
    nome: string;
    email: string;
    perfil: PerfisEnum;
    empresaId: string; // Mapeado para empresaId (como propriedade do UsuarioLogado)
    iat: number;
    exp: number;
}


// 2. Interface para o Contexto
interface AuthContextType {
    user: UsuarioLogado | null;
    isAuthenticated: boolean;
    // A função login agora recebe apenas o JWT token em string
    login: (jwtToken: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Função Auxiliar para Decodificar o Token JWT (mantida)
const decodeToken = (token: string): JWTPayload | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
        return JSON.parse(jsonPayload) as JWTPayload;
    } catch (e) {
        console.error('Erro ao decodificar token:', e);
        return null;
    }
};

// 4. Provedor de Autenticação
export const AuthProvider = ({ children }: { children: ReactNode }) => {

    // Mantemos o token em um estado interno para facilitar o useEffect
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    // ⭐️ CORREÇÃO 1: Tipagem do user no useState.
    const [user, setUser] = useState<UsuarioLogado | null>(() => {
        const storedUser = localStorage.getItem('usuarioLogado');
        if (storedUser) {
            try {
                // Ao recuperar do localStorage, o objeto deve ser do tipo UsuarioLogado
                return JSON.parse(storedUser) as UsuarioLogado;
            } catch (e) {
                console.error("Erro ao parsear usuário do localStorage", e);
                return null;
            }
        }
        return null;
    });

    useEffect(() => {
        if (token) {
            const payloadDecoded = decodeToken(token);

            if (payloadDecoded && payloadDecoded.sub) {

                // ⭐️ CORREÇÃO 2: Criar o objeto UsuarioLogado COMPLETO
                // O objeto UsuarioLogado precisa de todas as propriedades da interface Usuario
                // (_id, nome, email, perfil, ativo, createdAt, updatedAt) + token.
                // Como o JWT só tem um subconjunto, precisamos adicionar as propriedades faltantes (ou default)
                // e o token para satisfazer a interface.

                const usuarioLogado: UsuarioLogado = {
                    // Mapeamento das propriedades do JWT para a interface UsuarioLogado (que herda de Usuario)
                    _id: payloadDecoded.sub, // Mapeia 'sub' para '_id'
                    nome: payloadDecoded.nome,
                    email: payloadDecoded.email,
                    perfil: payloadDecoded.perfil,

                    // Propriedades que não vêm do JWT, mas são obrigatórias em Usuario/UsuarioLogado:
                    ativo: true, // Assumimos que está ativo se logou
                    createdAt: new Date().toISOString(), // Usar um valor default/placeholder, idealmente, você teria essa info no payload
                    updatedAt: new Date().toISOString(), // Usar um valor default/placeholder

                    // Propriedade token para satisfazer UsuarioLogado
                    token: token,
                };

                setUser(usuarioLogado);
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

                // Configura o cabeçalho padrão do Axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                logout();
            }
        } else {
            // Limpa o cabeçalho se não houver token
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Função chamada após a autenticação bem-sucedida (da LoginPage)
    const login = (jwtToken: string) => {
        // Apenas salva o token, o useEffect fará a decodificação e o setUser
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioLogado'); // Limpar o objeto de usuário também
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token && !!user;

    return (
        // ⭐️ CORREÇÃO 3: Remover 'token' da prop value (ele está implícito em user.token)
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 5. Hook Customizado para usar o Contexto (mantido)
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};