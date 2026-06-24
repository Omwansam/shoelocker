import { BrandStrip } from '../components/BrandStrip.jsx';
import { CategoryShortcuts } from '../components/CategoryShortcuts.jsx';
import { DualPromoBanners } from '../components/DualPromoBanners.jsx';
import { FreshApparelSection } from '../components/FreshApparelSection.jsx';
import { FeaturedPicksSection } from '../components/FeaturedPicksSection.jsx';
import { PopularNowSection } from '../components/PopularNowSection.jsx';
import { RewardsPromoSection } from '../components/RewardsPromoSection.jsx';
import { HeroCarousel } from '../components/HeroCarousel.jsx';
import { StyleCollections } from '../components/StyleCollections.jsx';

export function Home() {
  return (
    <>
      <HeroCarousel />

      <CategoryShortcuts />

      <DualPromoBanners />

      <StyleCollections />

      <BrandStrip />

      <FreshApparelSection />

      <FeaturedPicksSection />

      <PopularNowSection />

      <RewardsPromoSection />
    </>
  );
}
