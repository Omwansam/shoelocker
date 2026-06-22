export function notifyStoreSettingsChanged() {
  try {
    globalThis.dispatchEvent(new CustomEvent('shoelocker-settings-changed'));
  } catch {
    //
  }
}
