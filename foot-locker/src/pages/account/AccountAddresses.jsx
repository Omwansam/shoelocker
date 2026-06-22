import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '../../hooks/useStoreSettings.js';
import { isLoggedIn } from '../../utils/auth.js';
import { deleteAddress, fetchSavedAddresses, saveAddress } from '../../utils/api.js';

function makeEmptyForm(country) {
  return {
    first_name: '',
    last_name: '',
    country,
    street_address: '',
    city: '',
    province: '',
    zip_code: '',
    phone: '',
    email: '',
    additional_info: '',
    is_default: true,
  };
}

export function AccountAddresses() {
  const { settings } = useStoreSettings();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(() => makeEmptyForm(settings.country));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadAddresses() {
    const list = await fetchSavedAddresses();
    setAddresses(list);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }
      try {
        const list = await fetchSavedAddresses();
        if (active) setAddresses(list);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load addresses');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!isLoggedIn()) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
        <p className="text-neutral-700">Sign in to manage delivery addresses.</p>
        <Link to="/sign-in" className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline">Sign in</Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await saveAddress(form);
      await loadAddresses();
      setForm(makeEmptyForm(settings.country));
      setMessage('Address saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,1fr]">
      <div>
        <h2 className="text-xl font-semibold text-black">Saved addresses</h2>
        {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {!addresses.length ? (
          <p className="mt-4 text-sm text-neutral-600">No saved addresses yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {addresses.map((addr) => (
              <li key={addr.id} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
                <p className="font-semibold text-black">{addr.first_name} {addr.last_name}{addr.is_default ? ' · Default' : ''}</p>
                <p className="mt-1 text-neutral-700">{addr.street_address}</p>
                <p className="text-neutral-600">{addr.city}, {addr.province} {addr.zip_code}</p>
                <p className="text-neutral-600">{addr.phone}</p>
                <button type="button" onClick={() => handleDelete(addr.id)} className="mt-3 text-xs font-semibold text-brand-red hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black">Add address</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          <input required placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        </div>
        <input required placeholder="Street address" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          <input required placeholder="County" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        </div>
        <input required placeholder="Postal code" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        <input required type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
          Set as default address
        </label>
        <button type="submit" disabled={saving} className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold uppercase text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save address'}
        </button>
      </form>
    </div>
  );
}
