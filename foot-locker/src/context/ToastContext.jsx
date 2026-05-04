import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './toastContext.js';

/** @param {{ children: React.ReactNode }} props */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState(
    /** @type {{ id: string, message: string, variant: 'info'|'success'|'error' }[]} */ ([]),
  );

  const show = useCallback((message, variant = 'info') => {
    const id =
      typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((t) => [...t, { id, message, variant }]);
    globalThis.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3400);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const variantClass = {
    info: 'bg-neutral-950 text-white',
    success: 'bg-emerald-900 text-white',
    error: 'bg-red-900 text-white',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[130] flex max-w-sm flex-col gap-2 sm:max-w-md"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fade-rise rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${variantClass[t.variant]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
