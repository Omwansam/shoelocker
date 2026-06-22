import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format.js';
import { resolveProductImageUrl } from '../../utils/productImages.js';
import { placementSummary } from '../../config/storefrontPlacement.js';
import { departmentLabel } from '../../config/productTypes.js';
import { useAdminProductAPI } from '../../hooks/useAdminProductAPI.js';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminInput } from '../../components/admin/ui/AdminInput.jsx';
import { AdminChip } from '../../components/admin/ui/AdminChip.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  AdminTd,
  AdminTh,
} from '../../components/admin/ui/AdminTable.jsx';

/** @typedef {'all' | 'men' | 'women' | 'kids'} CatFilter */
/** @typedef {'all' | 'shoes' | 'apparel' | 'accessories'} TypeFilter */

const GENDER_CHIPS = [
  { id: 'all', label: 'All genders' },
  { id: 'men', label: "Men's" },
  { id: 'women', label: "Women's" },
  { id: 'kids', label: "Kids'" },
];

const TYPE_CHIPS = [
  { id: 'all', label: 'All types' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'apparel', label: 'Apparel' },
  { id: 'accessories', label: 'Accessories' },
];

export function AdminProducts() {
  const { fetchProducts, deleteProduct } = useAdminProductAPI();
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(/** @type {CatFilter} */ ('all'));
  const [typeFilter, setTypeFilter] = useState(/** @type {TypeFilter} */ ('all'));
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadProducts = async () => {
    try {
      const list = await fetchProducts();
      setProducts(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (!p) return false;
      if (cat !== 'all' && p.category !== cat) return false;
      if (typeFilter !== 'all' && (p.productType || 'shoes') !== typeFilter) return false;
      if (!needle) return true;
      return (
        p.name?.toLowerCase().includes(needle) ||
        p.brand?.toLowerCase().includes(needle) ||
        String(p.id).toLowerCase().includes(needle)
      );
    });
  }, [products, q, cat, typeFilter]);

  const stats = useMemo(() => {
    const low = products.filter((p) => (p.stock_quantity ?? 0) < 8).length;
    const oos = products.filter((p) => (p.stock_quantity ?? 0) === 0).length;
    const apparel = products.filter((p) => p.productType === 'apparel').length;
    return { total: products.length, low, oos, apparel };
  }, [products]);

  async function handleDelete(id) {
    if (!window.confirm(`Permanently remove product "${id}"?`)) return;
    try {
      const prod = products.find((p) => p.id === id || p.product_id === id);
      if (prod?.product_id) await deleteProduct(prod.product_id);
      else await deleteProduct(id);
      await loadProducts();
    } catch {
      alert('Could not delete product');
    }
  }

  if (isInitialLoad) return <AdminLoading label="Loading catalog…" />;

  return (
    <AdminPage className="space-y-8">
      <AdminPageHeader
        title="Products & stock"
        description="Manage catalog, photos, inventory, and where each SKU appears on the storefront."
        actions={
          <Link
            to="/admin/products/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-red px-5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 no-underline transition hover:bg-brand-red-hover"
          >
            Add product
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total SKUs" value={String(stats.total)} accent="dark" />
        <StatCard title="Low stock" value={String(stats.low)} hint="Under 8 units" accent="sky" />
        <StatCard title="Out of stock" value={String(stats.oos)} accent="red" />
        <StatCard title="Apparel" value={String(stats.apparel)} hint="On /apparel page" accent="emerald" />
      </section>

      <AdminCard>
        <div className="space-y-4">
          <AdminInput
            label="Search catalog"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, brand, or SKU handle…"
          />
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">Gender</p>
            <div className="flex flex-wrap gap-2">
              {GENDER_CHIPS.map((chip) => (
                <AdminChip
                  key={chip.id}
                  label={chip.label}
                  active={cat === chip.id}
                  onClick={() => setCat(/** @type {CatFilter} */ (chip.id))}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">Department</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_CHIPS.map((chip) => (
                <AdminChip
                  key={chip.id}
                  label={chip.label}
                  active={typeFilter === chip.id}
                  onClick={() => setTypeFilter(/** @type {TypeFilter} */ (chip.id))}
                />
              ))}
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Catalog" subtitle={`${filtered.length} product${filtered.length === 1 ? '' : 's'} shown`} padding={false}>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-neutral-800">No products match your filters</p>
            <p className="mt-1 text-sm text-neutral-500">Add a product or widen your search.</p>
            <Link
              to="/admin/products/new"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-brand-red px-5 text-sm font-semibold text-white no-underline shadow-sm hover:bg-brand-red-hover"
            >
              Add first product
            </Link>
          </div>
        ) : (
          <AdminTable minWidth="min-w-[1080px]">
            <AdminTableHead>
              <AdminTh>Photo</AdminTh>
              <AdminTh>Product</AdminTh>
              <AdminTh>Storefront</AdminTh>
              <AdminTh>Price</AdminTh>
              <AdminTh>Stock</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {filtered.map((p) => {
                const units = p.stock_quantity ?? 0;
                const low = units < 8;
                const imgSrc = resolveProductImageUrl(p.image);
                const pType = p.productType || 'shoes';

                return (
                  <tr key={p.id || p.product_id} className="hover:bg-neutral-50/80">
                    <AdminTd>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt=""
                          width={56}
                          height={56}
                          className="size-14 rounded-xl border border-neutral-100 object-cover shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-14 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-[10px] text-neutral-400">
                          No photo
                        </div>
                      )}
                    </AdminTd>
                    <AdminTd>
                      <p className="font-semibold text-neutral-950">{p.name}</p>
                      <p className="text-xs text-neutral-500">{p.brand}</p>
                      <p className="mt-1 font-mono text-[11px] text-neutral-400">{p.id}</p>
                      {p.isNew ? (
                        <span className="mt-1 inline-block rounded bg-brand-red/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-red">
                          New
                        </span>
                      ) : null}
                    </AdminTd>
                    <AdminTd>
                      <p className="text-sm font-medium text-neutral-800">
                        {placementSummary(p.category, pType)}
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {pType === 'apparel' ? '/apparel' : '/shop'}
                        {p.category ? `?category=${p.category}` : ''}
                        {pType !== 'shoes' ? `&type=${pType}` : ''}
                      </p>
                      <span className="mt-1.5 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-neutral-600">
                        {departmentLabel(pType)}
                      </span>
                    </AdminTd>
                    <AdminTd className="font-semibold tabular-nums">{formatPrice(p.price)}</AdminTd>
                    <AdminTd>
                      <span className={low ? 'font-bold tabular-nums text-amber-700' : 'tabular-nums'}>
                        {units}
                      </span>
                      <span className="text-xs text-neutral-500"> units</span>
                      {low ? (
                        <span className="ml-1 text-[10px] font-bold uppercase text-amber-700">Low</span>
                      ) : null}
                    </AdminTd>
                    <AdminTd className="text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <Link
                          to={`/admin/products/${p.product_id}/edit`}
                          className="text-xs font-bold uppercase text-brand-red hover:underline"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/product/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold uppercase text-neutral-500 hover:underline"
                        >
                          View live
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="text-xs font-bold uppercase text-neutral-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </AdminTd>
                  </tr>
                );
              })}
            </AdminTableBody>
          </AdminTable>
        )}
      </AdminCard>
    </AdminPage>
  );
}
