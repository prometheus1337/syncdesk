import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { RestrictedRoute } from './components/RestrictedRoute';
import { ImageGenerator } from './components/ImageGenerator';
import { DocsHub } from './components/DocsHub';
import { ReportsDashboard } from './components/ReportsDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { EssayDashboard } from './components/EssayDashboard';
import { EssayCreditLogs } from './components/EssayCreditLogs';
import { RefundDashboard } from './components/RefundDashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rota padrão - redireciona para relatórios */}
      <Route path="/" element={<Navigate to="/relatorios" replace />} />
      
      {/* Rotas protegidas */}
      <Route
        path="/relatorios"
        element={
          <PrivateRoute>
            <ReportsDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/documentos"
        element={
          <RestrictedRoute allowedRoles={['admin', 'support', 'commercial', 'essay_director', 'designer']}>
            <DocsHub />
          </RestrictedRoute>
        }
      />

      <Route
        path="/gerador-imagens"
        element={
          <RestrictedRoute allowedRoles={['admin', 'designer']}>
            <ImageGenerator />
          </RestrictedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <RestrictedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </RestrictedRoute>
        }
      />

      {/* Rotas de redação */}
      <Route
        path="/redacoes"
        element={
          <RestrictedRoute allowedRoles={['admin', 'essay_director']}>
            <EssayDashboard />
          </RestrictedRoute>
        }
      />

      <Route
        path="/creditos"
        element={
          <RestrictedRoute allowedRoles={['admin', 'essay_director']}>
            <EssayCreditLogs />
          </RestrictedRoute>
        }
      />

      {/* Rota de reembolsos */}
      <Route
        path="/reembolsos"
        element={
          <RestrictedRoute allowedRoles={['admin', 'support']}>
            <RefundDashboard />
          </RestrictedRoute>
        }
      />

      {/* Rota para páginas não encontradas - redireciona para relatórios */}
      <Route path="*" element={<Navigate to="/relatorios" replace />} />
    </Routes>
  );
} 