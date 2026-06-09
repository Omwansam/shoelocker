import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format.js';
import { useAdminProductAPI } from '../../hooks/useAdminProductAPI.js';

/** @typedef {'all' | 'men' | 'women' | 'kids'} CatFilter */
/** @typedef {'all' | 'shoes' | 'apparel' | 'accessories'} TypeFilter */

export function AdminProducts() {
  const { fetchProducts, deleteProduct, loading: apiLoading } = useAdminProductAPI();
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
    loadProducts();
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

  async function handleDelete(id) {
    if (!window.confirm(`Permanently remove product "${id}"?`)) return;
    try {
      // Find the actual numeric product_id if the id is the slug
      const prod = products.find(p => p.id === id || p.product_id === id);
      if (prod && prod.product_id) {
        await deleteProduct(prod.product_id);
      } else {
        await deleteProduct(id);
      }
      await loadProducts();
    } catch (e) {
      alert('Could not delete product');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-rise">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Products &amp; stock</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage your live storefront product catalog.
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-red-hover"
        >
          Add product
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-neutral-200 pb-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Search
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, brand, SKU…"
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Gender
          </label>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25 sm:w-44"
          >
            <option value="all">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25 sm:w-44"
          >
            <option value="all">All types</option>
            <option value="shoes">Shoes</option>
            <option value="apparel">Apparel</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr className="text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-semibold">Thumb</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Cat</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isInitialLoad ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                    Loading products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                    Nothing here yet — widen filters or add a product.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const units = p.stock_quantity || 0;
                  const low = units < 8;

                  return (
                    <tr key={p.id || p.product_id} className="hover:bg-neutral-50/80">
                      <td className="px-4 py-2">
                        {p.image ? (
                          <img
                            src={p.image.startsWith('http') ? p.image : `/${p.image}`}
                            alt=""
                            width={52}
                            height={52}
                            className="size-[52px] rounded-lg border border-neutral-100 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="size-[52px] rounded-lg border border-neutral-100 bg-neutral-100" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                        {p.id}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-neutral-950">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{p.brand}</td>
                      <td className="px-4 py-3 capitalize text-neutral-600">
                        {p.category}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {formatPrice(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`tabular-nums ${low ? 'text-amber-700 font-bold' : ''}`}>
                            {units} units
                          </span>
                          {low && (
                            <span className="text-[11px] font-bold uppercase text-amber-700">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-3">
                          <Link
                            to={`/admin/products/${p.product_id}/edit`}
                            className="text-xs font-bold uppercase text-brand-red hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="text-xs font-bold uppercase text-neutral-600 hover:text-neutral-950"
                          >
                            Delete
                          </button>
                          <Link
                            to={`/product/${p.id}`}
                            className="text-xs font-bold uppercase text-neutral-500 hover:underline"
                          >
                            Store
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
