import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_STORE_SETTINGS } from '../config/storeSettingsDefaults.js';
import { fetchStoreSettings } from '../utils/api.js';
import { configureFormatting } from '../utils/format.js';

/** @typedef {typeof DEFAULT_STORE_SETTINGS} StoreSettings */

export const StoreSettingsContext = createContext(
  /** @type {{ settings: StoreSettings, loading: boolean, refresh: () => Promise<void> } | null} */ (
    null
  ),
);

function normalizeSettings(raw) {
  const merged = { ...DEFAULT_STORE_SETTINGS, ...raw };
  const threshold = Number(merged.free_shipping_threshold);
  merged.free_shipping_threshold = Number.isFinite(threshold)
    ? threshold
    : DEFAULT_STORE_SETTINGS.free_shipping_threshold;
  merged.mpesa_enabled = merged.mpesa_enabled !== false;
  merged.cod_enabled = merged.cod_enabled !== false;
  return /** @type {StoreSettings} */ (merged);
}

function applyFormatting(settings) {
  configureFormatting({
    locale: settings.locale || DEFAULT_STORE_SETTINGS.locale,
    currency: settings.currency || DEFAULT_STORE_SETTINGS.currency,
  });
}

/** @param {{ children: import('react').ReactNode }} props */
export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchStoreSettings();
      const next = normalizeSettings(data);
      setSettings(next);
      applyFormatting(next);
    } catch {
      setSettings(DEFAULT_STORE_SETTINGS);
      applyFormatting(DEFAULT_STORE_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChanged = () => {
      void refresh();
    };
    globalThis.addEventListener('shoelocker-settings-changed', onChanged);
    return () => globalThis.removeEventListener('shoelocker-settings-changed', onChanged);
  }, [refresh]);

  const value = useMemo(
    () => ({ settings, loading, refresh }),
    [settings, loading, refresh],
  );

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}
