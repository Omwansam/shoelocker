import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';
import { fetchProfile, updateProfile } from '../../utils/api.js';

export function AccountProfile() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    email: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }
      try {
        const user = await fetchProfile();
        if (!active || !user) return;
        setForm((prev) => ({
          ...prev,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: user.phone || '',
          address: user.address || '',
          email: user.email || '',
          username: user.username || '',
        }));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load profile');
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
        <p className="text-neutral-700">Sign in to manage your profile.</p>
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
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        address: form.address,
      };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      setMessage('Profile updated successfully');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-black">Profile details</h2>
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase text-neutral-500">First name</label>
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-neutral-500">Last name</label>
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-neutral-500">Username</label>
        <input value={form.username} disabled className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-500" />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-neutral-500">Email</label>
        <input value={form.email} disabled className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-500" />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-neutral-500">Phone</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-neutral-500">Default address</label>
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-neutral-500">New password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current password" className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
      </div>
      <button type="submit" disabled={saving} className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold uppercase text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
