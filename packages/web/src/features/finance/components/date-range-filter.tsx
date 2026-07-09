/**
 * Date Range Filter — date range selector with preset buttons.
 *
 * Provides:
 * - Two date inputs (desde / hasta)
 * - Quick preset buttons: "Este mes", "Mes anterior", "Últimos 3 meses",
 *   "Últimos 6 meses", "Este año"
 * - "Aplicar" button to commit the selected range
 *
 * Styled consistently with shadcn/ui patterns.
 */
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateRange {
  from: string; // ISO date string (YYYY-MM-DD)
  to: string;   // ISO date string (YYYY-MM-DD)
}

// ---------------------------------------------------------------------------
// Preset helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

function lastOfMonth(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().split('T')[0];
}

interface Preset {
  label: string;
  getRange: () => DateRange;
}

const PRESETS: Preset[] = [
  {
    label: 'Este mes',
    getRange: () => {
      const now = new Date();
      return {
        from: firstOfMonth(now.getFullYear(), now.getMonth()),
        to: todayISO(),
      };
    },
  },
  {
    label: 'Mes anterior',
    getRange: () => {
      const now = new Date();
      const prevMonth = now.getMonth() - 1;
      const year = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = prevMonth < 0 ? 11 : prevMonth;
      return {
        from: firstOfMonth(year, month),
        to: lastOfMonth(year, month),
      };
    },
  },
  {
    label: 'Últimos 3 meses',
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return {
        from: from.toISOString().split('T')[0],
        to: todayISO(),
      };
    },
  },
  {
    label: 'Últimos 6 meses',
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return {
        from: from.toISOString().split('T')[0],
        to: todayISO(),
      };
    },
  },
  {
    label: 'Este año',
    getRange: () => {
      const now = new Date();
      return {
        from: `${now.getFullYear()}-01-01`,
        to: todayISO(),
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DateRangeFilterProps {
  /** Current date range value */
  value: DateRange;
  /** Callback fired when a new range is committed */
  onChange: (range: DateRange) => void;
}

/**
 * Date range filter with two date inputs and quick presets.
 *
 * The `onChange` callback is fired only when the user clicks "Aplicar"
 * or selects a preset — not while typing.
 */
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [localFrom, setLocalFrom] = useState(value.from);
  const [localTo, setLocalTo] = useState(value.to);

  const handlePreset = useCallback(
    (preset: Preset) => {
      const range = preset.getRange();
      setLocalFrom(range.from);
      setLocalTo(range.to);
      onChange(range);
    },
    [onChange],
  );

  const handleApply = useCallback(() => {
    if (localFrom && localTo) {
      onChange({ from: localFrom, to: localTo });
    }
  }, [localFrom, localTo, onChange]);

  return (
    <div className="rounded-lg border border-[#E8E4D9] bg-white p-4">
      {/* Quick preset buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Date inputs */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label
            htmlFor="date-from"
            className="text-xs font-medium text-[#1A1A1A]/60"
          >
            Desde
          </Label>
          <Input
            id="date-from"
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="flex-1 space-y-1">
          <Label
            htmlFor="date-to"
            className="text-xs font-medium text-[#1A1A1A]/60"
          >
            Hasta
          </Label>
          <Input
            id="date-to"
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleApply}
          disabled={!localFrom || !localTo}
          className="h-9"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
