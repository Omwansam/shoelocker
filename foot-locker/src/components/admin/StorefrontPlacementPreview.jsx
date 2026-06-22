import { Link } from 'react-router-dom';
import { getStorefrontPlacements } from '../../config/storefrontPlacement.js';
import { departmentLabel } from '../../config/productTypes.js';
import { AdminCard } from './ui/AdminCard.jsx';

const GENDER_LABELS = { men: "Men's", women: "Women's", kids: "Kids'" };

/**
 * @param {{
 *   category: string,
 *   productType: string,
 *   isNew: boolean,
 *   slug: string,
 *   name?: string,
 *   brand?: string,
 *   price?: string | number,
 *   imagePreview?: string,
 * }} props
 */
export function StorefrontPlacementPreview({
  category,
  productType,
  isNew,
  slug,
  name = 'Product name',
  brand = 'Brand',
  price = '0',
  imagePreview = '',
}) {
  const placements = getStorefrontPlacements({ category, productType, isNew, slug });
  const gender = GENDER_LABELS[category] || category;
  const dept = departmentLabel(productType);

  return (
    <div className="space-y-4">
      <AdminCard title="Where customers see this" subtitle="Live storefront placement based on your selections">
        <ul className="space-y-3">
          {placements.map((p) => (
            <li
              key={`${p.area}-${p.href}`}
              className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-[10px] font-bold uppercase text-white">
                {p.area.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">{p.label}</p>
                {p.description ? (
                  <p className="mt-0.5 text-xs text-neutral-500">{p.description}</p>
                ) : null}
                <Link
                  to={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block truncate text-xs font-medium text-brand-red hover:underline"
                >
                  {p.href}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard title="Card preview" subtitle="How it appears in shop grids">
        <div className="mx-auto max-w-[220px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="relative aspect-square bg-neutral-100">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-neutral-400">No photo yet</div>
            )}
            {isNew ? (
              <span className="absolute left-2 top-2 rounded bg-brand-red px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                New
              </span>
            ) : null}
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{brand || 'Brand'}</p>
            <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-neutral-950">{name || 'Product name'}</p>
            <p className="mt-2 text-sm font-bold tabular-nums text-neutral-950">
              KSh {Number(price || 0).toLocaleString('en-KE')}
            </p>
            <p className="mt-2 text-[10px] font-medium text-neutral-500">
              {gender} · {dept}
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
