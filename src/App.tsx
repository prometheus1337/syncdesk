import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RefundDashboard } from './components/RefundDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DocsHub } from './components/DocsHub';
import { DocsViewer } from './components/DocsViewer';
import { ReportsDashboard } from './components/ReportsDashboard';
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

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'support' }) {
  const { appUser, loading } = useAuth();

  if (loading) {
    return <div>Carregando..</div>;
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
            <Route path="/" element={<Navigate to="/refunds" />} />
            <Route path="/login" element={<LoginPage />} />
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
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <ReportsDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/docs/admin" element={<DocsHub />} />
            <Route path="/docs/edit/:docId" element={<DocsHub />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
