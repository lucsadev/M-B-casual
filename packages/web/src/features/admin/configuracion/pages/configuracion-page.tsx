/**
 * ConfiguracionPage — Unified admin settings page with tabs.
 *
 * Route: /admin/configuracion
 *
 * Groups all site-wide settings under one page with tabbed sections:
 *   - Envíos: shipping cost + free-shipping minimum
 *   - Transferencia: bank transfer details for customers
 *
 * Future settings sections (e.g. notifications, payments) can be added as
 * new tabs without creating new sidebar items.
 */
import { useEffect, useState } from 'react';
import { useShippingSettings } from '@/features/shipping/hooks/use-shipping-settings';
import { useUpdateShippingSettings } from '@/features/admin/shipping/api/use-update-shipping-settings';
import { useBankTransferSettings } from '@/features/shipping/hooks/use-bank-transfer-settings';
import { useUpdateBankTransferSettings } from '@/features/admin/bank-transfer/api/use-update-bank-transfer-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Truck, Landmark } from 'lucide-react';

type TabId = 'envios' | 'transferencia';

const TABS: { id: TabId; label: string; icon: typeof Truck }[] = [
  { id: 'envios', label: 'Envíos', icon: Truck },
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: Landmark },
];

// ---------------------------------------------------------------------------
// Envíos Tab
// ---------------------------------------------------------------------------

function EnviosTab() {
  const settings = useShippingSettings();
  const { mutate, isPending } = useUpdateShippingSettings();

  const [freeShippingMin, setFreeShippingMin] = useState('0');
  const [shippingCost, setShippingCost] = useState('0');

  useEffect(() => {
    setFreeShippingMin(String(settings.freeShippingMin ?? 0));
    setShippingCost(String(settings.shippingCost ?? 0));
  }, [settings.freeShippingMin, settings.shippingCost]);

  const handleSave = () => {
    const minRaw = freeShippingMin.trim();
    const costRaw = shippingCost.trim();
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
        onError: (err: Error) => toast.error(`Error al guardar: ${err.message}`),
      },
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#1A1A1A]/60">
        Definí el costo de envío y el monto mínimo para envío gratis. Se aplica
        automáticamente en el checkout.
      </p>

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
          Si el subtotal del carrito es mayor o igual a este monto, el envío es
          gratis.
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
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transferencia Bancaria Tab
// ---------------------------------------------------------------------------

function TransferenciaTab() {
  const settings = useBankTransferSettings();
  const { mutate, isPending } = useUpdateBankTransferSettings();

  const [banco, setBanco] = useState('');
  const [titular, setTitular] = useState('');
  const [alias, setAlias] = useState('');
  const [cbu, setCbu] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  useEffect(() => {
    setBanco(settings.banco ?? '');
    setTitular(settings.titular ?? '');
    setAlias(settings.alias ?? '');
    setCbu(settings.cbu ?? '');
    setExtraInfo(settings.extraInfo ?? '');
  }, [settings.banco, settings.titular, settings.alias, settings.cbu, settings.extraInfo]);

  const handleSave = () => {
    if (!titular.trim() && !banco.trim()) {
      toast.error('Ingresá al menos el titular o el banco.');
      return;
    }
    if (!alias.trim() && !cbu.trim()) {
      toast.error('Ingresá el alias o el CBU/CVU.');
      return;
    }

    mutate(
      { banco: banco.trim(), titular: titular.trim(), alias: alias.trim(), cbu: cbu.trim(), extraInfo: extraInfo.trim() },
      {
        onSuccess: () => toast.success('Datos de transferencia guardados'),
        onError: (err: Error) => toast.error(`Error al guardar: ${err.message}`),
      },
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#1A1A1A]/60">
        Datos que se muestran automáticamente al cliente cuando elige
        &ldquo;Transferencia Bancaria&rdquo; como método de pago. Se envían
        también como mensaje in-app en la casilla de mensajes del cliente.
      </p>

      <div className="space-y-2">
        <Label htmlFor="bt-banco">Banco</Label>
        <Input
          id="bt-banco"
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
          placeholder="Ej: Banco Nación"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bt-titular">Titular de la cuenta</Label>
        <Input
          id="bt-titular"
          value={titular}
          onChange={(e) => setTitular(e.target.value)}
          placeholder="Nombre y apellido"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bt-alias">Alias</Label>
          <Input
            id="bt-alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="mi.cuenta.mp"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bt-cbu">CBU / CVU</Label>
          <Input
            id="bt-cbu"
            value={cbu}
            onChange={(e) => setCbu(e.target.value)}
            placeholder="0000000000000000000000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bt-extra">Información adicional (opcional)</Label>
        <Input
          id="bt-extra"
          value={extraInfo}
          onChange={(e) => setExtraInfo(e.target.value)}
          placeholder="Ej: Enviar comprobante a este mismo número"
        />
        <p className="text-xs text-[#1A1A1A]/50">
          Se muestra debajo de los datos de la cuenta en el mensaje.
        </p>
      </div>

      <Button
        onClick={handleSave}
        disabled={isPending}
        className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>('envios');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Configuración</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Administrá las configuraciones generales de la tienda.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-[#E2E2DC] bg-white p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A]/60 hover:bg-[#F0F0EC] hover:text-[#1A1A1A]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="max-w-xl rounded-lg border border-[#E2E2DC] bg-white p-6">
        {activeTab === 'envios' && <EnviosTab />}
        {activeTab === 'transferencia' && <TransferenciaTab />}
      </div>
    </div>
  );
}
