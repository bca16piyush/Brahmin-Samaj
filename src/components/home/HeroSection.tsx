import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import heroImage from '@/assets/hero-temple.jpg';

export function HeroSection() {
  const { data: config } = useSiteConfig();
  const ctaButton = config?.homepage_cta_button;

  return <section className="relative min-h-[90vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Sacred yagya fire ceremony" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon/90 via-maroon/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-medium mb-6 border border-gold/30">
              श्री प्रखर परोपकार मिशन
            </span>
          </motion.div>

          <motion.h1 initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.1
        }} className="text-2xl lg:text-4xl font-bold text-primary-foreground leading-tight mb-6 text-center font-sans md:text-3xl">विश्वव्यापी आतंकवाद का शमन, हिन्दू राष्ट्र निर्माण एवं विश्व शान्ति हेतु </motion.h1>

        <motion.p initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }} className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
            परम पूज्य अनन्तश्री विभूषित स्वामी श्री प्रखर जी महाराज के सानिध्य में 2000 विद्वान ब्राह्मणों द्वारा 
            43 दिनों में 200 कुण्डीय विराट शत (100) गायत्री पुरश्चरण महायज्ञ
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.3
        }} className="flex flex-col sm:flex-row gap-4">
            <Link to="/news">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                News & Upcoming Events
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            {ctaButton?.enabled !== false && (
              <Link to={ctaButton?.url || '/about'}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20">
                  {ctaButton?.text || 'About Guruji'}
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.4
        }} className="flex flex-wrap gap-8 mt-12">
            {[{
            icon: Flame,
            value: '9+',
            label: 'Lakh Chandi Yagyas'
          }, {
            icon: Calendar,
            value: '35+',
            label: 'Years of Service'
          }, {
            icon: Users,
            value: '2500+',
            label: 'Vedic Scholars'
          }].map(({
            icon: Icon,
            value,
            label
          }) => <div key={label} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-primary-foreground">{value}</p>
                  <p className="text-sm text-primary-foreground/70">{label}</p>
                </div>
              </div>)}
          </motion.div>
        </div>
      </div>
    </section>;
}