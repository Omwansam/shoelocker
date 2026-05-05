/** Staff console config. */

/** No-op: app no longer persists state in browser storage. */
export function resetAdminPersistedDemo() {
  return undefined;
}

/** Backward-compatible legacy helper. */
export function getAdminDemoPassword() {
  return 'Managed by backend auth';
}
