/**
 * Admin Layout with responsive sidebar.
 *
 * - Desktop: persistent sidebar (64rem / 256px)
 * - Mobile: sidebar slides in/out via hamburger toggle, overlay behind
 * - Header shows breadcrumb based on current route
 * - Protected by AdminGuard (wrapped in router)
 */
import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

// ---------------------------------------------------------------------------
// SVG Icons (inline — no icon library dependency)
// ---------------------------------------------------------------------------

function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function IconProduct({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconOrder({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconCustomer({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconPurchase({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconExpense({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconFinance({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconChart({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[#FFFFFF]' : 'text-[#1A1A1A]/60'}
    >
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Navigation configuration
// ---------------------------------------------------------------------------

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  Icon: React.ComponentType<{ active: boolean }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', end: true, Icon: IconDashboard },
  { to: '/admin/productos', label: 'Productos', end: false, Icon: IconProduct },
  { to: '/admin/ordenes', label: 'Órdenes', end: false, Icon: IconOrder },
  { to: '/admin/clientes', label: 'Usuarios', end: false, Icon: IconCustomer },
  { to: '/admin/compras', label: 'Compras', end: false, Icon: IconPurchase },
  { to: '/admin/gastos', label: 'Gastos', end: false, Icon: IconExpense },
  { to: '/admin/caja', label: 'Caja', end: false, Icon: IconFinance },
  { to: '/admin/finanzas', label: 'Finanzas', end: false, Icon: IconChart },
];

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Administración',
  productos: 'Productos',
  ordenes: 'Órdenes',
  clientes: 'Usuarios',
  compras: 'Compras',
  gastos: 'Gastos',
  caja: 'Caja',
  finanzas: 'Finanzas',
  nuevo: 'Nuevo',
  editar: 'Editar',
};

function useBreadcrumbs(pathname: string): string[] {
  return useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((p) => ROUTE_LABELS[p] ?? p);
  }, [pathname]);
}

// ---------------------------------------------------------------------------
// Hamburger icon
// ---------------------------------------------------------------------------

function Hamburger({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#1A1A1A]"
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Admin Layout
// ---------------------------------------------------------------------------

/**
 * Admin layout with responsive sidebar navigation and breadcrumb header.
 */
export function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breadcrumbs = useBreadcrumbs(location.pathname);

  return (
    <div className="flex min-h-screen bg-[#FFFFFF]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#E2E2DC] bg-white p-6 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <Link
          to="/admin"
          onClick={() => setSidebarOpen(false)}
          className="mb-8 block text-[#1A1A1A] hover:opacity-80 transition-opacity"
        >
          <span className="font-brand text-2xl font-bold">
            M
            <span className="text-xl relative top-[-0.1em] mx-1">&</span>
            B
          </span>
          <span className="font-casual font-light text-xs tracking-widest uppercase mt-[-0.1em] block">Casual</span>
          <span className="ml-2 text-xs font-normal text-[#E8836B]">Administración</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1A1A1A] text-[#FFFFFF]'
                        : 'text-[#1A1A1A] hover:bg-[#E2E2DC]'
                    }`}
                  >
                    <item.Icon active={isActive} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to store */}
        <div className="border-t border-[#E2E2DC] pt-6">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#1A1A1A]/60 transition-colors hover:text-[#E8836B]"
          >
            ← Ver tienda
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col lg:h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#E2E2DC] bg-white px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center rounded-md p-1.5 hover:bg-[#F0F0EC] lg:hidden"
            aria-label="Abrir menú"
          >
            <Hamburger open={false} />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-[#1A1A1A]/60">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span>/</span>}
                  <span
                    className={
                      i === breadcrumbs.length - 1
                        ? 'font-medium text-[#1A1A1A]'
                        : undefined
                    }
                  >
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
