import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Youtube, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-maroon text-primary-foreground">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold text-xl">ॐ</span>
              </div>
              <h3 className="font-heading text-xl font-semibold">Brahmin Samaj</h3>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Connecting our community through culture, tradition, and shared heritage. Preserving our lineage for future generations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'About Us', 'Panditji Directory', 'Events', 'Gallery', 'Donations'].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-primary-foreground/70 hover:text-gold transition-colors text-sm"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 mt-0.5 text-gold" />
                <span className="text-primary-foreground/80">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 mt-0.5 text-gold" />
                <span className="text-primary-foreground/80">info@brahminsamaj.org</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-gold" />
                <span className="text-primary-foreground/80">
                  Community Center, Temple Road<br />
                  Varanasi, Uttar Pradesh
                </span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: '#' },
                { icon: Youtube, href: '#' },
                { icon: Instagram, href: '#' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-gold/20 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <p className="mt-6 text-xs text-primary-foreground/60">
              Join our WhatsApp community for updates
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Brahmin Samaj. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}