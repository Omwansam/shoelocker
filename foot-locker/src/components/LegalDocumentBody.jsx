import { Link } from 'react-router-dom';
import { legalDocuments } from '../data/legalDocuments.js';

/** @param {{ slug: 'terms' | 'privacy' | 'accessibility' }} props */
export function LegalDocumentBody({ slug }) {
  const doc = legalDocuments[slug];
  if (!doc) return null;

  return (
    <div className="legal-document">
      <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        <span className="font-semibold text-neutral-800">Last updated:</span> {doc.lastUpdated}
        . This document is maintained by ShoeLocker and applies to use of our website and
        services in Kenya.
      </p>

      <p className="mt-8 text-base leading-relaxed text-neutral-700 sm:text-lg">{doc.intro}</p>

      <div className="mt-10 space-y-10 border-t border-neutral-100 pt-10">
        {doc.sections.map((section) => (
          <section key={section.title} aria-labelledby={`legal-${slug}-${section.title}`}>
            <h2
              id={`legal-${slug}-${section.title}`}
              className="font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed] sm:text-xl"
            >
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-700 sm:text-base">
                {section.bullets.map((item) => (
                  <li key={item.slice(0, 48)}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-neutral-100 pt-8">
        {slug !== 'terms' ? (
          <Link
            to="/terms"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-800 transition hover:border-neutral-950"
          >
            Terms of use
          </Link>
        ) : null}
        {slug !== 'privacy' ? (
          <Link
            to="/privacy"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-800 transition hover:border-neutral-950"
          >
            Privacy policy
          </Link>
        ) : null}
        {slug !== 'accessibility' ? (
          <Link
            to="/accessibility"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-800 transition hover:border-neutral-950"
          >
            Accessibility
          </Link>
        ) : null}
        <Link
          to="/contact"
          className="rounded-full bg-neutral-950 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
