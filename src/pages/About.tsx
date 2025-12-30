import { motion } from 'framer-motion';
import { Heart, Book, Users, Award, Target, Globe } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

const values = [
  {
    icon: Heart,
    title: 'Dharma',
    description: 'Upholding righteousness and moral values in all aspects of community life.',
  },
  {
    icon: Book,
    title: 'Vidya',
    description: 'Promoting Vedic education and preserving ancient knowledge for future generations.',
  },
  {
    icon: Users,
    title: 'Sangha',
    description: 'Building a strong community network that supports each other through all life stages.',
  },
  {
    icon: Award,
    title: 'Seva',
    description: 'Encouraging selfless service to the community and society at large.',
  },
];

const stats = [
  { value: '5000+', label: 'Registered Members' },
  { value: '200+', label: 'Annual Events' },
  { value: '50+', label: 'Verified Pandits' },
  { value: '25+', label: 'Years of Service' },
];

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-cream to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              About Us
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            >
              Preserving Our Sacred <span className="text-gradient-saffron">Heritage</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              For generations, our Brahmin Samaj has been the custodian of Vedic traditions, 
              spiritual knowledge, and cultural practices. We are committed to carrying forward 
              this sacred responsibility into the digital age.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-saffron flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="font-heading text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                To unite the Brahmin community across geographical boundaries through technology, 
                while preserving our ancient traditions, supporting our priests, and nurturing 
                the spiritual growth of all members.
              </p>
              <ul className="space-y-3">
                {[
                  'Connect community members worldwide',
                  'Preserve and promote Vedic knowledge',
                  'Support priests and their families',
                  'Facilitate religious ceremonies and events',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-gold" />
                </div>
                <h2 className="font-heading text-3xl font-bold">Our Vision</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                To be the premier digital platform for the Brahmin community worldwide, 
                serving as a bridge between ancient wisdom and modern connectivity, 
                ensuring our rich heritage thrives for generations to come.
              </p>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-maroon/10 to-gold/10 border border-gold/20">
                <p className="text-lg font-heading italic text-foreground">
                  "वसुधैव कुटुम्बकम्"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  The world is one family - We embrace this ancient wisdom in building our global community.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              Our Core <span className="text-gradient-saffron">Values</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              The principles that guide everything we do
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-temple transition-all text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-maroon">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-heading font-bold text-gold mb-2">
                  {stat.value}
                </p>
                <p className="text-primary-foreground/70">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}