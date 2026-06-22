import { useContext } from 'react';
import { StoreSettingsContext } from '../context/StoreSettingsContext.jsx';

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  }
  return ctx;
}
