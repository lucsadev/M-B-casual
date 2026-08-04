import * as React from 'react';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  /** Currently selected option values */
  value: string[];
  /** Called with the next full selection array */
  onChange: (value: string[]) => void;
  /** Options to choose from */
  options: MultiSelectOption[];
  /** Shown in the trigger when nothing is selected */
  placeholder?: string;
  /** Shown inside the panel when there are no options at all */
  emptyMessage?: string;
}

/**
 * MultiSelect — dependency-free multi-value select built on the existing
 * ui kit (Badge + lucide icons). Shows selected values as removable chips
 * in the trigger and a searchable, checkmarked listbox in the dropdown.
 */
export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  emptyMessage = 'No options',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  // Close on outside click or Escape while the panel is open.
  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selected = value
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is MultiSelectOption => Boolean(o));

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(normalizedQuery),
  );

  function togglePanel() {
    const next = !open;
    setOpen(next);
    if (next) setQuery('');
  }

  function toggleOption(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePanel();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? panelId : undefined}
        tabIndex={0}
        onClick={togglePanel}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          open
            ? 'border-ring ring-ring/50 ring-[3px]'
            : 'border-input',
        )}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selected.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="max-w-full gap-1 py-0.5"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(value.filter((v) => v !== option.value));
                }}
                className="flex shrink-0 cursor-pointer items-center rounded-full p-0.5 text-secondary-foreground/70 transition-colors hover:bg-secondary-foreground/15 hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))
        )}
        <ChevronDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
      </div>

      {/* Panel */}
      {open && (
        <div
          id={panelId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-md border border-border bg-white text-sm shadow-md"
        >
          <div className="border-b border-border p-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar..."
              aria-label="Search options"
              className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {options.length === 0 ? (
              <p className="px-2 py-6 text-center text-muted-foreground">
                {emptyMessage}
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-muted-foreground">
                No results found
              </p>
            ) : (
              filtered.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <CheckIcon className="size-4 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
