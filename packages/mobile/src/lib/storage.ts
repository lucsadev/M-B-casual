/**
 * AsyncStorage-based persistence helpers for TanStack Query.
 *
 * Uses @react-native-async-storage/async-storage as the storage backend
 * for offline cache persistence on mobile.
 *
 * The persister is created via createAsyncStoragePersister from
 * @tanstack/query-async-storage-persister and exported for use
 * in persistQueryClient setup.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * Cache version key — bump to invalidate all cached queries on upgrade.
 */
export const CACHE_KEY = 'mbt-cache-v1';

/**
 * Async storage persister backed by AsyncStorage.
 * Persists only catalog queries (products, categories) — mutations
 * and auth queries are excluded via meta flags.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  throttleTime: 1000,
});
