import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { AboutSection } from '@/components/home/AboutSection';
import { NewsSection } from '@/components/home/NewsSection';
import { PanditjiPreview } from '@/components/home/PanditjiPreview';
import { GalleryPreview } from '@/components/home/GalleryPreview';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <NewsSection />
      <PanditjiPreview />
      <GalleryPreview />
      <CTASection />
    </Layout>
  );
};

export default Index;