import { api } from './api.js';

/** @param {string} phone */
export function normalizeKenyaPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

/**
 * @param {{ phone_number: string, order_id: number, amount: number }} payload
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function initiateMpesaPayment(payload, opts = {}) {
  try {
    const res = await api.post(
      '/payments/mpesa/stkpush',
      {
        ...payload,
        phone_number: normalizeKenyaPhone(payload.phone_number),
      },
      { signal: opts.signal },
    );
    return res.data;
  } catch (err) {
    const apiError = err?.response?.data?.error;
    throw new Error(
      typeof apiError === 'string' && apiError
        ? apiError
        : err instanceof Error
          ? err.message
          : 'Could not start M-Pesa payment',
    );
  }
}

/**
 * @param {string} checkoutRequestId
 * @param {{ signal?: AbortSignal, maxAttempts?: number, intervalMs?: number }} [opts]
 */
export async function pollMpesaPaymentStatus(checkoutRequestId, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 30;
  const intervalMs = opts.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (opts.signal?.aborted) {
      throw new Error('Payment polling cancelled');
    }
    const res = await api.get(`/payments/mpesa/status/${checkoutRequestId}`, {
      signal: opts.signal,
    });
    const status = String(res.data?.status || '').toUpperCase();
    if (status === 'COMPLETED' || status === 'SUCCESS') {
      return res.data;
    }
    if (status === 'FAILED' || status === 'NOT_FOUND') {
      throw new Error(res.data?.message || 'M-Pesa payment failed');
    }
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
      opts.signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new Error('Payment polling cancelled'));
        },
        { once: true },
      );
    });
  }
  throw new Error('Payment timed out — check your phone or try again');
}
