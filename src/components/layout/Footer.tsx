import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Youtube, Instagram, Download } from 'lucide-react';
export function Footer() {
  return <footer className="bg-maroon text-primary-foreground">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold text-xl">ॐ</span>
              </div>
              <h3 className="font-heading text-xl font-semibold">महायज्ञ</h3>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed font-sans">
              परम पूज्य अनन्तश्री विभूषित स्वामी श्री प्रखर जी महाराज के सानिध्य में 2000 विद्वान ब्राह्मणों द्वारा 43 दिनों में 200 कुण्डीय विराट शत (100) गायत्री पुरश्चरण महायज्ञ



            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[{
              name: 'Home',
              href: '/'
            }, {
              name: 'About Us',
              href: '/about'
            }, {
              name: 'News & Events',
              href: '/news'
            }, {
              name: 'Brahmin Directory',
              href: '/panditji'
            }, {
              name: 'Yagyas',
              href: '/yagyas'
            }, {
              name: 'Past Event Live',
              href: '/past-event-live'
            }, {
              name: 'Gallery',
              href: '/gallery'
            }, {
              name: 'Donations',
              href: '/donations'
            }, {
              name: 'Install App',
              href: '/install',
              icon: Download
            }, {
              name: 'Privacy Policy',
              href: '/privacy'
            }].map(link => <li key={link.name}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-gold transition-colors text-sm flex items-center gap-2">
                    {link.icon && <link.icon className="w-3 h-3" />}
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 mt-0.5 text-gold" />
                <span className="text-primary-foreground/80">+91 9001291248</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 mt-0.5 text-gold" />
                <span className="text-primary-foreground/80">pushkar.mahayagya@gmail.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-gold" />
                <span className="text-primary-foreground/80">
                  श्री प्रखर परोपकार मिशन<br />
                  काशी, वाराणसी
                </span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              {[{
              icon: Facebook,
              href: '#'
            }, {
              icon: Youtube,
              href: '#'
            }, {
              icon: Instagram,
              href: '#'
            }].map(({
              icon: Icon,
              href
            }, i) => <a key={i} href={href} className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-gold/20 flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </a>)}
            </div>
            <a href="https://wa.me/919001291248" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-gold transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Join our WhatsApp community
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Mahayagya - श्री प्रखर परोपकार मिशन. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
}