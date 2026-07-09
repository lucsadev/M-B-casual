import { Link } from 'react-router-dom';

/**
 * 404 page for unmatched routes.
 */
export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 text-center">
      <h1 className="mb-4 text-6xl font-bold text-[#1A1A1A]">404</h1>
      <p className="mb-8 text-lg text-[#1A1A1A]/70">
        Página no encontrada
      </p>
      <Link
        to="/"
        className="inline-block rounded-md bg-[#1A1A1A] px-6 py-3 text-[#FFFFFF] transition-colors hover:bg-[#1A1A1A]/90"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
