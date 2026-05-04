import { Link } from 'react-router-dom';
import { BrandStrip } from '../components/BrandStrip.jsx';
import { HeroCarousel } from '../components/HeroCarousel.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton.jsx';
import { REWARDS_PROGRAM } from '../config/brand.js';
import { useProducts } from '../hooks/useProducts.js';

export function Home() {
  const { products, loading } = useProducts({ delayMs: 480 });

  const featured = [...products].filter((p) => p.isNew).slice(0, 4);
  const trending =
    [...products].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);

  const cats = [
    {
      slug: 'men',
      title: "Men's",
      subtitle: 'Shoes • basketball • casual',
      img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80',
    },
    {
      slug: 'women',
      title: "Women's",
      subtitle: 'Running • lifestyle',
      img: 'https://images.unsplash.com/photo-1595950653106-6c79ebd73435?auto=format&fit=crop&w=900&q=80',
    },
    {
      slug: 'kids',
      title: "Kids'",
      subtitle: 'Playground heat',
      img: 'https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=900&q=80',
    },
    {
      slug: 'kids',
      title: 'Clothing & Accessories',
      subtitle: 'Coming soon • shop kicks now',
      img: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=80',
      href: '/shop',
    },
  ];

  return (
    <>
      <HeroCarousel />

      <section aria-label="Category shortcuts" className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-3 md:grid-cols-6 md:gap-4 md:py-8 lg:px-8">
          {[
            ["Men's", '/shop?category=men'],
            ["Women's", '/shop?category=women'],
            ["Kids'", '/shop?category=kids'],
            ['New arrivals', '/releases'],
            ['Releases', '/releases'],
            ['Sale', '/sale'],
          ].map(([label, href]) => (
            <Link
              key={label}
              to={href}
              className="flex flex-col items-center justify-center border border-neutral-200 bg-neutral-50 py-5 text-[12px] font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] transition hover:border-neutral-950 hover:bg-white hover:shadow-sm sm:text-[13px]"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <article className="relative min-h-[320px] bg-neutral-900">
          <img
            src="https://images.unsplash.com/photo-1549294413-26f195200c54?auto=format&fit=crop&w=1400&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="relative flex h-full min-h-[320px] flex-col justify-end px-8 py-12 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-red">
              Signature hoops
            </p>
            <h2 className="mt-2 max-w-xs text-pretty font-[800] uppercase leading-tight tracking-tighter [font-stretch:condensed] sm:text-3xl">
              Stay playoff ready
            </h2>
            <p className="mt-3 max-w-sm text-sm text-neutral-300">
              High-traction soles and plush collars — cue the tunnel walk.
            </p>
            <Link
              to="/shop?category=men"
              className="mt-6 inline-flex w-fit bg-white px-6 py-2.5 text-[12px] font-bold uppercase tracking-wide text-neutral-950"
            >
              Shop basketball styles
            </Link>
          </div>
        </article>
        <article className="relative min-h-[320px] bg-neutral-900">
          <img
            src="https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=1400&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="relative flex h-full min-h-[320px] flex-col justify-end px-8 py-12 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-red">
              Everyday comfort
            </p>
            <h2 className="mt-2 max-w-xs text-pretty font-[800] uppercase leading-tight tracking-tighter [font-stretch:condensed] sm:text-3xl">
              Comfy all season
            </h2>
            <p className="mt-3 max-w-sm text-sm text-neutral-300">
              Lifestyle runners tuned for errands, lounges, and long days.
            </p>
            <Link
              to="/shop?category=women"
              className="mt-6 inline-flex w-fit bg-white px-6 py-2.5 text-[12px] font-bold uppercase tracking-wide text-neutral-950"
            >
              Shop casual & running
            </Link>
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
              Stock up by category
            </h2>
            <p className="mt-2 text-neutral-600">
              Shop the silhouettes everyone’s wearing — stacked by aisle the
              ShoeLocker way.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-[13px] font-bold uppercase tracking-wide text-brand-red underline-offset-4 hover:underline"
          >
            Continue to full shop →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((c, idx) => (
            <Link
              key={c.title + idx}
              to={c.href ?? `/shop?category=${c.slug}`}
              className="group relative overflow-hidden border border-neutral-200 bg-neutral-100 transition hover:border-neutral-950"
            >
              <img
                src={c.img}
                alt=""
                className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105 sm:aspect-[10/11]"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xl font-[800] uppercase [font-stretch:condensed]">
                  {c.title}
                </p>
                <p className="text-sm text-neutral-200">{c.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BrandStrip />

      <section className="border-y border-neutral-800 bg-neutral-950 py-14 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-red">
              {REWARDS_PROGRAM}
            </p>
            <h2 className="mt-2 text-3xl font-[800] uppercase tracking-tighter [font-stretch:condensed]">
              Unlock perks with every cop
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Earn on footwear and accessories — tiers, boosts, and shipping
              perks ship with our next backend release.
            </p>
          </div>
          <Link
            to="/rewards"
            className="w-full shrink-0 border-2 border-white px-10 py-3 text-center text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-neutral-950 sm:w-auto"
          >
            Join {REWARDS_PROGRAM}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-[800] uppercase tracking-tighter [font-stretch:condensed] sm:text-3xl">
              Featured picks
            </h2>
            <p className="mt-1 text-neutral-600">New heat on the homepage wall.</p>
          </div>
          <Link
            to="/shop"
            className="text-[13px] font-bold uppercase text-brand-red hover:underline"
          >
            View all shoes
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(featured.length ? featured : products.slice(0, 4)).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-[800] uppercase tracking-tighter [font-stretch:condensed] sm:text-3xl">
              Popular right now
            </h2>
            <p className="mt-2 text-neutral-600">
              Swipe sideways on your phone — steady favorites on desktop.
            </p>
          </div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-[76vw] shrink-0">
                  <div className="h-[420px] rounded-lg border bg-white" />
                </div>
              ))}
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:mx-0 sm:overflow-visible sm:px-0">
              <div className="flex min-w-max snap-x gap-4 sm:grid sm:min-w-0 sm:snap-none sm:grid-cols-2 lg:grid-cols-4">
                {trending.map((p) => (
                  <div
                    key={p.id}
                    className="w-[76vw] shrink-0 snap-center sm:w-auto sm:shrink"
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
