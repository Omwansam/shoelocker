import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../../utils/format.js';
import {
  createAdminSupplier,
  deleteAdminSupplier,
  fetchAdminSuppliers,
  updateAdminSupplier,
} from '../../utils/api.js';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';
import { AdminButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminInput } from '../../components/admin/ui/AdminInput.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  AdminTd,
  AdminTh,
} from '../../components/admin/ui/AdminTable.jsx';

const EMPTY = {
  name: '',
  category: 'footwear',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  status: 'active',
};

export function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminSuppliers({ search: search || undefined, per_page: 50 });
      setSuppliers(data.suppliers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(s) {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      category: s.category || 'footwear',
      contact_person: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      status: s.status || 'active',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateAdminSupplier(editingId, form);
        setMessage('Supplier updated');
      } else {
        await createAdminSupplier(form);
        setMessage('Supplier added');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!globalThis.confirm('Remove this supplier?')) return;
    try {
      await deleteAdminSupplier(id);
      setMessage('Supplier removed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Suppliers"
        description="Vendor directory for sourcing, replenishment, and purchase tracking."
        badge={
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
            {suppliers.length} vendors
          </span>
        }
        actions={
          <AdminButton variant="primary" type="button" onClick={openCreate}>
            Add supplier
          </AdminButton>
        }
      />

      {error ? <AdminAlert>{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <AdminInput
        id="supplier-search"
        className="max-w-md"
        placeholder="Search suppliers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showForm ? (
        <AdminCard title={editingId ? 'Edit supplier' : 'New supplier'}>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <AdminInput id="sup-name" label="Company name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <AdminInput id="sup-cat" label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            <AdminInput id="sup-contact" label="Contact person" required value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} />
            <AdminInput id="sup-email" label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <AdminInput id="sup-phone" label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <AdminInput id="sup-address" label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            <div className="flex gap-2 sm:col-span-2">
              <AdminButton variant="primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </AdminButton>
              <AdminButton variant="ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      ) : null}

      {loading ? (
        <AdminLoading label="Loading suppliers…" />
      ) : (
        <AdminCard padding={false}>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <AdminTh>Supplier</AdminTh>
                <AdminTh>Category</AdminTh>
                <AdminTh className="text-right">SKUs</AdminTh>
                <AdminTh className="text-right">Spend</AdminTh>
                <AdminTh />
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <AdminTd>
                    <p className="font-semibold text-neutral-950">{s.name}</p>
                    <p className="text-xs text-neutral-500">{s.contact_person} · {s.email}</p>
                  </AdminTd>
                  <AdminTd className="capitalize">{s.category}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{s.products ?? 0}</AdminTd>
                  <AdminTd className="text-right tabular-nums">{formatPrice(s.total_spent || 0)}</AdminTd>
                  <AdminTd className="text-right">
                    <div className="flex justify-end gap-1">
                      <AdminButton variant="ghost" type="button" onClick={() => openEdit(s)}>
                        Edit
                      </AdminButton>
                      <AdminButton variant="ghost" type="button" onClick={() => handleDelete(s.id)}>
                        Delete
                      </AdminButton>
                    </div>
                  </AdminTd>
                </tr>
              ))}
            </AdminTableBody>
          </AdminTable>
          {!suppliers.length ? (
            <p className="p-8 text-center text-sm text-neutral-500">No suppliers yet.</p>
          ) : null}
        </AdminCard>
      )}
    </AdminPage>
  );
}
