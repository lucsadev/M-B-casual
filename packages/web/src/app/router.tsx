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
import { AdminExpensesPage } from './pages/expenses-admin.js';
import { AdminPurchasesPage } from './pages/purchases-admin.js';
import { AdminFinancePage } from './pages/finance-admin.js';
import { NotFoundPage } from './pages/not-found.js';
import { AdminGuard } from '@/features/admin/guards/AdminGuard.js';
import { ProductListPage } from '@/features/admin/products/pages/ProductListPage.js';
import { ProductFormPage } from '@/features/admin/products/pages/ProductFormPage.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'producto/:slug', element: <ProductDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'gracias/:id', element: <OrderConfirmationPage /> },
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
      { path: 'clientes', element: <AdminCustomersPage /> },
      { path: 'compras', element: <AdminPurchasesPage /> },
      { path: 'gastos', element: <AdminExpensesPage /> },
      { path: 'finanzas', element: <AdminFinancePage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
