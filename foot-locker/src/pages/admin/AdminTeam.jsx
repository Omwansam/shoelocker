import { useCallback, useEffect, useState } from 'react';
import {
  createAdminUser,
  fetchAdminUsers,
  toggleAdminUserStatus,
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

const ROLES = ['admin', 'manager', 'staff', 'user'];

function formatRole(role) {
  const raw = String(role || 'user');
  const name = raw.includes('.') ? raw.split('.').pop() : raw;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function AdminTeam() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff',
    first_name: '',
    last_name: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        per_page: 50,
      });
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 200);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleInvite(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAdminUser(form);
      setMessage(`Invited ${form.email}`);
      setShowInvite(false);
      setForm({ username: '', email: '', password: '', role: 'staff', first_name: '', last_name: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(userId) {
    try {
      await toggleAdminUserStatus(userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  const staffCount = users.filter((u) => u.is_active).length;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Team"
        description="Staff accounts, roles, and access for PulseDesk."
        badge={
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-brand-red">
            {staffCount} active
          </span>
        }
        actions={
          <AdminButton variant="primary" type="button" onClick={() => setShowInvite(true)}>
            Invite staff
          </AdminButton>
        }
      />

      {error ? <AdminAlert>{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <div className="flex flex-wrap gap-3">
        <AdminInput
          id="team-search"
          className="max-w-xs flex-1"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {formatRole(r)}
            </option>
          ))}
        </select>
      </div>

      {showInvite ? (
        <AdminCard title="Invite staff member">
          <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              id="inv-username"
              label="Username"
              required
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
            <AdminInput
              id="inv-email"
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <AdminInput
              id="inv-password"
              label="Temporary password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <div>
              <label htmlFor="inv-role" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Role
              </label>
              <select
                id="inv-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {formatRole(r)}
                  </option>
                ))}
              </select>
            </div>
            <AdminInput
              id="inv-first"
              label="First name"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
            <AdminInput
              id="inv-last"
              label="Last name"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
            <div className="flex gap-2 sm:col-span-2">
              <AdminButton variant="primary" type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create account'}
              </AdminButton>
              <AdminButton variant="ghost" type="button" onClick={() => setShowInvite(false)}>
                Cancel
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      ) : null}

      {loading ? (
        <AdminLoading label="Loading team…" />
      ) : (
        <AdminCard padding={false}>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <AdminTh>Member</AdminTh>
                <AdminTh>Role</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh className="text-right">Orders</AdminTh>
                <AdminTh />
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {users.map((u) => (
                <tr key={u.id}>
                  <AdminTd>
                    <p className="font-semibold text-neutral-950">
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}
                    </p>
                    <p className="text-xs text-neutral-500">{u.email}</p>
                  </AdminTd>
                  <AdminTd>
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-brand-red">
                      {formatRole(u.role)}
                    </span>
                  </AdminTd>
                  <AdminTd>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </AdminTd>
                  <AdminTd className="text-right tabular-nums">{u.total_orders ?? 0}</AdminTd>
                  <AdminTd className="text-right">
                    <AdminButton variant="ghost" type="button" onClick={() => handleToggle(u.id)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </AdminButton>
                  </AdminTd>
                </tr>
              ))}
            </AdminTableBody>
          </AdminTable>
          {!users.length ? (
            <p className="p-8 text-center text-sm text-neutral-500">No team members match your filters.</p>
          ) : null}
        </AdminCard>
      )}
    </AdminPage>
  );
}
