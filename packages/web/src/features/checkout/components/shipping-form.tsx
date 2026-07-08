/**
 * ShippingForm — React Hook Form + Zod validated shipping address form.
 *
 * Renders fields for: full name, street, city, state, zip code, phone, and optional notes.
 * Uses `shippingAddressSchema` from @mbt/shared for validation.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shippingAddressSchema, type ShippingAddressInput } from '@mbt/shared';

interface ShippingFormProps {
  onSubmit: (data: ShippingAddressInput) => void;
  defaultValues?: Partial<ShippingAddressInput>;
}

export function ShippingForm({ onSubmit, defaultValues }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      full_name: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      notes: '',
      ...defaultValues,
    },
  });

  return (
    <form id="shipping-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full name */}
      <div>
        <label
          htmlFor="full_name"
          className="mb-1 block text-sm font-medium text-[#1A1A1A]"
        >
          Nombre completo
        </label>
        <input
          id="full_name"
          type="text"
          {...register('full_name')}
          className="w-full rounded-md border border-[#E8E4D9] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
          placeholder="Juan Pérez"
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      {/* Street */}
      <div>
        <label
          htmlFor="street"
          className="mb-1 block text-sm font-medium text-[#1A1A1A]"
        >
          Dirección
        </label>
        <input
          id="street"
          type="text"
          {...register('street')}
          className="w-full rounded-md border border-[#E8E4D9] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
          placeholder="Calle y número"
        />
        {errors.street && (
          <p className="mt-1 text-xs text-red-500">{errors.street.message}</p>
        )}
      </div>

      {/* City + State row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="city"
            className="mb-1 block text-sm font-medium text-[#1A1A1A]"
          >
            Ciudad
          </label>
          <input
            id="city"
            type="text"
            {...register('city')}
            className="w-full rounded-md border border-[#E8E4D9] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
            placeholder="Buenos Aires"
          />
          {errors.city && (
            <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="state"
            className="mb-1 block text-sm font-medium text-[#1A1A1A]"
          >
            Provincia
          </label>
          <input
            id="state"
            type="text"
            {...register('state')}
            className="w-full rounded-md border border-[#E8E4D9] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
            placeholder="CABA"
          />
          {errors.state && (
            <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>
          )}
        </div>
      </div>

      {/* Zip code + Phone row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="zip_code"
            className="mb-1 block text-sm font-medium text-[#1A1A1A]"
          >
            Código postal
          </label>
          <input
            id="zip_code"
            type="text"
            {...register('zip_code')}
            className="w-full rounded-md border border-[#E8E4D9] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
            placeholder="1000"
          />
          {errors.zip_code && (
            <p className="mt-1 text-xs text-red-500">{errors.zip_code.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-[#1A1A1A]"
          >
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="w-full rounded-md border border-[#E8E4D9] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
            placeholder="+54 11 1234 5678"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Notes (optional) */}
      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-[#1A1A1A]"
        >
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          rows={2}
          {...register('notes')}
          className="w-full rounded-md border border-[#E8E4D9] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853] resize-none"
          placeholder="Indicaciones para el envío"
        />
      </div>
    </form>
  );
}
