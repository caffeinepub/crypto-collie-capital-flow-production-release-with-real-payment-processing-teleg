import { Suspense, lazy } from 'react';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppShell from './components/AppShell';
import RouteLoading from './components/RouteLoading';
import Dashboard from './pages/Dashboard';

// Lazy load heavy routes
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

const rootRoute = createRootRoute({
  component: () => <AppShell />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-success',
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <PaymentSuccess />
    </Suspense>
  ),
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-failure',
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <PaymentFailure />
    </Suspense>
  ),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-settings',
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <AdminSettings />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  adminSettingsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-right" />
    </ThemeProvider>
  );
}
