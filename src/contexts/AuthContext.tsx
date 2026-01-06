import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { UsuarioLogado, PerfisEnum } from '../types/usuario';
import { limparTokenFirebase } from '../services/firebaseConfig';
import api from '../services/api';

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

    const [user, setUser] = useState<UsuarioLogado | null>(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('usuarioLogado');

        // Se tem um usuário mas NÃO tem token, os dados estão sujos. Limpa tudo.
        if (!storedToken || !storedUser) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuarioLogado');
            return null;
        }

        try {
            const parsedUser = JSON.parse(storedUser) as UsuarioLogado;
            // Verifica se o token no usuário é o mesmo do localStorage
            if (parsedUser.token !== storedToken) return null;
            return parsedUser;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {

        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('usuarioLogado');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                if (parsedUser.token !== storedToken) {
                    console.warn('⚠️ Token não coincide! Limpando...');
                    logout();
                    return;
                }

                setUser(parsedUser);
            } catch (e) {
                console.error('❌ Erro ao parsear usuário:', e);
                logout();
            }
        } else {
        }
    }, []);

    useEffect(() => {
        const interceptor = api.interceptors.response.use( // MUDOU AQUI (de axios para api)
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    console.warn("Sessão expirada. Redirecionando...");
                    logout(); // Isso limpa o estado e te joga para a vitrine
                }
                return Promise.reject(error);
            }
        );

        return () => api.interceptors.response.eject(interceptor);
    }, []);

    useEffect(() => {
        if (token) {
            const payloadDecoded = decodeToken(token);
            if (payloadDecoded && payloadDecoded.sub) {
                const usuarioLogado: UsuarioLogado = {
                    id: payloadDecoded.sub,
                    nome: payloadDecoded.nome,
                    email: payloadDecoded.email,
                    perfil: payloadDecoded.perfil,
                    ativo: true,
                    token: token,
                    empresa: payloadDecoded.empresaId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                setUser(usuarioLogado);
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

            } else {
                logout();
            }
        }
    }, [token]);

    // Função chamada após a autenticação bem-sucedida (da LoginPage)
    const login = (jwtToken: string) => {

        // Apenas salva o token, o useEffect fará a decodificação e o setUser
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);

        const payloadDecoded = decodeToken(jwtToken);
        if (payloadDecoded) {
        }
    };

    const logout = () => {
        // ⭐️ NOVO: Limpa o token Firebase antes de fazer logout
        limparTokenFirebase().catch(err => {
            console.warn('Erro ao limpar token Firebase:', err);
        });

        localStorage.removeItem('token');
        localStorage.removeItem('usuarioLogado');
        setToken(null);
        setUser(null);

        // Redireciona para a página inicial
        window.location.href = '/';
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