import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { suggestProductId } from '../../utils/catalogStorage.js';
import { useAdminProductAPI } from '../../hooks/useAdminProductAPI.js';

/** @typedef {{ name: string, brand: string, category: 'men' | 'women' | 'kids', price: string, isNew: boolean, description: string, image: string, hoverImage: string, galleryText: string, sizesText: string, idSlug: string }} Draft */

/** @param {{ variant?: 'create' }} props */
export function AdminProductForm({ variant } = {}) {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isCreate = variant === 'create';
  
  const editId = !isCreate && productId ? productId : '';

  const { createProduct, updateProduct, fetchProductById } = useAdminProductAPI();

  const [draft, setDraft] = useState(() => emptyDraft());
  const [heroFile, setHeroFile] = useState(null);
  const [hoverFile, setHoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(!isCreate);

  useEffect(() => {
    if (!isCreate && editId) {
      setLoadingInitial(true);
      fetchProductById(editId)
        .then(prod => {
          if (prod) {
            setDraft(productToDraft(prod));
          } else {
            setErr('Product not found');
          }
        })
        .catch(e => setErr('Failed to load product'))
        .finally(() => setLoadingInitial(false));
    } else {
      setDraft(emptyDraft());
      setLoadingInitial(false);
    }
  }, [isCreate, editId, fetchProductById]);

  function handleSuggestSlug() {
    setDraft((d) => ({ ...d, idSlug: suggestProductId(d.name || 'style') }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const newId =
        isCreate ?
          (draft.idSlug.trim() || suggestProductId(draft.name || 'style'))
        : editId;

      const catMap = { men: 1, women: 2, kids: 3 };
      const categoryId = catMap[draft.category] || 1;

      const formData = new FormData();
      formData.append('product_slug', newId);
      formData.append('product_name', draft.name);
      formData.append('brand', draft.brand);
      formData.append('storefront_category', draft.category);
      formData.append('product_price', draft.price);
      formData.append('is_new', draft.isNew.toString());
      formData.append('product_description', draft.description);
      formData.append('category_id', categoryId.toString());
      formData.append('sizes', JSON.stringify(parseSizes(draft.sizesText)));

      if (heroFile) {
        formData.append('image', heroFile);
      } else if (draft.image) {
        formData.append('image', draft.image);
      }

      if (hoverFile) {
        formData.append('hover_image', hoverFile);
      } else if (draft.hoverImage) {
        formData.append('hover_image', draft.hoverImage);
      }

      if (galleryFiles.length > 0) {
        galleryFiles.forEach(f => formData.append('gallery', f));
      } else {
        const galleryArr = parseGallery(draft.galleryText);
        if (galleryArr.length > 0) {
          formData.append('gallery', JSON.stringify(galleryArr));
        }
      }

      if (isCreate) {
        await createProduct(formData);
      } else {
        await updateProduct(editId, formData);
      }

      navigate('/admin/products');
    } catch (er) {
      console.error(er);
      setErr(er instanceof Error ? er.message : 'Could not save product');
    } finally {
      setBusy(false);
    }
  }

  if (!isCreate && !editId) {
    return <Navigate to="/admin/products" replace />;
  }

  const pageTitle = isCreate ? 'Add product' : `Edit ${editId}`;

  if (loadingInitial) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-16 pt-8 text-center animate-fade-rise">
        <p className="text-neutral-500">Loading product...</p>
      </div>
    );
  }

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
          Upload product images to store them securely.
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
            Images
          </legend>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Hero image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
            {draft.image && !heroFile && (
                <p className="mt-1 text-xs text-neutral-500">Current: {draft.image}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Hover swap URL <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setHoverFile(e.target.files?.[0] || null)}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
            {draft.hoverImage && !hoverFile && (
                <p className="mt-1 text-xs text-neutral-500">Current: {draft.hoverImage}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Gallery (up to 4 images)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setGalleryFiles(Array.from(e.target.files || []).slice(0, 4))}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
            {draft.galleryText && galleryFiles.length === 0 && (
                <p className="mt-1 text-xs text-neutral-500">Current gallery items exist.</p>
            )}
          </div>
          {(heroFile || draft.image || galleryFiles.length > 0 || parseGallery(draft.galleryText)[0]) ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
              <img
                alt="Preview"
                src={heroFile ? URL.createObjectURL(heroFile) : draft.image.trim() || parseGallery(draft.galleryText)[0]}
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

function productToDraft(p) {
  return {
    name: p.name || '',
    brand: p.brand || '',
    category: p.category || 'men',
    price: String(p.price || ''),
    isNew: !!p.isNew,
    description: p.description || '',
    image: p.image || '',
    hoverImage: p.hoverImage || '',
    galleryText: (p.gallery ?? []).join('\n'),
    sizesText: (p.sizes ?? []).join('\n'),
    idSlug: p.id || '',
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
