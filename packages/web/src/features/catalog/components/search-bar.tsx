/**
 * SearchBar — Debounced search input integrated with URL query params.
 *
 * Features:
 * - 300ms debounce before updating the parent value
 * - Search icon on the left
 * - Clear button when there's text
 * - Controlled via the parent to sync with URL params
 * - Modern design with rounded corners and subtle shadows
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
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#E8836B]"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border-0 bg-[#F9F9F7] py-3.5 pl-12 pr-10 text-sm text-[#1A1A1A] shadow-sm ring-1 ring-inset ring-[#E2E2DC]/50 placeholder:text-[#1A1A1A]/40 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8836B] focus:ring-offset-0"
        aria-label={placeholder}
      />

      {/* Clear button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8836B]/10 text-[#E8836B] transition-colors hover:bg-[#E8836B] hover:text-white"
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
