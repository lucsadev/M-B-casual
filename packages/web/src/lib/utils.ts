import { type ClassValue, clsx } from 'clsx';

/**
 * Merge class names with Tailwind CSS support.
 * Uses clsx for conditional class merging.
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * cn('px-4', isActive && 'bg-black', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
