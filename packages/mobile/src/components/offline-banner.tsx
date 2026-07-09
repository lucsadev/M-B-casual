/**
 * OfflineBanner — Global connectivity indicator.
 *
 * Slides in from the top when the device loses internet connection.
 * Displays "Sin conexión — Mostrando datos guardados" in an amber banner.
 * Disappears automatically when connectivity is restored.
 */
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useNetworkStatus } from '../hooks/use-network';

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isConnected ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, slideAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#F59E0B',
        paddingVertical: 10,
        paddingHorizontal: 16,
      }}
    >
      <Text className="text-center text-white font-semibold text-sm">
        Sin conexión — Mostrando datos guardados
      </Text>
    </Animated.View>
  );
}
