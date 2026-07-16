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
      navigate('/');
    } catch {
      toast.error('Error al cerrar sesión');
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
      setMobileOpen(false);
    }
  };

  // Admin check
  const isAdmin = user?.app_metadata?.role === 'admin';

  const profileName =
    !profileLoading && profile
      ? `${profile.firstName ?? ''}${profile.lastName ? ` ${profile.lastName}` : ''}`.trim()
      : '';

  const googleName =
    user?.user_metadata?.nombre ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    null;

  const displayName = profileName || googleName || user?.email || null;

  return (
    <header className="border-b border-brand-gray-200 bg-brand-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <Link to="/" className="flex flex-col items-start leading-tight text-brand-black hover:opacity-80 transition-opacity" aria-label="M&B Casual - Inicio">
          <div className="flex items-baseline gap-2">
            <span className="font-brand text-4xl font-bold">
              M
              <span className="text-2xl relative top-[-0.1em] mx-1">&</span>
              B
            </span>
            <span className="font-casual font-light text-sm tracking-widest uppercase">Casual</span>
          </div>
          <span className="font-tagline text-2xl opacity-70 mt-0.5 hidden sm:inline">Estilo casual para todos tus d&iacute;as</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          <li>
            <Link
              to="/catalogo"
              className="text-brand-black transition-colors hover:text-brand-coral"
            >
              Catálogo
            </Link>
          </li>

          {authLoading ? null : user ? (
            <li className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 text-brand-black transition-colors hover:text-brand-coral"
              >
                <span className="w-max" title={displayName ?? 'Mi perfil'}>{displayName ?? 'Mi perfil'}</span>
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
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-[#E2E2DC] bg-[#FFFFFF] py-1 shadow-lg">
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-medium text-[#E8836B] transition-colors hover:bg-[#E2E2DC]/30"
                    >
                      Administración
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/perfil"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-[#1A1A1A] transition-colors hover:bg-[#E2E2DC]/30"
                      >
                        Perfil
                      </Link>
                      <Link
                        to="/perfil#ordenes"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-[#1A1A1A] transition-colors hover:bg-[#E2E2DC]/30"
                      >
                        Mis órdenes
                      </Link>
                    </>
                  )}
                  <hr className="my-1 border-[#E2E2DC]" />
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
                  className="text-[#1A1A1A] transition-colors hover:text-[#E8836B]"
                >
                  Ingresar
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="rounded-md bg-[#E8836B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E8836B]/90"
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
        <div className="border-t border-[#E2E2DC] bg-[#FFFFFF] px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-3 pt-3">
            <li>
              <Link
                to="/catalogo"
                onClick={() => setMobileOpen(false)}
                className="block text-[#1A1A1A] transition-colors hover:text-[#E8836B]"
              >
                Catálogo
              </Link>
            </li>

            {authLoading ? null : user ? (
              <>
                <li className="border-t border-[#E2E2DC]/50 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-black/50">
                    {displayName ?? 'Mi cuenta'}
                  </p>
                </li>
                {isAdmin ? (
                  <li>
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block font-medium text-[#E8836B] transition-colors hover:text-[#E8836B]/80"
                    >
                      Administración
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/perfil"
                        onClick={() => setMobileOpen(false)}
                        className="block text-[#1A1A1A] transition-colors hover:text-[#E8836B]"
                      >
                        Perfil
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/perfil#ordenes"
                        onClick={() => setMobileOpen(false)}
                        className="block text-[#1A1A1A] transition-colors hover:text-[#E8836B]"
                      >
                        Mis órdenes
                      </Link>
                    </li>
                  </>
                )}
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
                <li className="border-t border-[#E2E2DC]/50 pt-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-[#1A1A1A] transition-colors hover:text-[#E8836B]"
                  >
                    Ingresar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block text-[#1A1A1A] transition-colors hover:text-[#E8836B]"
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
          title="M & B Casual — Moda y Accesorios"
          description="Tienda online de indumentaria y accesorios. Descubrí nuestra colección de moda urbana con personalidad única."
          path={location.pathname}
        />
        <div className="flex min-h-screen flex-col">
          <HeaderNav onOpenCart={handleOpenCart} />

          <main className="flex-1">
            <Outlet />
          </main>

          <footer className="border-t border-[#E2E2DC] bg-[#FFFFFF] py-6 text-center text-sm text-[#1A1A1A]">
            <p>&copy; {new Date().getFullYear()} M & B Casual. Todos los derechos reservados.</p>
          </footer>

          {/* Cart sidebar */}
          <CartSidebar open={cartOpen} onClose={handleCloseCart} />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
