import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from '@/components/layout/header';

export default function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          GitHub Gist Client &copy; {new Date().getFullYear()}
        </div>
      </footer>
      <Toaster position="top-right" />
    </div>
  );
}