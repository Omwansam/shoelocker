import { useCallback, useEffect, useMemo, useState } from 'react';
import { SUPPORT_EMAIL } from '../../config/brand.js';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { bulkUpdateSettings, fetchAdminSettings } from '../../utils/api.js';

const CATEGORY_LABELS = {
  regional: 'Regional',
  store: 'Store',
  notifications: 'Notifications',
  payments: 'Payments',
  general: 'General',
};

export function AdminSettings() {
  const { logout } = useAdminAuth();
  const [settings, setSettings] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminSettings();
      const grouped = res?.settings || {};
      setSettings(grouped);
      const flat = {};
      for (const [category, keys] of Object.entries(grouped)) {
        for (const [key, meta] of Object.entries(keys)) {
          flat[`${category}:${key}`] = meta.value;
        }
      }
      setDraft(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const categories = useMemo(
    () => Object.keys(settings).sort(),
    [settings],
  );

  function handleChange(category, key, value) {
    setDraft((prev) => ({ ...prev, [`${category}:${key}`]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updates = [];
      for (const [category, keys] of Object.entries(settings)) {
        for (const [key, meta] of Object.entries(keys)) {
          if (!meta.is_editable) continue;
          const draftKey = `${category}:${key}`;
          const nextVal = draft[draftKey];
          if (nextVal !== meta.value) {
            updates.push({ category, setting_key: key, value: nextVal });
          }
        }
      }
      if (!updates.length) {
        setMessage('No changes to save.');
        return;
      }
      await bulkUpdateSettings(updates);
      setMessage('Settings saved successfully.');
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Store configuration persisted in the backend settings service.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}

      <form onSubmit={handleSave} className="space-y-6">
        {categories.map((category) => (
          <section
            key={category}
            className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-950">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="space-y-4">
              {Object.entries(settings[category] || {}).map(([key, meta]) => {
                const draftKey = `${category}:${key}`;
                const val = draft[draftKey];
                return (
                  <div key={draftKey}>
                    <label className="text-xs font-semibold uppercase text-neutral-500">
                      {key.replace(/_/g, ' ')}
                    </label>
                    {meta.description ? (
                      <p className="mt-0.5 text-[11px] text-neutral-500">{meta.description}</p>
                    ) : null}
                    {meta.type === 'boolean' ? (
                      <select
                        disabled={!meta.is_editable}
                        value={String(val)}
                        onChange={(e) =>
                          handleChange(category, key, e.target.value === 'true')
                        }
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25 disabled:bg-neutral-50"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : meta.type === 'integer' ? (
                      <input
                        type="number"
                        disabled={!meta.is_editable}
                        value={val ?? ''}
                        onChange={(e) =>
                          handleChange(category, key, Number(e.target.value))
                        }
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25 disabled:bg-neutral-50"
                      />
                    ) : (
                      <input
                        type="text"
                        disabled={!meta.is_editable}
                        value={val ?? ''}
                        onChange={(e) => handleChange(category, key, e.target.value)}
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25 disabled:bg-neutral-50"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-950">Security</h2>
        <p className="text-sm text-neutral-600">
          Support escalation:{' '}
          <a className="font-semibold text-brand-red" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <button
          type="button"
          onClick={logout}
          className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Sign out all staff (this browser)
        </button>
      </section>
    </div>
  );
}
