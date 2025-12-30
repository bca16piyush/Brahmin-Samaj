import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const newsItems = [
  {
    id: 1,
    type: 'urgent',
    title: 'Maha Shivaratri Special Puja Registration Open',
    date: 'March 1, 2025',
    description: 'Register now for the grand Maha Shivaratri celebrations at the community temple.',
  },
  {
    id: 2,
    type: 'standard',
    title: 'Annual General Meeting Scheduled',
    date: 'February 15, 2025',
    description: 'All verified members are invited to attend the AGM at Community Hall.',
  },
  {
    id: 3,
    type: 'standard',
    title: 'New Panditji Profiles Added',
    date: 'January 28, 2025',
    description: 'Browse our updated directory with 15 new priests specializing in various ceremonies.',
  },
];

export function NewsSection() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <Bell className="w-4 h-4" />
              Latest Updates
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold text-foreground"
            >
              Community News
            </motion.h2>
          </div>
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            href="#"
            className="text-primary hover:text-primary/80 font-medium mt-4 md:mt-0"
          >
            View All News →
          </motion.a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {newsItems.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <Badge
                  variant={item.type === 'urgent' ? 'destructive' : 'secondary'}
                  className="gap-1"
                >
                  {item.type === 'urgent' && <AlertTriangle className="w-3 h-3" />}
                  {item.type === 'urgent' ? 'Urgent' : 'Update'}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}