/**
 * Admin Shipping Settings Page — configure shipping rules.
 *
 * Route: /admin/envios
 *
 * Lets the admin set:
 * - free_shipping_min: minimum subtotal for free shipping
 * - shipping_cost: shipping charge when the minimum is not reached
 *
 * Saved to the single-row `shipping_settings` table; checkout (web + mobile)
 * reads these values automatically to calculate the shipping cost.
 *
 * UI copy in Spanish (neutral/professional).
 */
import { useEffect, useState } from 'react';
import { useShippingSettings } from '@/features/shipping/hooks/use-shipping-settings';
import { useUpdateShippingSettings } from '../api/use-update-shipping-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function ShippingSettingsPage() {
  const settings = useShippingSettings();
  const { mutate, isPending } = useUpdateShippingSettings();

  const [freeShippingMin, setFreeShippingMin] = useState('0');
  const [shippingCost, setShippingCost] = useState('0');

  // Sync local state once settings load / change
  useEffect(() => {
    setFreeShippingMin(String(settings.freeShippingMin ?? 0));
    setShippingCost(String(settings.shippingCost ?? 0));
  }, [settings.freeShippingMin, settings.shippingCost]);

  const handleSave = () => {
    const minRaw = freeShippingMin.trim();
    const costRaw = shippingCost.trim();

    // numeric(10,2) upper bound: 99,999,999.99
    const MAX_AMOUNT = 99_999_999.99;

    if (!minRaw || !costRaw) {
      toast.error('Completá ambos montos.');
      return;
    }

    const min = Number(minRaw);
    const cost = Number(costRaw);

    if (
      !Number.isFinite(min) || min < 0 || min > MAX_AMOUNT ||
      !Number.isFinite(cost) || cost < 0 || cost > MAX_AMOUNT
    ) {
      toast.error(`Ingresá montos válidos entre 0 y ${MAX_AMOUNT}.`);
      return;
    }

    mutate(
      { freeShippingMin: min, shippingCost: cost },
      {
        onSuccess: () => toast.success('Configuración de envío guardada'),
        onError: (err: Error) =>
          toast.error(`Error al guardar: ${err.message}`),
      },
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Configuración de envío</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Definí el costo de envío y el monto mínimo para envío gratis. Se
          aplica automáticamente en el checkout.
        </p>
      </div>

      {/* Settings form */}
      <div className="max-w-xl rounded-lg border border-[#E2E2DC] bg-white p-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="free-shipping-min">Monto mínimo para envío gratis</Label>
            <Input
              id="free-shipping-min"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={freeShippingMin}
              onChange={(e) => setFreeShippingMin(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-[#1A1A1A]/50">
              Si el subtotal del carrito es mayor o igual a este monto, el
              envío es gratis.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-cost">Costo de envío</Label>
            <Input
              id="shipping-cost"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-[#1A1A1A]/50">
              Monto que se cobra cuando no se alcanza el mínimo.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
          >
            {isPending ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>
    </div>
  );
}
