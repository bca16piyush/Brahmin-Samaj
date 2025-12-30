import { motion } from 'framer-motion';
import { BookOpen, Heart, Users, Star } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Vedic Traditions',
    description: 'Preserving and teaching ancient Vedic knowledge and rituals for generations.',
  },
  {
    icon: Heart,
    title: 'Community Support',
    description: 'A network of families supporting each other through all life ceremonies.',
  },
  {
    icon: Users,
    title: 'Gotra Registry',
    description: 'Maintaining lineage records to preserve our sacred heritage.',
  },
  {
    icon: Star,
    title: 'Spiritual Events',
    description: 'Regular havans, pujas, and celebrations bringing the community together.',
  },
];

export function AboutSection() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            Our Mission
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6"
          >
            Preserving Heritage,{' '}
            <span className="text-gradient-saffron">Building Future</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            We are dedicated to maintaining the sacred traditions of Brahmin culture while 
            embracing modern technology to connect our community across the globe.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 lg:p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-saffron flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}