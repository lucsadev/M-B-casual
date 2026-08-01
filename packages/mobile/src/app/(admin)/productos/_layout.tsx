import { Stack } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BrandHeader } from '../../../components/BrandHeader';

const SUBTITLES: Record<string, string> = {
  index: 'Productos',
  '[id]': 'Editar producto',
};

export default function ProductsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: ({ navigation, route }) => {
          const name = route.name;
          const isDetail = name === '[id]';
          const subtitle = SUBTITLES[name] ?? 'Productos';

          return (
            <View className="bg-white" style={{ paddingTop: insets.top, height: insets.top + 140 }}>
              <View className="flex-1 flex-row items-center px-3">
                <View className="w-10 items-start">
                  {isDetail ? (
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      className="p-2"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="arrow-left" size={22} color="#1A1A1A" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => (navigation as any).getParent()?.toggleDrawer()}
                      className="p-2"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <View className="gap-1">
                        <View className="h-[2px] w-5 bg-[#1A1A1A] rounded-full" />
                        <View className="h-[2px] w-5 bg-[#1A1A1A] rounded-full" />
                        <View className="h-[2px] w-5 bg-[#1A1A1A] rounded-full" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <View className="flex-1 items-center justify-center">
                  <BrandHeader subtitle={subtitle} />
                </View>
                <View className="w-10" />
              </View>
            </View>
          );
        },
      }}
    />
  );
}
