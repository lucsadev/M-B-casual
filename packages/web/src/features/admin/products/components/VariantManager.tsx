/**
 * VariantManager — Inline CRUD for product variants.
 *
 * Uses react-hook-form useFieldArray to manage a dynamic list of
 * variant rows. Each row has: talle, color, stock.
 */
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
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
      <Label className="text-base">Variantes</Label>

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
            className="flex w-fit flex-nowrap items-end gap-2 rounded-md border border-[#E2E2DC] p-3"
          >
            <div className="space-y-1">
              <Label className="text-xs">Talle</Label>
              <Input
                {...register(`variants.${index}.size`)}
                placeholder="S, M, L, XL..."
                className="w-20!"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input
                {...register(`variants.${index}.color`)}
                placeholder="Negro, Blanco..."
                className="w-28!"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Dto. %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                {...register(`variants.${index}.discount`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
                className="w-16!"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                placeholder="0"
                className="w-20!"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => remove(index)}
              aria-label={`Eliminar variante ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            size: '',
            color: '',
            discount: 0,
            stock: 0,
          })
        }
      >
        + Agregar variante
      </Button>
    </div>
  );
}
