/**
 * Bottom tabs layout for the mobile app.
 *
 * Tabs: Inicio, Catálogo, Carrito, Perfil
 * Uses Expo Router's TabNavigator with a compact tab bar style.
 *
 * Adaptive navigation:
 * - If user is not authenticated, the Perfil tab shows "Iniciar sesión" instead
 * - Cart tab shows a badge with the total item count
 */
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useCart } from '../../features/cart/hooks/use-cart';

function TabIcon({
  name,
  focused,
  badge,
}: {
  name: string;
  focused: boolean;
  badge?: number;
}) {
  const icons: Record<string, string> = {
    home: focused ? '🏠' : '🏠',
    catalog: focused ? '📋' : '📋',
    cart: focused ? '🛒' : '🛒',
    profile: focused ? '👤' : '👤',
  };

  return (
    <View className="relative">
      <Text className={`text-xl ${focused ? 'opacity-100' : 'opacity-50'}`}>
        {icons[name] ?? '•'}
      </Text>
      {badge != null && badge > 0 && (
        <View className="absolute -top-1 -right-2 h-4 min-w-[16px] rounded-full bg-red-500 items-center justify-center px-1">
          <Text className="text-[10px] font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const { totalItems } = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E8836B',
        tabBarInactiveTintColor: '#1A1A1A/50',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E2DC',
          borderTopWidth: 1,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#1A1A1A',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="catalog" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="cart" focused={focused} badge={totalItems} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: user ? 'Perfil' : 'Ingresar',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}