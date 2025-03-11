import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RefundDashboard } from './components/RefundDashboard';
import { DocsHub } from './components/DocsHub';
import { DocsViewer } from './components/DocsViewer';
import { ReportsDashboard } from './components/ReportsDashboard';
import LoginPage from './components/LoginPage';
import { Layout } from './components/Layout';
import { EssayDashboard } from './components/EssayDashboard';
import { EssayCreditLogs } from './components/EssayCreditLogs';
import { ImageGenerator } from './components/ImageGenerator';
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

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <RefundDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/refunds"
              element={
                <PrivateRoute requiredRole="support">
                  <Layout>
                    <RefundDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/docs"
              element={
                <PrivateRoute requiredRole="admin">
                  <Layout>
                    <DocsHub />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/docs/view"
              element={
                <PrivateRoute>
                  <Layout>
                    <DocsViewer />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/essays"
              element={
                <PrivateRoute requiredRole="essay_director">
                  <Layout>
                    <EssayDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/essay-logs"
              element={
                <PrivateRoute>
                  <Layout>
                    <EssayCreditLogs />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Layout>
                    <ReportsDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/images"
              element={
                <PrivateRoute requiredRole="admin">
                  <Layout>
                    <ImageGenerator />
                  </Layout>
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
