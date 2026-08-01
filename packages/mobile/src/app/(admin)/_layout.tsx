import { useCallback } from 'react';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useIsAdmin } from '../../features/admin/guards/use-is-admin';
import { BrandHeader } from '../../components/BrandHeader';
import { Feather } from '@expo/vector-icons';

const DRAWER_ITEMS = [
  { name: 'index', label: 'Dashboard', icon: 'grid' },
  { name: 'productos', label: 'Productos', icon: 'package' },
  { name: 'ordenes', label: 'Órdenes', icon: 'file-text' },
  { name: 'clientes', label: 'Usuarios', icon: 'users' },
  { name: 'finanzas', label: 'Dashboard Financiero', icon: 'bar-chart' },
  { name: 'caja', label: 'Movimientos de Caja', icon: 'dollar-sign' },
  { name: 'gastos', label: 'Gastos', icon: 'trending-down' },
  { name: 'compras', label: 'Compras', icon: 'shopping-cart' },
  { name: 'preguntas', label: 'Preguntas', icon: 'help-circle' },
];

function DrawerHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="bg-white"
      style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16 }}
    >
      <Text
        style={{ fontFamily: 'CormorantGaramond', fontWeight: '700' }}
        className="text-3xl text-[#1A1A1A]"
      >
        M&B
      </Text>
      <Text
        style={{ fontFamily: 'Montserrat', fontWeight: '300', letterSpacing: 6 }}
        className="text-[10px] text-[#1A1A1A]/60 uppercase"
      >
        Administración
      </Text>
    </View>
  );
}

function DrawerItem({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: string;
  focused: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-4 px-4 py-3.5 rounded-xl mb-0.5 ${
        focused ? 'bg-[#1A1A1A]' : ''
      }`}
    >
      <Feather name={icon as any} size={20} color={focused ? '#FFFFFF' : '#1A1A1A'} />
      <Text
        className={`text-sm font-medium flex-1 ${
          focused ? 'text-white' : 'text-[#1A1A1A]/80'
        }`}
      >
        {label}
      </Text>
      {focused && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
    </TouchableOpacity>
  );
}

function DrawerContent(props: { navigation: any; state: any }) {
  const { navigation, state } = props;
  const closeDrawer = useCallback(() => navigation.closeDrawer(), [navigation]);
  const activeRoute = state?.routes?.[state?.index ?? 0]?.name;

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: '#FFFFFF' }}
    >
      <DrawerHeader />

      <View className="px-3">
        {DRAWER_ITEMS.map((item) => (
          <DrawerItem
            key={item.name}
            label={item.label}
            icon={item.icon}
            focused={activeRoute === item.name}
            onPress={() => {
              navigation.navigate(item.name);
              closeDrawer();
            }}
          />
        ))}
      </View>

      <View className="mt-auto border-t border-[#E2E2DC] px-3 pt-3 pb-4">
        <TouchableOpacity
          onPress={() => {
            navigation.getParent()?.navigate('(tabs)');
            closeDrawer();
          }}
          className="flex-row items-center gap-4 px-4 py-3.5 rounded-xl"
        >
          <Feather name="arrow-left" size={20} color="#1A1A1A" />
          <Text className="text-sm font-medium text-[#1A1A1A]/70">Volver a la tienda</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

function Header({ navigation, subtitle }: { navigation: any; subtitle: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-white" style={{ paddingTop: insets.top, height: insets.top + 140 }}>
      <View className="flex-1 flex-row items-center px-3">
        <View className="w-10 items-start">
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View className="gap-1">
              <View className="h-[2px] w-5 bg-[#1A1A1A] rounded-full" />
              <View className="h-[2px] w-5 bg-[#1A1A1A] rounded-full" />
              <View className="h-[2px] w-5 bg-[#1A1A1A] rounded-full" />
            </View>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <BrandHeader subtitle={subtitle} />
        </View>
        <View className="w-10" />
      </View>
    </View>
  );
}

/**
 * Screens with their own nested layouts (ordenes, clientes, productos)
 * handle headers internally. For all other screens, the Drawer provides
 * a header with hamburger + subtitle via screenOptions.
 */
const NESTED_LAYOUT_SCREENS = ['ordenes', 'clientes', 'productos'];

const SUBTITLES: Record<string, string> = {
  index: 'Dashboard',
  finanzas: 'Dashboard Financiero',
  caja: 'Movimientos de Caja',
  gastos: 'Gastos',
  compras: 'Compras',
  preguntas: 'Preguntas',
};

export default function AdminLayout() {
  const { session } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#D4A853" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-lg font-bold text-[#1A1A1A] mb-2">Acceso denegado</Text>
        <Text className="text-sm text-[#1A1A1A]/60 text-center">
          No tenés permisos de administrador para acceder a esta sección.
        </Text>
      </View>
    );
  }

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={({ route }) => {
        const isNested = NESTED_LAYOUT_SCREENS.includes(route.name);
        return {
          headerShown: !isNested,
          header: ({ navigation }) => (
            <Header navigation={navigation} subtitle={SUBTITLES[route.name] ?? 'Administración'} />
          ),
          drawerStyle: { backgroundColor: '#FFFFFF' },
        };
      }}
    />
  );
}
