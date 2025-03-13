import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import LoginPage from './components/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { RestrictedRoute } from './components/RestrictedRoute';
import { DocsHub } from './components/DocsHub';
import { DocView } from './components/DocView';
import { ImageGenerator } from './components/ImageGenerator';
import { AdminDashboard } from './components/AdminDashboard';
import { EssayDashboard } from './components/EssayDashboard';
import { EssayCreditLogs } from './components/EssayCreditLogs';
import { ReportsDashboard } from './components/ReportsDashboard';
import { DocsViewer } from './components/DocsViewer';

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
                <RestrictedRoute allowedRoles={['admin', 'support', 'essay_director', 'designer']}>
                  <Layout>
                    <DocsHub />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/documentos/visualizar/:id"
              element={
                <RestrictedRoute allowedRoles={['admin']}>
                  <Layout>
                    <DocView />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/docs"
              element={
                <PrivateRoute>
                  <Layout>
                    <DocsViewer />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/images"
              element={
                <RestrictedRoute allowedRoles={['admin']}>
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
                <RestrictedRoute allowedRoles={['admin']}>
                  <Layout>
                    <EssayDashboard />
                  </Layout>
                </RestrictedRoute>
              }
            />

            <Route
              path="/redacoes/creditos"
              element={
                <RestrictedRoute allowedRoles={['admin']}>
                  <Layout>
                    <EssayCreditLogs />
                  </Layout>
                </RestrictedRoute>
              }
            />

            {/* Redireciona qualquer rota não encontrada para relatórios */}
            <Route path="*" element={<Navigate to="/relatorios" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
