import { useCallback, useEffect, useState } from 'react';
import {
  deleteAdminBlogPost,
  fetchAdminBlogPosts,
  fetchAdminBlogStats,
  updateAdminBlogPost,
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

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export function AdminContent() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [postsRes, statsRes] = await Promise.all([
        fetchAdminBlogPosts({
          search: search || undefined,
          status: statusFilter,
          per_page: 30,
        }),
        fetchAdminBlogStats().catch(() => null),
      ]);
      setPosts(postsRes.blogs || []);
      setStats(statsRes?.stats || statsRes || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleTogglePublish(post) {
    try {
      await updateAdminBlogPost(post.id, { is_published: !post.is_published });
      setMessage(post.is_published ? 'Moved to draft' : 'Published');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    }
  }

  async function handleDelete(postId) {
    if (!globalThis.confirm('Delete this post permanently?')) return;
    try {
      await deleteAdminBlogPost(postId);
      setMessage('Post deleted');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Content"
        description="Blog posts, drops stories, and SEO pages for the ShoeLocker storefront."
        badge={
          stats ? (
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
              {stats.published_posts ?? stats.total_posts ?? posts.length} published
            </span>
          ) : null
        }
      />

      {error ? <AdminAlert>{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminCard className="admin-stat-card">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total posts</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.total_posts ?? posts.length}</p>
        </AdminCard>
        <AdminCard className="admin-stat-card">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Published</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
            {stats?.published_posts ?? posts.filter((p) => p.is_published).length}
          </p>
        </AdminCard>
        <AdminCard className="admin-stat-card">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total views</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.total_views ?? '—'}</p>
        </AdminCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <AdminInput
          id="content-search"
          className="max-w-xs flex-1"
          placeholder="Search titles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium"
        >
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {loading ? (
        <AdminLoading label="Loading content…" />
      ) : (
        <AdminCard padding={false}>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <AdminTh>Title</AdminTh>
                <AdminTh>Category</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh className="text-right">Views</AdminTh>
                <AdminTh>Updated</AdminTh>
                <AdminTh />
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <AdminTd>
                    <p className="max-w-xs truncate font-semibold text-neutral-950">{post.title}</p>
                    <p className="text-xs text-neutral-500">/{post.slug}</p>
                  </AdminTd>
                  <AdminTd className="capitalize">{post.category || '—'}</AdminTd>
                  <AdminTd>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        post.is_published
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {post.is_published ? 'Live' : 'Draft'}
                    </span>
                  </AdminTd>
                  <AdminTd className="text-right tabular-nums">{post.view_count ?? 0}</AdminTd>
                  <AdminTd className="text-sm text-neutral-600">{formatDate(post.updated_at || post.date_posted)}</AdminTd>
                  <AdminTd className="text-right">
                    <div className="flex justify-end gap-1">
                      <AdminButton variant="ghost" type="button" onClick={() => handleTogglePublish(post)}>
                        {post.is_published ? 'Unpublish' : 'Publish'}
                      </AdminButton>
                      <AdminButton variant="ghost" type="button" onClick={() => handleDelete(post.id)}>
                        Delete
                      </AdminButton>
                    </div>
                  </AdminTd>
                </tr>
              ))}
            </AdminTableBody>
          </AdminTable>
          {!posts.length ? (
            <p className="p-8 text-center text-sm text-neutral-500">No posts match your filters.</p>
          ) : null}
        </AdminCard>
      )}
    </AdminPage>
  );
}
