/**
 * VariantManager — Inline CRUD for product variants.
 *
 * Uses react-hook-form useFieldArray to manage a dynamic list of
 * variant rows. Each row has: talle, color, color_hex, stock, SKU.
 */
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function VariantManager() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Variantes</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              size: '',
              color: '',
              color_hex: '#000000',
              stock: 0,
              sku: '',
            })
          }
        >
          + Agregar variante
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-[#1A1A1A]/50">
          Sin variantes. Agregá al menos una para que el producto
          tenga stock disponible.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-wrap items-end gap-3 rounded-md border border-[#E8E4D9] p-4"
          >
            <div className="space-y-1">
              <Label className="text-xs">Talle</Label>
              <Input
                {...register(`variants.${index}.size`)}
                placeholder="S, M, L, XL..."
                className="w-20"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input
                {...register(`variants.${index}.color`)}
                placeholder="Negro, Blanco..."
                className="w-28"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Hex</Label>
              <Input
                type="color"
                {...register(`variants.${index}.color_hex`)}
                className="h-9 w-14 p-1"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                placeholder="0"
                className="w-20"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input
                {...register(`variants.${index}.sku`)}
                placeholder="MBT-001"
                className="w-28"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => remove(index)}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
