import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/root-layout.js';
import { AdminLayout } from './layouts/admin-layout.js';
import { HomePage } from '@/features/catalog/pages/home-page.js';
import { CatalogPage } from '@/features/catalog/pages/catalog-page.js';
import { ProductDetailPage } from '@/features/catalog/pages/product-detail-page.js';
import { CartPage } from './pages/cart.js';
import { CheckoutPage } from './pages/checkout.js';
import { OrderConfirmationPage } from './pages/order-confirmation.js';
import { AdminDashboardPage } from './pages/admin-dashboard.js';
import { AdminOrdersPage } from './pages/orders-admin.js';
import { AdminCustomersPage } from './pages/customers-admin.js';
import { CustomerDetailPage } from '@/features/admin/customers/pages/CustomerDetailPage.js';
import { OrderDetailPage } from '@/features/admin/orders/pages/OrderDetailPage.js';
import { NotFoundPage } from './pages/not-found.js';
import { AdminGuard } from '@/features/admin/guards/AdminGuard.js';
import { ProductListPage } from '@/features/admin/products/pages/ProductListPage.js';
import { ProductFormPage } from '@/features/admin/products/pages/ProductFormPage.js';
import { GuestRoute, ProtectedRoute } from '@/features/auth/index.js';
import { LoginPage } from '@/features/auth/pages/LoginPage.js';
import { RegisterPage } from '@/features/auth/pages/RegisterPage.js';
import { ProfilePage } from '@/features/customers/pages/ProfilePage.js';

// Finance pages (PR 3 — new feature-based pages replacing old app/pages/)
import { DashboardPage } from '@/features/finance/pages/dashboard-page.js';
import { ExpensesPage } from '@/features/finance/pages/expenses-page.js';
import { PurchasesPage } from '@/features/finance/pages/purchases-page.js';
import { CashMovementsPage } from '@/features/finance/pages/cash-movements-page.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'producto/:slug', element: <ProductDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      { path: 'gracias/:id', element: <OrderConfirmationPage /> },
      // Auth routes
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'productos', element: <ProductListPage /> },
      { path: 'productos/nuevo', element: <ProductFormPage /> },
      { path: 'productos/:id/editar', element: <ProductFormPage /> },
      { path: 'ordenes', element: <AdminOrdersPage /> },
      { path: 'ordenes/:id', element: <OrderDetailPage /> },
      { path: 'clientes', element: <AdminCustomersPage /> },
      { path: 'clientes/:id', element: <CustomerDetailPage /> },
      // Finance routes (PR 3)
      { path: 'compras', element: <PurchasesPage /> },
      { path: 'gastos', element: <ExpensesPage /> },
      { path: 'caja', element: <CashMovementsPage /> },
      { path: 'finanzas', element: <DashboardPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
