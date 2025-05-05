import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth/auth-provider';
import RootLayout from '@/components/layout/root-layout';
import ProtectedRoute from '@/components/auth/protected-route';
import LoginPage from '@/components/pages/login-page';
import Dashboard from '@/components/pages/dashboard';
import GistListPage from '@/components/pages/gist-list-page';
import GistDetailPage from '@/components/pages/gist-detail-page';
import GistCreatePage from '@/components/pages/gist-create-page';
import GistEditPage from '@/components/pages/gist-edit-page';
import NotFoundPage from '@/components/pages/not-found-page';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RootLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gists" element={<GistListPage />} />
            <Route path="/gists/:id" element={<GistDetailPage />} />
            <Route path="/gists/create" element={<GistCreatePage />} />
            <Route path="/gists/:id/edit" element={<GistEditPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
