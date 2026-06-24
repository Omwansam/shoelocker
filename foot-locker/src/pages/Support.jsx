import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_NAME } from '../config/brand.js';
import { contentPages, contentPagesBySlug } from '../config/footerLinks.js';
import { DeveloperCredit } from '../components/DeveloperCredit.jsx';
import { useStoreSettings } from '../hooks/useStoreSettings.js';
import { fetchSupportArticles } from '../utils/api.js';

const CATEGORY_LABELS = {
  help: 'Help',
  company: 'Company',
  policy: 'Policy',
};

const TONE_CHIP = {
  help: 'bg-neutral-950 text-white',
  company: 'bg-brand-red/10 text-brand-red border-brand-red/20',
  policy: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export function Support() {
  const { settings } = useStoreSettings();
  const [articles, setArticles] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setLoadError(false);
    fetchSupportArticles({ signal: ac.signal })
      .then((list) => setArticles(list))
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
        setLoadError(true);
        setArticles([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const supportEmail = settings?.support_email || 'hello@shoelocker.ke';

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
          Support hub
        </p>
        <h1 className="mt-2 font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-4xl lg:text-5xl">
          Help &amp; policies
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-600">
          Pick a topic below — each opens its own page with live content from the
          store backend. Or{' '}
          <Link to="/stores" className="font-semibold text-brand-red hover:underline">
            find a store
          </Link>
          .
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-950 p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-red">
            Need a human?
          </p>
          <p className="mt-1 text-lg font-[800] uppercase tracking-tight [font-stretch:condensed]">
            Contact the care desk
          </p>
          <p className="mt-1 text-sm text-neutral-400">Same-day replies on Nairobi business days.</p>
        </div>
        <Link
          to="/contact"
          className="mt-4 inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-7 text-[12px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-100 sm:mt-0"
        >
          Contact page →
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      ) : loadError ? (
        <p className="mt-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center text-neutral-600">
          Could not load help articles. Make sure the backend is running, then refresh.
        </p>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const page = contentPagesBySlug[article.slug];
            const tone = page?.tone || 'help';
            const href = page?.path || '/support';
            return (
              <Link
                key={article.id}
                to={href}
                className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] transition hover:border-neutral-300 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${TONE_CHIP[tone] || TONE_CHIP.help}`}
                  >
                    {CATEGORY_LABELS[/** @type {keyof typeof CATEGORY_LABELS} */ (article.category)] ||
                      article.category}
                  </span>
                  <h2 className="mt-4 font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed] sm:text-xl">
                    {article.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                    {article.body}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand-red">
                  Open page
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-14 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">
          All help pages
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {contentPages.map((page) => (
            <li key={page.path}>
              <Link
                to={page.path}
                className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
              >
                {page.footerLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 flex flex-col gap-2 border-t border-neutral-200 pt-8">
        <p className="text-xs text-neutral-400">{COMPANY_NAME} — Nairobi, Kenya.</p>
        <DeveloperCredit variant="muted" />
      </div>
    </div>
  );
}
