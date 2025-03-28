import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
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
import { CSDashboard } from './components/CSDashboard';
import AmbassadorManagement from './components/AmbassadorManagement';
import AmbassadorDashboard from './components/AmbassadorDashboard';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        bg: '#FFDB01',
        color: 'black',
        _hover: {
          bg: '#E5C501',
        }
      },
    },
    Card: {
      baseStyle: {
        container: {
          boxShadow: 'sm',
          rounded: 'lg',
        },
      },
    },
  },
});

export function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rota padrão - redireciona para relatórios */}
            <Route path="/" element={<Navigate to="/relatorios" replace />} />
            
            {/* Rotas protegidas */}
            <Route
              path="/relatorios"
              element={
                <PrivateRoute>
                  <Layout>
                    <ReportsDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/documentos"
              element={
                <RestrictedRoute allowedRoles={['admin', 'support', 'commercial', 'essay_director', 'designer']}>
                  <Layout>
                    <DocsHub />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/images"
              element={
                <RestrictedRoute allowedRoles={['admin', 'designer']}>
                  <Layout>
                    <ImageGenerator />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <RestrictedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </RestrictedRoute>
              }
            />

            {/* Rotas de redação */}
            <Route
              path="/redacoes"
              element={
                <RestrictedRoute allowedRoles={['admin', 'essay_director']}>
                  <Layout>
                    <EssayDashboard />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/redacoes/creditos"
              element={
                <RestrictedRoute allowedRoles={['admin', 'essay_director']}>
                  <Layout>
                    <EssayCreditLogs />
                  </Layout>
                </RestrictedRoute>
              }
            />

            {/* Rota de reembolsos */}
            <Route
              path="/reembolsos"
              element={
                <RestrictedRoute allowedRoles={['admin', 'support']}>
                  <Layout>
                    <RefundDashboard />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/cs"
              element={
                <RestrictedRoute allowedRoles={['admin', 'cs']}>
                  <Layout>
                    <CSDashboard />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/admin/ambassadors"
              element={
                <RestrictedRoute allowedRoles={['admin']}>
                  <AmbassadorManagement />
                </RestrictedRoute>
              }
            />

            <Route
              path="/ambassador"
              element={
                <PrivateRoute requiredRole="ambassador">
                  <Layout>
                    <AmbassadorDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Rota para páginas não encontradas - redireciona para relatórios */}
            <Route path="*" element={<Navigate to="/relatorios" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
