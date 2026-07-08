/**
 * ShippingForm — React Native shipping address form for mobile checkout.
 *
 * Uses react-hook-form + Zod for validation, mirroring the web ShippingForm.
 */
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { shippingAddressSchema, type ShippingAddressInput } from '@mbt/shared';

interface ShippingFormProps {
  onSubmit: (data: ShippingAddressInput) => void;
}

export function ShippingForm({ onSubmit }: ShippingFormProps) {
  const {
    control,
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
    },
  });

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="gap-4">
        {/* Full name */}
        <View>
          <Text className="mb-1 text-sm font-medium text-[#1A1A1A]">
            Nombre completo
          </Text>
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="rounded-md border border-[#E8E4D9] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
                placeholder="Juan Pérez"
                placeholderTextColor="#1A1A1A/40"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.full_name && (
            <Text className="mt-1 text-xs text-red-500">
              {errors.full_name.message}
            </Text>
          )}
        </View>

        {/* Street */}
        <View>
          <Text className="mb-1 text-sm font-medium text-[#1A1A1A]">
            Dirección
          </Text>
          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="rounded-md border border-[#E8E4D9] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
                placeholder="Calle y número"
                placeholderTextColor="#1A1A1A/40"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.street && (
            <Text className="mt-1 text-xs text-red-500">
              {errors.street.message}
            </Text>
          )}
        </View>

        {/* City + State row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-[#1A1A1A]">
              Ciudad
            </Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-md border border-[#E8E4D9] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
                  placeholder="Buenos Aires"
                  placeholderTextColor="#1A1A1A/40"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.city && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.city.message}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-[#1A1A1A]">
              Provincia
            </Text>
            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-md border border-[#E8E4D9] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
                  placeholder="CABA"
                  placeholderTextColor="#1A1A1A/40"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.state && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.state.message}
              </Text>
            )}
          </View>
        </View>

        {/* Zip code + Phone row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-[#1A1A1A]">
              Código postal
            </Text>
            <Controller
              control={control}
              name="zip_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-md border border-[#E8E4D9] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
                  placeholder="1000"
                  placeholderTextColor="#1A1A1A/40"
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.zip_code && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.zip_code.message}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-[#1A1A1A]">
              Teléfono
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-md border border-[#E8E4D9] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
                  placeholder="+54 11 1234 5678"
                  placeholderTextColor="#1A1A1A/40"
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.phone && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </Text>
            )}
          </View>
        </View>

        {/* Notes */}
        <View>
          <Text className="mb-1 text-sm font-medium text-[#1A1A1A]">
            Notas (opcional)
          </Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="rounded-md border border-[#E8E4D9] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
                placeholder="Indicaciones para el envío"
                placeholderTextColor="#1A1A1A/40"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ''}
              />
            )}
          />
        </View>
      </View>
    </ScrollView>
  );
}
