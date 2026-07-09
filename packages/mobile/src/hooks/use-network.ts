/**
 * useNetworkStatus — Real-time network connectivity hook.
 *
 * Uses @react-native-community/netinfo to subscribe to connectivity changes.
 * Exposes isConnected and connectionType for UI adaptation.
 *
 * @example
 * ```tsx
 * const { isConnected, connectionType } = useNetworkStatus();
 * if (!isConnected) showOfflineBanner();
 * ```
 */
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  connectionType: string | null;
}

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    connectionType: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      setState({
        isConnected: netState.isConnected ?? true,
        connectionType: netState.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
