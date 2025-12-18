import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Imports da Estrutura e Tematização
import { appTheme } from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';

// Imports das Páginas
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientesPage } from './pages/ClientesPage';
import { ImoveisPage } from './pages/ImoveisPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { EmpresasPage } from './pages/EmpresasPage';
import { LeadsPage } from './pages/LeadsPage';

/**
 * Componente de Rota Protegida
 * Se não houver autenticação, redireciona para a Landing Page (/).
 * Se autenticado, renderiza o MainLayout que contém o Menu e o Topbar.
 */
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Se o usuário tentar acessar qualquer rota interna sem estar logado,
    // ele é enviado para a Landing Page principal.
    return <Navigate to="/" replace />;
  }

  // Se autenticado, renderiza o layout principal com o Outlet para as rotas filhas
  return <MainLayout />;
};

/**
 * Componente de Rota Pública
 * Impede que usuários logados acessem a Landing ou Login desnecessariamente.
 */
const PublicRoute = ({ children }: { children: React.JSX.Element }) => {
  const { isAuthenticated } = useAuth();

  // Se o usuário já está logado e tenta ir para Landing ou Login, manda para Home
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

const HomeRouterWrapper = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    // Se logado, envolve a Home no MainLayout (Menu + Conteúdo)
    return (
      <MainLayout>
        <HomePage />
      </MainLayout>
    );
  }

  // Se visitante, renderiza apenas a página (Vitrine limpa)
  return <HomePage />;
};

const App = () => {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* --- ROTAS PÚBLICAS --- */}
            {/* A Landing Page é a porta de entrada (/) */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />

            {/* Rota de Login separada */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* --- ROTA HÍBRIDA (Home) --- */}
            {/* Se logado, renderiza dentro do ProtectedRoute (com Layout/Menu) */}
            {/* Se deslogado, renderiza puramente a HomePage (Vitrine) */}
            <Route
              path="/home"
              element={
                <HomeRouterWrapper />
              }
            />

            {/* --- ROTAS PROTEGIDAS (Necessitam Login) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/imoveis" element={<ImoveisPage />} />
              <Route path="/empresas" element={<EmpresasPage />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/leads" element={<LeadsPage />} />
            </Route>

            {/* --- FALLBACK --- */}
            {/* Qualquer URL inexistente redireciona para a Landing Page */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;