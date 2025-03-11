import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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
import { RestrictedRoute } from './components/RestrictedRoute';
import { UserRole } from './types/user';
import { Dashboard } from './components/Dashboard';
import { Documents } from './components/Documents';
import { Admin } from './components/Admin';

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
            
            <Route element={<RestrictedRoute roles={[
              UserRole.ADMIN,
              UserRole.SUPPORT,
              UserRole.COMMERCIAL,
              UserRole.TEACHER,
              UserRole.DESIGNER
            ]} />}>
              <Route element={<Layout><Outlet /></Layout>}>
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

            <Route element={<RestrictedRoute roles={[UserRole.ADMIN, UserRole.SUPPORT]} />}>
              <Route path="/refunds" element={<RefundDashboard />} />
            </Route>

            <Route element={<RestrictedRoute roles={[UserRole.ADMIN, UserRole.SUPPORT, UserRole.COMMERCIAL]} />}>
              <Route path="/docs/view" element={<DocsViewer />} />
            </Route>

            <Route element={<RestrictedRoute roles={[UserRole.ADMIN, UserRole.SUPPORT]} />}>
              <Route path="/reports" element={<ReportsDashboard />} />
            </Route>

            <Route element={<RestrictedRoute roles={[UserRole.ADMIN]} />}>
              <Route path="/docs/admin" element={<DocsHub />} />
              <Route path="/docs/edit/:docId" element={<DocsHub />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
