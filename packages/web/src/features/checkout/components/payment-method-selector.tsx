/**
 * PaymentMethodSelector — Radio group for selecting payment method.
 *
 * Uses inline payment method definitions aligned with the checkoutSchema enum
 * values ('transferencia', 'efectivo', 'mercado_pago').
 */
import type { PaymentMethodId } from '@mbt/shared';

interface PaymentMethodSelectorProps {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
  error?: string;
}

const METHODS: Array<{ id: PaymentMethodId; label: string; icon: string }> = [
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: 'bank' },
  { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
  { id: 'mercado_pago', label: 'Mercado Pago', icon: 'credit-card' },
];

function PaymentIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    bank: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 21h18" />
        <path d="M3 10h18" />
        <path d="M5 6l7-3 7 3" />
        <path d="M4 10v11" />
        <path d="M20 10v11" />
        <path d="M8 14v3" />
        <path d="M12 14v3" />
        <path d="M16 14v3" />
      </svg>
    ),
    cash: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
    'credit-card': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
  };

  return icons[icon] ?? null;
}

export function PaymentMethodSelector({
  value,
  onChange,
  error,
}: PaymentMethodSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
        Método de pago
      </legend>

      <div className="space-y-2">
        {METHODS.map((method) => (
          <label
            key={method.id}
            className={`
              flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors
              ${
                value === method.id
                  ? 'border-[#E8836B] bg-[#E8836B]/5'
                  : 'border-[#E2E2DC] bg-white hover:border-[#E8836B]/50'
              }
            `}
          >
            <input
              type="radio"
              name="payment_method"
              value={method.id}
              checked={value === method.id}
              onChange={() => onChange(method.id)}
              className="h-4 w-4 accent-[#E8836B]"
            />
            <span className="text-[#1A1A1A]/60">
              <PaymentIcon icon={method.icon} />
            </span>
            <div>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {method.label}
              </span>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </fieldset>
  );
}
