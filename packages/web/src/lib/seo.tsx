/**
 * SEO — Holistic meta-tag component for react-helmet-async.
 *
 * Sets document.title, meta description, Open Graph tags, and canonical URL
 * via Helmet for any route.
 *
 * @example
 * <SEO
 *   title="Catálogo — M&B Trend"
 *   description="Explorá nuestra colección de indumentaria y accesorios."
 *   path="/catalogo"
 * />
 */
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  /** Page title (suffix " — M&B Trend" is auto-appended when not present) */
  title?: string;
  /** Meta description */
  description?: string;
  /** OG:image URL */
  image?: string;
  /** OG:type (default: "website") */
  ogType?: string;
  /** Page path for canonical URL and OG:url (e.g. "/catalogo") */
  path?: string;
}

const SITE_NAME = 'M&B Trend';
const SITE_URL = 'https://mbtrend.vercel.app';
const DEFAULT_DESCRIPTION = 'Tienda online de indumentaria y accesorios. Moda urbana con personalidad única.';
const DEFAULT_OG_IMAGE = '/og-default.jpg';

/**
 * Ensure the site suffix is present in the title.
 */
function formatTitle(title?: string): string {
  if (!title) return `${SITE_NAME} — Moda y Accesorios`;
  if (title.includes(SITE_NAME)) return title;
  return `${title} — ${SITE_NAME}`;
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  ogType = 'website',
  path = '/',
}: SEOProps) {
  const fullTitle = formatTitle(title);
  const url = `${SITE_URL}${path}`;
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Standard meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Canonical */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
