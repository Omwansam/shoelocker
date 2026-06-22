import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../../config/brand.js';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { bulkUpdateSettings, fetchAdminSettings } from '../../utils/api.js';
import { notifyStoreSettingsChanged } from '../../utils/storeSettingsEvents.js';
import { formatPrice } from '../../utils/format.js';
import { AdminIcon } from '../../components/admin/AdminIcons.jsx';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';
import { AdminButton, AdminLinkButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminInput } from '../../components/admin/ui/AdminInput.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';

const CATEGORY_ORDER = ['store', 'regional', 'payments', 'notifications', 'general'];

const CATEGORY_META = {
  store: {
    label: 'Store',
    description: 'Shipping rules, support contact, and storefront defaults.',
    icon: 'products',
  },
  regional: {
    label: 'Regional',
    description: 'Market country, currency, and locale for pricing display.',
    icon: 'storefront',
  },
  payments: {
    label: 'Payments',
    description: 'Checkout payment methods available to customers.',
    icon: 'orders',
  },
  notifications: {
    label: 'Notifications',
    description: 'Transactional email and customer communication.',
    icon: 'analytics',
  },
  general: {
    label: 'General',
    description: 'Miscellaneous store configuration.',
    icon: 'settings',
  },
};

const SETTING_LABELS = {
  country: 'Country',
  currency: 'Currency',
  locale: 'Locale',
  free_shipping_threshold: 'Free shipping minimum',
  support_email: 'Support email',
  order_confirmation_email: 'Order confirmations',
  mpesa_enabled: 'M-Pesa',
  cod_enabled: 'Cash on delivery',
};

function formatSettingLabel(key) {
  return SETTING_LABELS[key] || key.replace(/_/g, ' ');
}

function SettingsToggle({ checked, disabled, onChange, label, description }) {
  return (
    <label
      className={`flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 transition ${
        disabled ? 'opacity-60' : 'cursor-pointer hover:border-neutral-300 hover:bg-neutral-50'
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 ${
          checked ? 'bg-brand-red' : 'bg-neutral-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${
            checked ? 'left-[1.35rem]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

function OverviewCard({ label, value, hint, accent = 'neutral' }) {
  const accents = {
    neutral: 'border-neutral-200 bg-white',
    red: 'border-brand-red/20 bg-brand-red/5',
    emerald: 'border-emerald-200 bg-emerald-50/50',
    sky: 'border-sky-200 bg-sky-50/50',
  };
  return (
    <div className={`rounded-2xl border p-4 ${accents[accent]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1.5 text-lg font-bold tabular-nums text-neutral-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function StatusPill({ on, label }) {
  return (
    <span
      className={
        on
          ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800'
          : 'inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600'
      }
    >
      <span className={`size-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
      {label}
    </span>
  );
}

export function AdminSettings() {
  const { session, logout } = useAdminAuth();
  const [settings, setSettings] = useState({});
  const [draft, setDraft] = useState({});
  const [activeCategory, setActiveCategory] = useState('store');
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
      const first = CATEGORY_ORDER.find((c) => grouped[c]) || Object.keys(grouped)[0];
      if (first) setActiveCategory(first);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const categories = useMemo(() => {
    const keys = Object.keys(settings);
    return [
      ...CATEGORY_ORDER.filter((c) => keys.includes(c)),
      ...keys.filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
    ];
  }, [settings]);

  const hasChanges = useMemo(() => {
    for (const [category, keys] of Object.entries(settings)) {
      for (const [key, meta] of Object.entries(keys)) {
        if (!meta.is_editable) continue;
        const draftKey = `${category}:${key}`;
        if (draft[draftKey] !== meta.value) return true;
      }
    }
    return false;
  }, [settings, draft]);

  const draftVal = (category, key) => draft[`${category}:${key}`];

  const overview = useMemo(
    () => ({
      country: draftVal('regional', 'country') ?? '—',
      currency: draftVal('regional', 'currency') ?? 'KES',
      freeShipping: draftVal('store', 'free_shipping_threshold'),
      mpesa: Boolean(draftVal('payments', 'mpesa_enabled')),
      cod: Boolean(draftVal('payments', 'cod_enabled')),
      supportEmail: draftVal('store', 'support_email') || SUPPORT_EMAIL,
    }),
    [draft],
  );

  function handleChange(category, key, value) {
    setDraft((prev) => ({ ...prev, [`${category}:${key}`]: value }));
    setMessage('');
  }

  function handleDiscard() {
    const flat = {};
    for (const [category, keys] of Object.entries(settings)) {
      for (const [key, meta] of Object.entries(keys)) {
        flat[`${category}:${key}`] = meta.value;
      }
    }
    setDraft(flat);
    setMessage('Changes discarded.');
    setError('');
  }

  async function handleSave(e) {
    e?.preventDefault();
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
      notifyStoreSettingsChanged();
      setMessage(`Saved ${updates.length} setting${updates.length === 1 ? '' : 's'}. Storefront updated.`);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AdminLoading label="Loading settings…" />;

  const activeMeta = CATEGORY_META[activeCategory] || {
    label: activeCategory,
    description: 'Store configuration',
    icon: 'settings',
  };
  const activeFields = Object.entries(settings[activeCategory] || {});

  return (
    <AdminPage className="space-y-8 pb-24">
      <AdminPageHeader
        title="Settings"
        description="Configure store rules, payments, and notifications. Changes apply to checkout and the storefront."
        badge={
          hasChanges ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Unsaved changes
            </span>
          ) : null
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {hasChanges ? (
              <AdminButton type="button" variant="ghost" onClick={handleDiscard} disabled={saving}>
                Discard
              </AdminButton>
            ) : null}
            <AdminButton variant="primary" type="button" onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? 'Saving…' : 'Save changes'}
            </AdminButton>
          </div>
        }
      />

      {error ? <AdminAlert>{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard label="Market" value={overview.country} hint={`Currency: ${overview.currency}`} accent="sky" />
        <OverviewCard
          label="Free shipping"
          value={
            overview.freeShipping != null && overview.freeShipping !== ''
              ? formatPrice(Number(overview.freeShipping))
              : '—'
          }
          hint="Minimum order value"
          accent="emerald"
        />
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Payment methods</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill on={overview.mpesa} label="M-Pesa" />
            <StatusPill on={overview.cod} label="COD" />
          </div>
        </div>
        <OverviewCard
          label="Support"
          value={
            <a href={`mailto:${overview.supportEmail}`} className="text-base text-brand-red hover:underline">
              {overview.supportEmail}
            </a>
          }
          hint="Customer-facing contact"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr] xl:grid-cols-[16rem_1fr]">
        <nav className="space-y-1 lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Sections</p>
          {categories.map((category) => {
            const meta = CATEGORY_META[category] || { label: category, icon: 'settings' };
            const active = activeCategory === category;
            const fieldCount = Object.keys(settings[category] || {}).length;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={
                  active
                    ? 'flex w-full items-center gap-3 rounded-xl bg-neutral-950 px-3 py-3 text-left text-white shadow-sm'
                    : 'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-neutral-700 transition hover:bg-neutral-100'
                }
              >
                <span className={active ? 'text-white/90' : 'text-neutral-500'}>
                  <AdminIcon name={meta.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{meta.label}</span>
                  <span className={`block text-[11px] ${active ? 'text-white/60' : 'text-neutral-500'}`}>
                    {fieldCount} field{fieldCount === 1 ? '' : 's'}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <form onSubmit={handleSave} className="space-y-6">
          <AdminCard
            title={activeMeta.label}
            subtitle={activeMeta.description}
            action={
              <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                {activeCategory}
              </span>
            }
          >
            <div className="space-y-5">
              {activeFields.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">No settings in this section.</p>
              ) : (
                activeFields.map(([key, meta]) => {
                  const val = draft[`${activeCategory}:${key}`];
                  const label = formatSettingLabel(key);

                  if (meta.type === 'boolean') {
                    return (
                      <SettingsToggle
                        key={key}
                        label={label}
                        description={meta.description}
                        checked={Boolean(val)}
                        disabled={!meta.is_editable}
                        onChange={(next) => handleChange(activeCategory, key, next)}
                      />
                    );
                  }

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{label}</p>
                          {meta.description ? (
                            <p className="mt-0.5 text-xs text-neutral-500">{meta.description}</p>
                          ) : null}
                        </div>
                        {!meta.is_editable ? (
                          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500">
                            Read only
                          </span>
                        ) : null}
                      </div>
                      {meta.type === 'integer' ? (
                        <AdminInput
                          type="number"
                          disabled={!meta.is_editable}
                          value={val ?? ''}
                          onChange={(e) => handleChange(activeCategory, key, Number(e.target.value))}
                        />
                      ) : (
                        <AdminInput
                          type="text"
                          disabled={!meta.is_editable}
                          value={val ?? ''}
                          onChange={(e) => handleChange(activeCategory, key, e.target.value)}
                        />
                      )}
                      {meta.updated_at ? (
                        <p className="mt-2 text-[11px] text-neutral-400">
                          Last updated {new Date(meta.updated_at).toLocaleString('en-KE')}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </AdminCard>

          <div className="grid gap-6 md:grid-cols-2">
            <AdminCard title="Staff session" subtitle="Signed-in administrator on this device">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-lg font-bold text-white">
                  {(session?.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{session?.email || 'Admin'}</p>
                  <p className="text-xs text-neutral-500">Operations console access</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <AdminButton variant="secondary" onClick={logout}>
                  Sign out
                </AdminButton>
                <AdminLinkButton variant="ghost" href="/">
                  View storefront
                </AdminLinkButton>
              </div>
            </AdminCard>

            <AdminCard title="Need help?" subtitle="Escalation and platform support">
              <p className="text-sm leading-relaxed text-neutral-600">
                For billing, integrations, or account issues contact{' '}
                <a className="font-semibold text-brand-red hover:underline" href={`mailto:${overview.supportEmail}`}>
                  {overview.supportEmail}
                </a>
                . Store settings here affect checkout totals, payment options, and customer emails only.
              </p>
              <p className="mt-4 text-xs text-neutral-500">
                Tip: after changing free-shipping threshold or payment methods, verify on{' '}
                <Link to="/checkout" className="font-medium text-neutral-700 underline">
                  checkout
                </Link>{' '}
                in an incognito window.
              </p>
            </AdminCard>
          </div>
        </form>
      </div>

      {hasChanges ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgb(0_0_0/0.08)] backdrop-blur sm:px-6 lg:left-[17.5rem]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="text-sm text-neutral-600">
              You have <span className="font-semibold text-neutral-900">unsaved changes</span> in store settings.
            </p>
            <div className="flex shrink-0 gap-2">
              <AdminButton variant="ghost" onClick={handleDiscard} disabled={saving}>
                Discard
              </AdminButton>
              <AdminButton variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPage>
  );
}
