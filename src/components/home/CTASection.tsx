import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  'Access full Panditji contact details',
  'Download high-resolution gallery images',
  'Watch exclusive live streams',
  'Connect with community members',
];

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-maroon relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-saffron/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6"
          >
            Join Our Sacred Community Today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-primary-foreground/80 mb-8"
          >
            Become a verified member and unlock all the features of our community platform
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-10"
          >
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-left">
                <CheckCircle className="w-5 h-5 text-gold shrink-0" />
                <span className="text-primary-foreground/90">{benefit}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link to="/register">
              <Button variant="hero" size="lg">
                Get Verified
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg" className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}