import { ChakraProvider, extendTheme, Box, Text, Heading } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RefundDashboard } from './components/RefundDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DocsHub } from './components/DocsHub';
import { DocsViewer } from './components/DocsViewer';
import LoginPage from './components/LoginPage';
import { Layout } from './components/Layout';

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
        colorScheme: 'blue',
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

// Componente de teste que não requer autenticação
function TestPage() {
  return (
    <Box p={8} maxWidth="800px" mx="auto">
      <Heading mb={4}>Página de Teste</Heading>
      <Text>Esta é uma página de teste que não requer autenticação.</Text>
      <Text mt={4}>Se você está vendo esta página, a aplicação está funcionando corretamente.</Text>
    </Box>
  );
}

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'support' }) {
  const { appUser, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!appUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && appUser.role !== requiredRole && appUser.role !== 'admin') {
    return <div>Acesso negado</div>;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/refunds"
              element={
                <PrivateRoute requiredRole="support">
                  <RefundDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/docs"
              element={
                <PrivateRoute requiredRole="admin">
                  <DocsHub />
                </PrivateRoute>
              }
            />
            <Route
              path="/docs/view"
              element={
                <PrivateRoute>
                  <DocsViewer />
                </PrivateRoute>
              }
            />
            <Route path="/docs/admin" element={<DocsHub />} />
            <Route path="/docs/edit/:docId" element={<DocsHub />} />
            <Route path="/" element={<Navigate to="/test" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
