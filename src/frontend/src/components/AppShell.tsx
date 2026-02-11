import { Outlet } from '@tanstack/react-router';
import Header from './Header';
import Footer from './Footer';

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
