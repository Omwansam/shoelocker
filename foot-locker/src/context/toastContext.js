import { createContext } from 'react';

/** @typedef {{ show: (message: string, variant?: 'info'|'success'|'error') => void }} ToastValue */

export const ToastContext = /** @type {import('react').Context<ToastValue | undefined>} */ (
  createContext(undefined)
);
