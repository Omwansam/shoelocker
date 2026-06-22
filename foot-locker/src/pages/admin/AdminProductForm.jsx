import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { suggestProductId } from '../../utils/catalogStorage.js';
import { resolveProductImageUrl } from '../../utils/productImages.js';
import { fetchProductAiSuggest } from '../../utils/api.js';
import { useAdminProductAPI } from '../../hooks/useAdminProductAPI.js';
import { useToast } from '../../hooks/useToast.js';
import { ImageUploadZone } from '../../components/admin/ImageUploadZone.jsx';
import { StorefrontPlacementPreview } from '../../components/admin/StorefrontPlacementPreview.jsx';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';
import { AdminButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminInput } from '../../components/admin/ui/AdminInput.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';

/** @typedef {{ name: string, brand: string, category: 'men' | 'women' | 'kids', productType: 'shoes' | 'apparel' | 'accessories', price: string, stock: string, isNew: boolean, description: string, image: string, hoverImage: string, sizesText: string, idSlug: string }} Draft */

const GENDERS = [
  { id: 'men', label: "Men's", hint: 'Nav · /shop?category=men' },
  { id: 'women', label: "Women's", hint: 'Nav · /shop?category=women' },
  { id: 'kids', label: "Kids'", hint: 'Nav · /shop?category=kids' },
];

const DEPARTMENTS = [
  { id: 'shoes', label: 'Shoes', hint: 'Default shop wall' },
  { id: 'apparel', label: 'Apparel', hint: '/apparel page' },
  { id: 'accessories', label: 'Accessories', hint: 'Shop · type filter' },
];

const SIZE_PRESETS = {
  shoes: ['7', '8', '9', '10', '11', '12'],
  apparel: ['S', 'M', 'L', 'XL', 'XXL'],
  accessories: ['One Size'],
};

const VALID_CATEGORIES = new Set(['men', 'women', 'kids']);
const VALID_TYPES = new Set(['shoes', 'apparel', 'accessories']);

const FIELD_SCROLL_ORDER = ['image', 'name', 'brand', 'price', 'stock', 'description', 'sizesText', 'idSlug'];

/** @param {string} field @param {Set<string>} aiFields */
function aiFieldClass(field, aiFields) {
  return aiFields.has(field) ? 'ring-2 ring-sky-200 ring-offset-1' : '';
}

/**
 * @param {Draft} draft
 * @param {{ isCreate: boolean, heroFile: File | null, hasExistingImage: boolean }} ctx
 * @returns {Record<string, string>}
 */
function validateProductDraft(draft, { isCreate, heroFile, hasExistingImage }) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (isCreate && !heroFile) {
    errors.image = 'Upload a main product photo before publishing.';
  } else if (!isCreate && !heroFile && !hasExistingImage) {
    errors.image = 'Add a main product photo or keep the existing one.';
  }

  if (!draft.name.trim()) {
    errors.name = 'Product name is required.';
  }

  if (!draft.brand.trim()) {
    errors.brand = 'Brand is required.';
  }

  const price = Number(draft.price);
  if (!draft.price.trim() || Number.isNaN(price)) {
    errors.price = 'Enter a valid price in KES.';
  } else if (price < 1) {
    errors.price = 'Price must be at least KES 1.';
  }

  const stock = Number(draft.stock);
  if (draft.stock === '' || Number.isNaN(stock)) {
    errors.stock = 'Enter stock quantity.';
  } else if (stock < 0) {
    errors.stock = 'Stock cannot be negative.';
  }

  if (!draft.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (parseSizes(draft.sizesText).length === 0) {
    errors.sizesText = 'Add at least one size.';
  }

  if (isCreate && !draft.idSlug.trim() && !draft.name.trim()) {
    errors.idSlug = 'SKU handle or product name is required.';
  }

  return errors;
}

/** @param {{ variant?: 'create' }} props */
export function AdminProductForm({ variant } = {}) {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isCreate = variant === 'create';
  const editId = !isCreate && productId ? productId : '';

  const { createProduct, updateProduct, fetchProductById } = useAdminProductAPI();
  const { show: showToast } = useToast();

  const [draft, setDraft] = useState(() => emptyDraft());
  const [heroFile, setHeroFile] = useState(null);
  const [hoverFile, setHoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(!isCreate);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiFields, setAiFields] = useState(/** @type {Set<string>} */ (new Set()));
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}));

  const aiAbortRef = useRef(/** @type {AbortController | null} */ (null));
  const lastAnalyzedRef = useRef('');
  const fieldRefs = useRef(/** @type {Record<string, HTMLElement | null>} */ ({}));

  useEffect(() => {
    if (!isCreate && editId) {
      setLoadingInitial(true);
      fetchProductById(editId)
        .then((prod) => {
          if (prod) setDraft(productToDraft(prod));
          else setErr('Product not found');
        })
        .catch(() => setErr('Failed to load product'))
        .finally(() => setLoadingInitial(false));
    } else {
      setDraft(emptyDraft());
      setLoadingInitial(false);
    }
  }, [isCreate, editId, fetchProductById]);

  const applyAiSuggestions = useCallback((suggestions) => {
    const category = VALID_CATEGORIES.has(suggestions.storefront_category)
      ? suggestions.storefront_category
      : 'men';
    const productType = VALID_TYPES.has(suggestions.product_type)
      ? suggestions.product_type
      : 'shoes';
    const sizes = Array.isArray(suggestions.sizes) ? suggestions.sizes : [];
    const name = suggestions.product_name || '';

    setDraft((d) => ({
      ...d,
      name: name || d.name,
      brand: suggestions.brand || d.brand,
      description: suggestions.product_description || d.description,
      category: /** @type {Draft['category']} */ (category),
      productType: /** @type {Draft['productType']} */ (productType),
      sizesText: sizes.length ? sizes.join('\n') : d.sizesText,
      idSlug: suggestions.id_slug || suggestProductId(name || d.name),
    }));

    setAiFields(new Set(['name', 'brand', 'description', 'category', 'productType', 'sizesText', 'idSlug']));
    setAiMessage('Gemini filled product details from your photo. Review before publishing.');
    setAiError('');
  }, []);

  useEffect(() => {
    if (!heroFile) {
      lastAnalyzedRef.current = '';
      return undefined;
    }

    const fileKey = `${heroFile.name}-${heroFile.size}-${heroFile.lastModified}`;
    if (fileKey === lastAnalyzedRef.current) return undefined;

    const timer = setTimeout(() => {
      aiAbortRef.current?.abort();
      const controller = new AbortController();
      aiAbortRef.current = controller;

      setAiLoading(true);
      setAiMessage('');
      setAiError('');

      fetchProductAiSuggest(heroFile, { signal: controller.signal })
        .then((res) => {
          if (controller.signal.aborted) return;
          if (res?.success && res.suggestions) {
            lastAnalyzedRef.current = fileKey;
            applyAiSuggestions(res.suggestions);
          } else {
            setAiError(res?.error || 'AI could not analyze this photo.');
          }
        })
        .catch((e) => {
          if (controller.signal.aborted || e?.code === 'ERR_CANCELED') return;
          const msg = e?.response?.data?.error || e?.message || 'AI assist unavailable';
          setAiError(msg);
        })
        .finally(() => {
          if (!controller.signal.aborted) setAiLoading(false);
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      aiAbortRef.current?.abort();
    };
  }, [heroFile, applyAiSuggestions]);

  function clearAiField(field) {
    setAiFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function patchDraft(/** @type {Partial<Draft>} */ patch, /** @type {string[]} */ touchedFields = []) {
    setDraft((d) => ({ ...d, ...patch }));
    if (touchedFields.length) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        touchedFields.forEach((f) => delete next[f]);
        return next;
      });
    }
    touchedFields.forEach(clearAiField);
  }

  function scrollToFirstError(errors) {
    const first = FIELD_SCROLL_ORDER.find((key) => errors[key]);
    const el = first ? fieldRefs.current[first] : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  const slugPreview = isCreate
    ? draft.idSlug.trim() || suggestProductId(draft.name || 'style')
    : editId;

  const heroPreview = useMemo(() => {
    if (heroFile) return URL.createObjectURL(heroFile);
    if (draft.image) return resolveProductImageUrl(draft.image);
    return '';
  }, [heroFile, draft.image]);

  function handleSuggestSlug() {
    patchDraft({ idSlug: suggestProductId(draft.name || 'style') }, ['idSlug']);
  }

  function applySizePreset() {
    const preset = SIZE_PRESETS[draft.productType] || SIZE_PRESETS.shoes;
    patchDraft({ sizesText: preset.join('\n') }, ['sizesText']);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setFieldErrors({});

    const validationErrors = validateProductDraft(draft, {
      isCreate,
      heroFile,
      hasExistingImage: Boolean(draft.image),
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setErr('Could not publish — fix the fields marked below.');
      scrollToFirstError(validationErrors);
      return;
    }

    setBusy(true);
    try {
      const newId = isCreate ? slugPreview : editId;
      const catMap = { men: 1, women: 2, kids: 3 };

      const formData = new FormData();
      formData.append('product_slug', newId);
      formData.append('product_name', draft.name);
      formData.append('brand', draft.brand);
      formData.append('storefront_category', draft.category);
      formData.append('product_type', draft.productType);
      formData.append('product_price', draft.price);
      formData.append('stock_quantity', draft.stock || '0');
      formData.append('is_new', draft.isNew.toString());
      formData.append('product_description', draft.description);
      formData.append('category_id', String(catMap[draft.category] || 1));
      formData.append('sizes', JSON.stringify(parseSizes(draft.sizesText)));

      if (heroFile) formData.append('image', heroFile);
      if (hoverFile) formData.append('hover_image', hoverFile);
      galleryFiles.forEach((f) => formData.append('gallery', f));

      if (isCreate) await createProduct(formData);
      else await updateProduct(editId, formData);

      showToast(
        isCreate
          ? `"${draft.name || 'Product'}" published successfully`
          : `"${draft.name || 'Product'}" updated successfully`,
        'success',
      );
      await new Promise((resolve) => setTimeout(resolve, 700));
      navigate('/admin/products');
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Could not save product');
    } finally {
      setBusy(false);
    }
  }

  if (!isCreate && !editId) return <Navigate to="/admin/products" replace />;
  if (loadingInitial) return <AdminLoading label="Loading product…" />;

  return (
    <AdminPage className="space-y-8 pb-16">
      <AdminPageHeader
        title={isCreate ? 'Add product' : 'Edit product'}
        description="Upload a main photo — Gemini auto-fills name, description, and storefront placement. Review everything before publishing."
        badge={
          aiLoading ? (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
              Gemini analyzing…
            </span>
          ) : aiFields.size > 0 ? (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
              AI suggestions applied
            </span>
          ) : null
        }
        actions={
          <Link
            to="/admin/products"
            className="text-sm font-semibold text-brand-red hover:underline"
          >
            ← Back to catalog
          </Link>
        }
      />

      {err ? <AdminAlert>{err}</AdminAlert> : null}
      {aiError ? <AdminAlert tone="warning">{aiError}</AdminAlert> : null}
      {aiMessage ? <AdminAlert tone="info">{aiMessage}</AdminAlert> : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <AdminCard title="Product photos" subtitle="Upload main photo first — Gemini suggests catalog details automatically">
              <div
                ref={(el) => {
                  fieldRefs.current.image = el;
                }}
                className="space-y-6"
              >
                {fieldErrors.image ? (
                  <p className="text-xs font-medium text-red-600">{fieldErrors.image}</p>
                ) : null}
                <ImageUploadZone
                  label="Main photo"
                  hint="Triggers Gemini auto-fill for name, brand, description & placement"
                  required
                  file={heroFile}
                  existingUrl={!heroFile ? draft.image : ''}
                  onFileChange={(file) => {
                    setHeroFile(file);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.image;
                      return next;
                    });
                  }}
                />
                {aiLoading ? (
                  <p className="flex items-center gap-2 text-sm text-sky-700">
                    <span className="size-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                    Analyzing photo with Gemini…
                  </p>
                ) : null}
                <ImageUploadZone
                  label="Hover photo"
                  hint="Optional second angle shown when shoppers hover the card"
                  file={hoverFile}
                  existingUrl={!hoverFile ? draft.hoverImage : ''}
                  onFileChange={setHoverFile}
                />
                <ImageUploadZone
                  label="Gallery"
                  hint="Extra angles on the product detail page"
                  multiple
                  maxFiles={4}
                  files={galleryFiles}
                  onFilesChange={setGalleryFiles}
                />
              </div>
            </AdminCard>

            <AdminCard title="Product details" subtitle="Review AI suggestions — price and stock are always manual">
              <div className="grid gap-4 sm:grid-cols-2">
                {isCreate ? (
                  <div
                    ref={(el) => {
                      fieldRefs.current.idSlug = el;
                    }}
                    className="sm:col-span-2"
                  >
                    <AdminInput
                      label="SKU handle"
                      className={aiFieldClass('idSlug', aiFields)}
                      error={fieldErrors.idSlug}
                      value={draft.idSlug}
                      onChange={(e) => patchDraft({ idSlug: e.target.value }, ['idSlug'])}
                      placeholder={suggestProductId('new-runner')}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSuggestSlug}
                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                      >
                        Auto-generate
                      </button>
                      <span className="text-xs text-neutral-500">
                        URL: <code className="font-mono">/product/{slugPreview}</code>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="sm:col-span-2 text-sm text-neutral-600">
                    SKU: <span className="font-mono font-bold text-neutral-900">{editId}</span>
                  </p>
                )}
                <div
                  ref={(el) => {
                    fieldRefs.current.name = el;
                  }}
                  className="sm:col-span-2"
                >
                  <AdminInput
                    label="Product name"
                    className={aiFieldClass('name', aiFields)}
                    error={fieldErrors.name}
                    value={draft.name}
                    onChange={(e) => patchDraft({ name: e.target.value }, ['name'])}
                  />
                </div>
                <div
                  ref={(el) => {
                    fieldRefs.current.brand = el;
                  }}
                >
                  <AdminInput
                    label="Brand"
                    className={aiFieldClass('brand', aiFields)}
                    error={fieldErrors.brand}
                    value={draft.brand}
                    onChange={(e) => patchDraft({ brand: e.target.value }, ['brand'])}
                  />
                </div>
                <div
                  ref={(el) => {
                    fieldRefs.current.price = el;
                  }}
                >
                  <AdminInput
                    label="Price (KES)"
                    type="number"
                    min={1}
                    step={1}
                    error={fieldErrors.price}
                    value={draft.price}
                    onChange={(e) => patchDraft({ price: e.target.value }, ['price'])}
                  />
                </div>
                <div
                  ref={(el) => {
                    fieldRefs.current.stock = el;
                  }}
                >
                  <AdminInput
                    label="Stock quantity"
                    type="number"
                    min={0}
                    step={1}
                    error={fieldErrors.stock}
                    value={draft.stock}
                    onChange={(e) => patchDraft({ stock: e.target.value }, ['stock'])}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={draft.isNew}
                    onChange={(e) => patchDraft({ isNew: e.target.checked })}
                    className="size-4 rounded border-neutral-300 text-brand-red focus:ring-brand-red/30"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">New arrival badge</span>
                    <span className="text-xs text-neutral-500">Shows on card + homepage featured section</span>
                  </span>
                </label>
                <div
                  ref={(el) => {
                    fieldRefs.current.description = el;
                  }}
                  className={`sm:col-span-2 ${aiFieldClass('description', aiFields)}`}
                >
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Description
                  </label>
                  {fieldErrors.description ? (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                  ) : null}
                  <textarea
                    rows={4}
                    value={draft.description}
                    onChange={(e) => patchDraft({ description: e.target.value }, ['description'])}
                    className={`mt-2 w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:ring-2 ${
                      fieldErrors.description
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-950/10'
                    }`}
                  />
                </div>
              </div>
            </AdminCard>

            <AdminCard
              title="Storefront placement"
              subtitle="Gemini suggests gender & department — tap to override"
              action={
                aiFields.has('category') || aiFields.has('productType') ? (
                  <span className="text-[10px] font-semibold uppercase text-sky-600">AI picked</span>
                ) : null
              }
            >
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Gender / audience</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {GENDERS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => patchDraft({ category: /** @type {Draft['category']} */ (g.id) }, ['category'])}
                        className={
                          draft.category === g.id
                            ? `rounded-xl border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-left text-white ${aiFields.has('category') ? 'ring-2 ring-sky-400 ring-offset-2' : ''}`
                            : 'rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left hover:border-neutral-300'
                        }
                      >
                        <span className="block text-sm font-semibold">{g.label}</span>
                        <span className={`mt-0.5 block text-[11px] ${draft.category === g.id ? 'text-white/70' : 'text-neutral-500'}`}>
                          {g.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Department</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {DEPARTMENTS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          const preset = SIZE_PRESETS[/** @type {keyof typeof SIZE_PRESETS} */ (d.id)] || SIZE_PRESETS.shoes;
                          patchDraft(
                            {
                              productType: /** @type {Draft['productType']} */ (d.id),
                              sizesText: preset.join('\n'),
                            },
                            ['productType', 'sizesText'],
                          );
                        }}
                        className={
                          draft.productType === d.id
                            ? `rounded-xl border-2 border-brand-red bg-brand-red/5 px-4 py-3 text-left ${aiFields.has('productType') ? 'ring-2 ring-sky-400 ring-offset-2' : ''}`
                            : 'rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left hover:border-neutral-300'
                        }
                      >
                        <span className="block text-sm font-semibold text-neutral-900">{d.label}</span>
                        <span className="mt-0.5 block text-[11px] text-neutral-500">{d.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AdminCard>

            <AdminCard title="Sizes" subtitle="One size per line or comma-separated">
              <div
                ref={(el) => {
                  fieldRefs.current.sizesText = el;
                }}
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applySizePreset}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold hover:bg-neutral-50"
                  >
                    Use {draft.productType} preset
                  </button>
                </div>
                {fieldErrors.sizesText ? (
                  <p className="mb-2 text-xs font-medium text-red-600">{fieldErrors.sizesText}</p>
                ) : null}
                <textarea
                  rows={4}
                  value={draft.sizesText}
                  onChange={(e) => patchDraft({ sizesText: e.target.value }, ['sizesText'])}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:ring-2 ${
                    fieldErrors.sizesText
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-950/10'
                  } ${aiFieldClass('sizesText', aiFields)}`}
                />
              </div>
            </AdminCard>

            <div className="flex flex-wrap gap-3">
              <AdminButton variant="primary" type="submit" disabled={busy || aiLoading}>
                {busy ? 'Saving…' : isCreate ? 'Publish product' : 'Save changes'}
              </AdminButton>
              <AdminButton variant="secondary" type="button" onClick={() => navigate('/admin/products')}>
                Cancel
              </AdminButton>
            </div>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <StorefrontPlacementPreview
              category={draft.category}
              productType={draft.productType}
              isNew={draft.isNew}
              slug={slugPreview}
              name={draft.name}
              brand={draft.brand}
              price={draft.price}
              imagePreview={heroPreview}
            />
          </aside>
        </div>
      </form>
    </AdminPage>
  );
}

function emptyDraft() {
  return /** @type {Draft} */ ({
    name: '',
    brand: '',
    category: 'men',
    productType: 'shoes',
    price: '18999',
    stock: '24',
    isNew: true,
    description: '',
    image: '',
    hoverImage: '',
    sizesText: SIZE_PRESETS.shoes.join('\n'),
    idSlug: '',
  });
}

function productToDraft(p) {
  return {
    name: p.name || '',
    brand: p.brand || '',
    category: p.category || 'men',
    productType: p.productType || 'shoes',
    price: String(p.price || ''),
    stock: String(p.stock_quantity ?? 0),
    isNew: !!p.isNew,
    description: p.description || '',
    image: p.image || '',
    hoverImage: p.hoverImage || '',
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
