import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { products as seedProducts } from '../../data/products.js';
import {
  getHiddenProductRows,
  mergeCatalogList,
  mutateCatalog,
  normalizeProductPayload,
  readCatalogDelta,
  seedProductIdSet,
  suggestProductId,
} from '../../utils/catalogStorage.js';

/** @typedef {import('../../utils/catalogStorage.js').Product} Product */

/** @typedef {{ name: string, brand: string, category: 'men' | 'women' | 'kids', price: string, isNew: boolean, description: string, image: string, hoverImage: string, galleryText: string, sizesText: string, idSlug: string }} Draft */

/** @param {string} id */
function findDraftProduct(id) {
  const v = mergeCatalogList().find((x) => x.id === id);
  if (v) return v;
  return getHiddenProductRows().find((x) => x.id === id) ?? null;
}

/** @param {import('../../utils/catalogStorage.js').CatalogDelta} d */
function reservedSkuIds(d) {
  const ids = new Set(seedProducts.map((p) => p.id));
  d.additions.forEach((p) => ids.add(p.id));
  return ids;
}

/** @param {{ variant?: 'create' }} props */
export function AdminProductForm({ variant } = {}) {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isCreate = variant === 'create';

  const editId = !isCreate && productId ? productId : '';

  const [draft, setDraft] = useState(() => {
    if (isCreate) return emptyDraft();
    if (!editId) return emptyDraft();
    const prod = findDraftProduct(editId);
    return prod ? productToDraft(prod) : emptyDraft();
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const seeds = useMemo(() => seedProductIdSet(), []);

  function handleSuggestSlug() {
    setDraft((d) => ({ ...d, idSlug: suggestProductId(d.name || 'style') }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const galleryArr = parseGallery(draft.galleryText);
      const mainImage = draft.image.trim() || galleryArr[0] || '';
      const hover = draft.hoverImage.trim() || galleryArr[1] || mainImage;
      const newId =
        isCreate ?
          (draft.idSlug.trim() || suggestProductId(draft.name || 'style'))
        : editId;

      if (isCreate) {
        const delta = readCatalogDelta();
        const taken = reservedSkuIds(delta);
        if (taken.has(newId)) {
          setErr('That SKU is already taken — pick another slug.');
          setBusy(false);
          return;
        }
      }

      const raw = {
        id: newId,
        name: draft.name,
        brand: draft.brand,
        category: draft.category,
        price: Number(draft.price),
        isNew: draft.isNew,
        description: draft.description,
        image: mainImage,
        hoverImage: hover,
        gallery:
          galleryArr.length > 0 ? galleryArr : mainImage ? [mainImage] : [],
        sizes: parseSizes(draft.sizesText),
      };

      const normalized = normalizeProductPayload(
        /** @type {Product} */ (raw),
      );

      if (isCreate) {
        mutateCatalog((d) => {
          d.additions.push(normalized);
        });
      } else if (!editId) {
        throw new Error('Missing product');
      } else if (seeds.has(editId)) {
        mutateCatalog((d) => {
          d.overrides[editId] = {
            name: normalized.name,
            brand: normalized.brand,
            price: normalized.price,
            category: normalized.category,
            isNew: normalized.isNew,
            description: normalized.description,
            image: normalized.image,
            hoverImage: normalized.hoverImage,
            gallery: normalized.gallery,
            sizes: normalized.sizes,
          };
        });
      } else {
        mutateCatalog((d) => {
          const i = d.additions.findIndex((p) => p.id === editId);
          if (i === -1) throw new Error('Custom SKU not found in queue');
          d.additions[i] = normalized;
        });
      }

      navigate('/admin/products');
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Could not save product');
    } finally {
      setBusy(false);
    }
  }

  if (!isCreate) {
    if (!editId || !findDraftProduct(editId)) {
      return <Navigate to="/admin/products" replace />;
    }
  }

  const pageTitle = isCreate ? 'Add product' : `Edit ${editId}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16 animate-fade-rise">
      <div>
        <Link
          to="/admin/products"
          className="text-sm font-semibold text-brand-red hover:underline"
        >
          ← Products
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-950">{pageTitle}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Use HTTPS URLs for photos (CDN, Unsplash, your brand DAM). Upload-to-host
          is not included in this prototype.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {err ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {err}
          </p>
        ) : null}

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            Basics
          </legend>
          {isCreate ? (
            <div>
              <label className="text-xs font-semibold uppercase text-neutral-500">
                SKU handle (slug)
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={draft.idSlug}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, idSlug: e.target.value }))
                  }
                  placeholder={suggestProductId('New runner')}
                  className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
                />
                <button
                  type="button"
                  onClick={handleSuggestSlug}
                  className="shrink-0 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold hover:bg-neutral-50"
                >
                  Auto
                </button>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                Stored as <code>/product/&lt;handle&gt;</code> on the storefront.
              </p>
            </div>
          ) : (
            <p className="text-sm font-mono text-neutral-700">
              SKU: <span className="font-bold">{editId}</span>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-neutral-500">
                Product name
              </label>
              <input
                required
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-neutral-500">
                Brand
              </label>
              <input
                required
                value={draft.brand}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, brand: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-neutral-500">
                Category
              </label>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    category: /** @type {Draft['category']} */ (e.target.value),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-neutral-500">
                Price (KSh)
              </label>
              <input
                type="number"
                min={99}
                required
                value={draft.price}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, price: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-brand-red/25"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={draft.isNew}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, isNew: e.target.checked }))
                  }
                  className="rounded border-neutral-300"
                />
                New arrival badge
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-neutral-500">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            Images (HTTPS URLs)
          </legend>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Hero image URL
            </label>
            <input
              value={draft.image}
              onChange={(e) =>
                setDraft((d) => ({ ...d, image: e.target.value }))
              }
              placeholder="https://images.unsplash.com/..."
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Hover swap URL{' '}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              value={draft.hoverImage}
              onChange={(e) =>
                setDraft((d) => ({ ...d, hoverImage: e.target.value }))
              }
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Gallery — one URL per line
            </label>
            <textarea
              rows={5}
              value={draft.galleryText}
              onChange={(e) =>
                setDraft((d) => ({ ...d, galleryText: e.target.value }))
              }
              placeholder={'https://example.com/front.jpg\nhttps://example.com/detail.jpg'}
              className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-brand-red/25"
            />
          </div>
          {draft.image || parseGallery(draft.galleryText)[0] ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
              <img
                alt="Preview"
                src={draft.image.trim() || parseGallery(draft.galleryText)[0]}
                className="mx-auto max-h-64 object-contain"
              />
            </div>
          ) : null}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            Sizes offered
          </legend>
          <p className="mt-2 text-[11px] text-neutral-500">
            Separate with commas or new lines — show the numbering your Kenya wall
            uses.
          </p>
          <textarea
            required
            rows={3}
            value={draft.sizesText}
            onChange={(e) =>
              setDraft((d) => ({ ...d, sizesText: e.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
          />
        </fieldset>

        <div className="flex flex-wrap gap-3 border-t border-neutral-100 pt-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save product'}
          </button>
          <Link
            to="/admin/products"
            className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-semibold hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>

        {!isCreate && seeds.has(editId) ? (
          <p className="text-xs text-neutral-500">
            Seeded pairs can be tweaked here; resetting demo data restores the bundled
            launch catalog snapshot.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function emptyDraft() {
  return /** @type {Draft} */ ({
    name: '',
    brand: '',
    category: 'men',
    price: '18999',
    isNew: true,
    description: '',
    image: '',
    hoverImage: '',
    galleryText: '',
    sizesText: '8\n9\n10',
    idSlug: '',
  });
}

/** @param {Product} p */
function productToDraft(p) {
  return {
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: String(p.price),
    isNew: p.isNew,
    description: p.description,
    image: p.image,
    hoverImage: p.hoverImage,
    galleryText: (p.gallery ?? []).join('\n'),
    sizesText: p.sizes.join('\n'),
    idSlug: p.id,
  };
}

/** @param {string} text */
function parseSizes(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** @param {string} text */
function parseGallery(text) {
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
