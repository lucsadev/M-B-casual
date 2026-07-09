/**
 * Root layout for the public-facing pages.
 * Wraps all public routes with AuthProvider, CartProvider, header, footer,
 * auth-aware nav links with profile name, dropdown user menu, CartBadge,
 * and CartSidebar.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { CartProvider } from '@/features/cart/context/CartContext';
import { CartBadge } from '@/features/cart/components/cart-badge';
import { CartSidebar } from '@/features/cart/components/cart-sidebar';
import { useProfile } from '@/features/customers/hooks/use-profile';
import { SEO } from '@/lib/seo';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Auth-aware header
// ---------------------------------------------------------------------------

function HeaderNav({ onOpenCart }: { onOpenCart: () => void }) {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Sesión cerrada');
      navigate('/');
    } catch {
      toast.error('Error al cerrar sesión');
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
      setMobileOpen(false);
    }
  };

  // Compute display name from profile or fall back to metadata
  const displayName = !profileLoading && profile
    ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName.charAt(0)}.` : ''}`
    : user?.user_metadata?.nombre ?? null;

  return (
    <header className="border-b border-[#E8E4D9] bg-[#FFFFF7]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-bold text-[#1A1A1A]">
          M&B Trend
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          <li>
            <Link
              to="/catalogo"
              className="text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
            >
              Catálogo
            </Link>
          </li>

          {authLoading ? null : user ? (
            <li className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
              >
                <span>{displayName ?? 'Mi perfil'}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-[#E8E4D9] bg-[#FFFFF7] py-1 shadow-lg">
                  <Link
                    to="/perfil"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1A1A1A] transition-colors hover:bg-[#E8E4D9]/30"
                  >
                    Perfil
                  </Link>
                  <Link
                    to="/perfil#ordenes"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[#1A1A1A] transition-colors hover:bg-[#E8E4D9]/30"
                  >
                    Mis órdenes
                  </Link>
                  <hr className="my-1 border-[#E8E4D9]" />
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
                  </button>
                </div>
              )}
            </li>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className="text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
                >
                  Ingresar
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="rounded-md bg-[#D4A853] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D4A853]/90"
                >
                  Crear cuenta
                </Link>
              </li>
            </>
          )}

          <li>
            <CartBadge onOpenSidebar={onOpenCart} />
          </li>
        </ul>

        {/* Mobile: hamburger + cart badge */}
        <div className="flex items-center gap-3 md:hidden">
          <CartBadge onOpenSidebar={onOpenCart} />
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-1 text-[#1A1A1A]"
            aria-label="Menú"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#E8E4D9] bg-[#FFFFF7] px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-3 pt-3">
            <li>
              <Link
                to="/catalogo"
                onClick={() => setMobileOpen(false)}
                className="block text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
              >
                Catálogo
              </Link>
            </li>

            {authLoading ? null : user ? (
              <>
                <li className="border-t border-[#E8E4D9]/50 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                    {displayName ?? 'Mi cuenta'}
                  </p>
                </li>
                <li>
                  <Link
                    to="/perfil"
                    onClick={() => setMobileOpen(false)}
                    className="block text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
                  >
                    Perfil
                  </Link>
                </li>
                <li>
                  <Link
                    to="/perfil#ordenes"
                    onClick={() => setMobileOpen(false)}
                    className="block text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
                  >
                    Mis órdenes
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="block w-full text-left text-red-600 transition-colors hover:text-red-500 disabled:opacity-50"
                  >
                    {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="border-t border-[#E8E4D9]/50 pt-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
                  >
                    Ingresar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block text-[#1A1A1A] transition-colors hover:text-[#D4A853]"
                  >
                    Crear cuenta
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export function RootLayout() {
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);

  const handleOpenCart = useCallback(() => setCartOpen(true), []);
  const handleCloseCart = useCallback(() => setCartOpen(false), []);

  return (
    <AuthProvider>
      <CartProvider>
        <SEO
          title="M&B Trend — Moda y Accesorios"
          description="Tienda online de indumentaria y accesorios. Descubrí nuestra colección de moda urbana con personalidad única."
          path={location.pathname}
        />
        <div className="flex min-h-screen flex-col">
          <HeaderNav onOpenCart={handleOpenCart} />

          <main className="flex-1">
            <Outlet />
          </main>

          <footer className="border-t border-[#E8E4D9] bg-[#FFFFF7] py-6 text-center text-sm text-[#1A1A1A]">
            <p>&copy; {new Date().getFullYear()} M&B Trend. Todos los derechos reservados.</p>
          </footer>

          {/* Cart sidebar */}
          <CartSidebar open={cartOpen} onClose={handleCloseCart} />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
