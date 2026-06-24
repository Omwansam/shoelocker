import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LegalDocumentBody } from '../components/LegalDocumentBody.jsx';
import {
  contentPages,
  contentPagesBySlug,
  storefrontShortcuts,
} from '../config/footerLinks.js';
import { isLegalDocumentSlug, legalDocuments } from '../data/legalDocuments.js';
import { useStoreSettings } from '../hooks/useStoreSettings.js';
import { fetchSupportArticle } from '../utils/api.js';
import { formatPrice } from '../utils/format.js';

const CATEGORY_LABELS = {
  help: 'Help',
  company: 'Company',
  policy: 'Policy',
};

const TONE_STYLES = {
  help: {
    hero: 'bg-neutral-950 text-white',
    glow: 'from-brand-red/25 via-brand-red/10 to-transparent',
    card: 'border-neutral-200 bg-white',
  },
  company: {
    hero: 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white',
    glow: 'from-brand-red/30 to-transparent',
    card: 'border-neutral-200 bg-white',
  },
  policy: {
    hero: 'bg-neutral-100 text-neutral-950',
    glow: 'from-brand-red/15 to-transparent',
    card: 'border-neutral-200 bg-white',
  },
};

/** @param {{ slug: string }} props */
export function StorefrontContentPage({ slug }) {
  const config = contentPagesBySlug[slug];
  const { settings } = useStoreSettings();
  const [article, setArticle] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tone = config?.tone || 'help';
  const styles = TONE_STYLES[tone];
  const isLegalPage = isLegalDocumentSlug(slug);
  const legalDoc = isLegalPage ? legalDocuments[slug] : null;

  useEffect(() => {
    if (isLegalPage) {
      setLoading(false);
      setError(false);
      setArticle(null);
      return undefined;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(false);
    fetchSupportArticle(slug, { signal: ac.signal })
      .then((data) => setArticle(data))
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
        setError(true);
        setArticle(null);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [slug, isLegalPage]);

  const supportEmail = settings?.support_email || 'hello@shoelocker.ke';
  const shippingNote =
    slug === 'shipping' && settings?.free_shipping_threshold != null
      ? ` Free standard delivery on orders over ${formatPrice(
          settings.free_shipping_threshold,
        )} within ${settings.country || 'Kenya'}.`
      : '';

  const relatedLinks = useMemo(() => {
    if (!config?.related) return [];
    return config.related
      .map((key) => {
        const shortcut = storefrontShortcuts[/** @type {keyof typeof storefrontShortcuts} */ (key)];
        if (shortcut) {
          const labels = {
            stores: 'Store locator',
            brands: 'Brands',
            rewards: 'Kickback Rewards',
            shop: 'Shop shoes',
            support: 'Support hub',
          };
          return [labels[/** @type {keyof typeof labels} */ (key)] || key, shortcut];
        }
        const page = contentPagesBySlug[key];
        return page ? [page.footerLabel, page.path] : null;
      })
      .filter(Boolean);
  }, [config]);

  if (!config) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-neutral-600">Page not found.</p>
        <Link to="/" className="mt-4 inline-block text-brand-red hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh]">
      <section className={`relative overflow-hidden ${styles.hero}`}>
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.glow} opacity-80`}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <nav
            className={`text-sm ${
              tone === 'policy' ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            <Link
              to="/"
              className={`transition ${
                tone === 'policy' ? 'hover:text-neutral-950' : 'hover:text-white'
              }`}
            >
              Home
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <Link
              to="/support"
              className={`transition ${
                tone === 'policy' ? 'hover:text-neutral-950' : 'hover:text-white'
              }`}
            >
              Support
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span className={tone === 'policy' ? 'text-neutral-950' : 'text-white'}>
              {isLegalPage
                ? legalDoc?.title || config.eyebrow
                : loading
                  ? config.eyebrow
                  : article?.title || config.eyebrow}
            </span>
          </nav>

          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-brand-red">
            {config.eyebrow}
          </p>
          <h1
            className={`mt-3 max-w-3xl font-[800] uppercase leading-[0.92] tracking-tighter [font-stretch:condensed] sm:text-4xl lg:text-5xl ${
              tone === 'policy' ? 'text-neutral-950' : 'text-white'
            }`}
          >
            {isLegalPage ? (
              legalDoc?.title || config.footerLabel
            ) : loading ? (
              <span className="inline-block h-12 w-64 animate-pulse rounded-lg bg-white/10" />
            ) : (
              article?.title || config.footerLabel
            )}
          </h1>
          {isLegalPage || article ? (
            <span
              className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                tone === 'policy'
                  ? 'border-neutral-300 bg-white text-neutral-600'
                  : 'border-white/20 bg-white/10 text-white/80'
              }`}
            >
              {CATEGORY_LABELS[/** @type {keyof typeof CATEGORY_LABELS} */ (article?.category || 'policy')] ||
                article?.category ||
                'Policy'}
            </span>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {isLegalPage ? (
              <article
                className={`rounded-2xl border p-6 shadow-[var(--shadow-card)] sm:p-10 ${styles.card}`}
              >
                <LegalDocumentBody slug={slug} />
              </article>
            ) : loading ? (
              <div className="space-y-4">
                <div className="h-6 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-6 w-5/6 animate-pulse rounded bg-neutral-100" />
                <div className="h-6 w-4/6 animate-pulse rounded bg-neutral-100" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-neutral-600">
                Could not load this page. Make sure the backend is running, then{' '}
                <button
                  type="button"
                  className="font-semibold text-brand-red underline"
                  onClick={() => window.location.reload()}
                >
                  refresh
                </button>
                .
              </div>
            ) : (
              <article
                className={`rounded-2xl border p-6 shadow-[var(--shadow-card)] sm:p-10 ${styles.card}`}
              >
                <p className="text-base leading-relaxed text-neutral-700 sm:text-lg">
                  {article?.body}
                  {shippingNote}
                </p>
                <PageActions slug={slug} supportEmail={supportEmail} />
              </article>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                  Related pages
                </p>
                <ul className="mt-4 space-y-2">
                  {relatedLinks.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        to={href}
                        className="text-sm font-semibold text-neutral-800 transition hover:text-brand-red"
                      >
                        {label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-950 p-6 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-red">
                  Care desk
                </p>
                <p className="mt-2 text-sm text-neutral-400">
                  Nairobi business hours — same-day replies when we can.
                </p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[11px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-100"
                >
                  {supportEmail}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** @param {{ slug: string, supportEmail: string }} props */
function PageActions({ slug, supportEmail }) {
  const actions = {
    contact: (
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`mailto:${supportEmail}`}
          className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-6 text-[11px] font-bold uppercase tracking-wide text-white"
        >
          Email us
        </a>
        <Link
          to="/stores"
          className="inline-flex h-11 items-center rounded-full border border-neutral-300 px-6 text-[11px] font-bold uppercase tracking-wide text-neutral-800"
        >
          Find a store
        </Link>
      </div>
    ),
    orders: (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/account/orders"
          className="inline-flex h-11 items-center rounded-full bg-brand-red px-6 text-[11px] font-bold uppercase tracking-wide text-white"
        >
          View your orders
        </Link>
        <Link
          to="/sign-in"
          className="inline-flex h-11 items-center rounded-full border border-neutral-300 px-6 text-[11px] font-bold uppercase tracking-wide text-neutral-800"
        >
          Sign in
        </Link>
      </div>
    ),
    pickup: (
      <Link
        to="/stores"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-brand-red px-6 text-[11px] font-bold uppercase tracking-wide text-white"
      >
        Store locator →
      </Link>
    ),
    about: (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/shop?type=shoes"
          className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-6 text-[11px] font-bold uppercase tracking-wide text-white"
        >
          Shop the wall
        </Link>
        <Link
          to="/brands"
          className="inline-flex h-11 items-center rounded-full border border-neutral-300 px-6 text-[11px] font-bold uppercase tracking-wide text-neutral-800"
        >
          Brand directory
        </Link>
      </div>
    ),
    careers: (
      <a
        href="mailto:careers@shoelocker.ke"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-neutral-950 px-6 text-[11px] font-bold uppercase tracking-wide text-white"
      >
        careers@shoelocker.ke
      </a>
    ),
    affiliates: (
      <a
        href="mailto:partners@shoelocker.ke"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-neutral-950 px-6 text-[11px] font-bold uppercase tracking-wide text-white"
      >
        partners@shoelocker.ke
      </a>
    ),
    'gift-cards': (
      <Link
        to="/rewards"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-brand-red px-6 text-[11px] font-bold uppercase tracking-wide text-white"
      >
        Kickback Rewards →
      </Link>
    ),
  };

  return actions[/** @type {keyof typeof actions} */ (slug)] || null;
}
