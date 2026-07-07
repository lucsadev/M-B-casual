import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/root-layout.js';
import { AdminLayout } from './layouts/admin-layout.js';
import { HomePage } from './pages/home.js';
import { CatalogPage } from './pages/catalog.js';
import { ProductDetailPage } from './pages/product-detail.js';
import { CartPage } from './pages/cart.js';
import { AdminDashboardPage } from './pages/admin-dashboard.js';
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
      { path: 'catalogo/:category', element: <CatalogPage /> },
      { path: 'producto/:slug', element: <ProductDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
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
      { path: 'ordenes', element: <AdminDashboardPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
