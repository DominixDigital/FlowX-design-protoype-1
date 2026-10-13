import AsyncStorage from '@react-native-async-storage/async-storage';
import { setApiBase, setKV } from 'ditcore/core/platform';

const PREFIX = 'ditdit-proto-v2';

// Hermes may not ship structuredClone; the demo data is JSON-safe.
if (typeof (globalThis as { structuredClone?: unknown }).structuredClone !== 'function') {
  (globalThis as { structuredClone?: unknown }).structuredClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
}

/**
 * The shared store reads storage synchronously, AsyncStorage is async: load everything once into memory
 * before the first render, then write through.
 */
export async function initPlatform() {
  const mem = new Map<string, string>();
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) if (v != null) mem.set(k, v);
  } catch {
    /* storage unavailable: the app keeps working in memory */
  }
  setKV({
    get: (k) => mem.get(k) ?? null,
    set: (k, v) => {
      mem.set(k, v);
      AsyncStorage.setItem(k, v).catch(() => {});
    },
  });
  setApiBase(process.env.EXPO_PUBLIC_API_BASE || 'https://ditdit-staging-dominix-digital.vercel.app');
}
