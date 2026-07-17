import type { CatalogSort } from '../types/catalog.ts';

/**
 * A sort option entry for UI selectors (dropdowns, radio groups).
 */
export interface SortOption {
  /** Display label (e.g., "Precio: menor a mayor") */
  label: string;
  /** The sort value to pass to the API */
  value: CatalogSort;
}

/**
 * Predefined sort options for the product catalog.
 * The first entry is the default.
 */
export const SORT_OPTIONS: SortOption[] = [
  {
    label: 'Más recientes',
    value: { field: 'created_at', direction: 'desc' },
  },
  {
    label: 'Precio: menor a mayor',
    value: { field: 'price', direction: 'asc' },
  },
  {
    label: 'Precio: mayor a menor',
    value: { field: 'price', direction: 'desc' },
  },
  {
    label: 'Nombre: A-Z',
    value: { field: 'name', direction: 'asc' },
  },
  {
    label: 'Nombre: Z-A',
    value: { field: 'name', direction: 'desc' },
  },
];
