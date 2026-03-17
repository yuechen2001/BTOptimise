import {
    createRouter,
    createRoute,
    createRootRoute,
    RouterProvider,
    Outlet,
} from '@tanstack/react-router';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import OversubscriptionPage from './pages/OversubscriptionPage';

/* ─── Route Definitions ───────────────────────────────────── */

const rootRoute = createRootRoute({
    component: () => (
        <Layout>
            <Outlet />
        </Layout>
    ),
});

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: OnboardingPage,
});

const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: DashboardPage,
});

const compareRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/compare',
    component: ComparePage,
});

const oversubscriptionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/oversubscription',
    component: OversubscriptionPage,
});

const routeTree = rootRoute.addChildren([
    indexRoute,
    dashboardRoute,
    compareRoute,
    oversubscriptionRoute,
]);

const router = createRouter({ routeTree });

/* ─── Type-safe module augmentation ───────────────────────── */

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

/* ─── App Component ───────────────────────────────────────── */

export default function App() {
    return (
        <AppProvider>
            <RouterProvider router={router} />
        </AppProvider>
    );
}
