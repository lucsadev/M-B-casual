/**
 * SearchBar — Debounced search input integrated with URL query params.
 *
 * Features:
 * - 300ms debounce before updating the parent value
 * - Search icon on the left
 * - Clear button when there's text
 * - Controlled via the parent to sync with URL params
 * - Cyberpunk dark mode design with neon glow effects
 */
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar productos...',
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 300);
  const isFirstRender = useRef(true);

  // Sync external value changes (e.g., clear filters) into local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Fire onChange only when debounced value changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  function handleClear() {
    setLocalValue('');
    onChange('');
  }

  return (
    <div className={cn('relative group', className)}>
      {/* Glow background effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-2xl opacity-30 group-hover:opacity-60 blur transition duration-500" />
      
      {/* Search icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="relative w-full rounded-2xl border-0 bg-gray-900/90 py-3.5 pl-12 pr-10 text-sm text-gray-100 shadow-lg ring-1 ring-inset ring-white/10 placeholder:text-gray-500 transition-all duration-300 focus:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 focus:ring-offset-gray-900 backdrop-blur-xl"
        aria-label={placeholder}
      />

      {/* Clear button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-fuchsia-500/20 text-fuchsia-400 transition-all duration-300 hover:bg-fuchsia-500 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(217,70,239,0.6)]"
          aria-label="Limpiar búsqueda"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
