/**
 * Predefined product categories for M&B Trend.
 * Each entry maps to a row in the `categories` table.
 */
export interface CategoryConstant {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export const CATEGORIES: CategoryConstant[] = [
  {
    id: 'mujer',
    name: 'Mujer',
    slug: 'mujer',
    description: 'Indumentaria y accesorios para mujer',
  },
  {
    id: 'hombre',
    name: 'Hombre',
    slug: 'hombre',
    description: 'Indumentaria y accesorios para hombre',
  },
  {
    id: 'accesorios',
    name: 'Accesorios',
    slug: 'accesorios',
    description: 'Complementos y accesorios de moda',
  },
];
