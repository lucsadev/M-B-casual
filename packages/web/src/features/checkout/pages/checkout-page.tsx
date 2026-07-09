/**
 * CheckoutPage — Two-column checkout page at /checkout.
 *
 * Left column: shipping form + payment method selector
 * Right column: order summary (read-only)
 *
 * Submits via useCheckout() mutation which calls create_order_from_cart RPC.
 * On success, redirects to /gracias/:orderId.
 */
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ShippingAddressInput, PaymentMethodId } from '@mbt/shared';
import { useCartContext } from '@/features/cart/context/CartContext';
import { useCheckout } from '../hooks/useCheckout';
import { ShippingForm } from '../components/shipping-form';
import { PaymentMethodSelector } from '../components/payment-method-selector';
import { OrderSummary } from '../components/order-summary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function CheckoutPage() {
  const { items, summary, isLoading } = useCartContext();
  const { mutate: checkout, isPending: isCheckingOut } = useCheckout();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('transferencia');
  const [shippingData, setShippingData] = useState<ShippingAddressInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleShippingSubmit = useCallback(
    (data: ShippingAddressInput) => {
      setShippingData(data);
      setFormError(null);
    },
    [],
  );

  const handleConfirmOrder = useCallback(() => {
    if (!shippingData) {
      setFormError('Completá los datos de envío antes de confirmar.');
      return;
    }

    checkout({
      shipping_address: shippingData,
      payment_method: paymentMethod,
    });
  }, [shippingData, paymentMethod, checkout]);

  // Loading state
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  // Empty cart — redirect to cart page
  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-[#1A1A1A]">
          Tu carrito está vacío
        </h1>
        <p className="mb-8 text-[#1A1A1A]/60">
          Agregá productos al carrito antes de iniciar el checkout.
        </p>
        <Link
          to="/carrito"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8836B] px-6 text-sm font-medium text-white transition-colors hover:bg-[#E8836B]/90"
        >
          Ir al carrito
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Checkout</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Completá tus datos para finalizar la compra
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left column: form */}
        <div className="space-y-8 lg:col-span-3">
          {/* Shipping form */}
          <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">
              Datos de envío
            </h2>
            <ShippingForm onSubmit={handleShippingSubmit} />
          </div>

          {/* Payment method selector */}
          <div className="rounded-lg border border-[#E2E2DC] bg-white p-6">
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>
        </div>

        {/* Right column: summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-8 space-y-6">
            <OrderSummary items={items} summary={summary} />

            {/* Error message */}
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {/* Confirm button */}
            <Button
              size="lg"
              onClick={handleConfirmOrder}
              disabled={isCheckingOut || !shippingData}
              className="w-full bg-[#E8836B] text-white hover:bg-[#E8836B]/90 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Procesando...
                </span>
              ) : (
                'Confirmar orden'
              )}
            </Button>

            <p className="text-center text-xs text-[#1A1A1A]/40">
              Al confirmar, aceptás nuestros términos y condiciones.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
