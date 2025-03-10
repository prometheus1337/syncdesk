import { ChakraProvider, extendTheme, ThemeConfig, ThemeComponentProps } from '@chakra-ui/react';
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

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      baseStyle: (props: ThemeComponentProps) => ({
        _hover: {
          bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
        },
      }),
    },
    Card: {
      baseStyle: {
        container: {
          boxShadow: 'sm',
          rounded: 'lg',
          bg: (props: ThemeComponentProps) => props.colorMode === 'dark' ? 'gray.700' : 'white',
        },
      },
    },
    Menu: {
      baseStyle: (props: ThemeComponentProps) => ({
        list: {
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
        },
        item: {
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
          },
          color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        },
      }),
    },
    Modal: {
      baseStyle: (props: ThemeComponentProps) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
        },
      }),
    },
    Table: {
      baseStyle: (props: ThemeComponentProps) => ({
        th: {
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          color: props.colorMode === 'dark' ? 'gray.200' : 'gray.600',
        },
        td: {
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
        },
      }),
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
            <Route
              path="/essays"
              element={
                <PrivateRoute>
                  <EssayDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/essay-logs"
              element={
                <PrivateRoute>
                  <EssayCreditLogs />
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
