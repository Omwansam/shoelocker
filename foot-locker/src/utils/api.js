import axios, { CanceledError } from 'axios';
import { mergeCatalogList } from './catalogStorage.js';

/** @param {AbortSignal | undefined} signal */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new CanceledError('Request aborted'));
      return;
    }
    const onAbort = () => {
      clearTimeout(t);
      signal?.removeEventListener('abort', onAbort);
      reject(new CanceledError('Request aborted'));
    };
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(undefined);
    }, ms);
    signal?.addEventListener('abort', onAbort);
  });
}

/** Simulated storefront `/products`; swap `adapter` for a real REST base URL later */
export const api = axios.create({
  baseURL: '/',
});

api.defaults.adapter = async (config) => {
  const delayMs =
    typeof config.customDelayMs === 'number' ? config.customDelayMs : 420;
  await sleep(delayMs, config.signal);

  if (
    config.url === '/products' &&
    (!config.method || config.method.toLowerCase() === 'get')
  ) {
    const list = mergeCatalogList();
    /** @type {axios.AxiosResponse} */
    const response = {
      data: list,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {} /* mock */,
    };
    return response;
  }

  throw new axios.AxiosError('Not found', null, config);
};

/**
 * @param {{ signal?: AbortSignal; delayMs?: number }} [opts]
 * @returns {Promise<ReturnType<typeof mergeCatalogList>>}
 */
export async function fetchProducts(opts = {}) {
  const res = await api.get('/products', {
    signal: opts.signal,
    customDelayMs: opts.delayMs,
  });
  return res.data;
}
