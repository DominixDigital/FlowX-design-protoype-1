/**
 * Platform seams for code shared by the web prototype (src/) and the Expo app (mobile/).
 * Defaults are the browser's; the mobile entry replaces them at startup.
 */

export interface KV {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

const browserKV: KV = {
  get: (k) => (globalThis as { localStorage?: Storage }).localStorage?.getItem(k) ?? null,
  set: (k, v) => (globalThis as { localStorage?: Storage }).localStorage?.setItem(k, v),
};

let kv: KV = browserKV;
export const getKV = () => kv;
export const setKV = (next: KV) => { kv = next; };

/** Base URL for the serverless API. Empty on web (same origin); absolute in the native app. */
let apiBase = '';
export const getApiBase = () => apiBase;
export const setApiBase = (url: string) => { apiBase = url.replace(/\/$/, ''); };
