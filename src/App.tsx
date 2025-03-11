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
import { EssayDashboard } from './components/EssayDashboard';
import { EssayCreditLogs } from './components/EssayCreditLogs';
import { ImageGenerator } from './components/ImageGenerator';
import { RestrictedRoute } from './components/RestrictedRoute';
import { UserRole } from './types/UserRole';
import PrivateRoute from './components/PrivateRoute';

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

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'support' | 'essay_director' }) {
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
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route element={<RestrictedRoute roles={[UserRole.ADMIN, UserRole.SUPPORT, UserRole.COMMERCIAL]} />}>
                  <Route path="/docs" element={<Documents />} />
                </Route>
                <Route element={<RestrictedRoute roles={[UserRole.ADMIN]} />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route element={<RestrictedRoute roles={[UserRole.ADMIN, UserRole.DESIGNER]} />}>
                  <Route path="/images" element={<ImageGenerator />} />
                </Route>
                <Route element={<RestrictedRoute roles={[UserRole.ADMIN, UserRole.TEACHER]} />}>
                  <Route path="/essays" element={<EssayDashboard />} />
                  <Route path="/essay-logs" element={<EssayCreditLogs />} />
                </Route>
              </Route>
            </Route>
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
