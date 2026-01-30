import { Layout } from '@/components/layout/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-8">
          Privacy Policy
        </h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Mahayagya ("we," "our," or "us"). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our mobile application and website.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, father's name, gotra, and native village when you register an account.</li>
              <li><strong>Reference Information:</strong> Reference person name and contact details for verification purposes.</li>
              <li><strong>Booking Information:</strong> Details about pandit bookings, ceremony types, dates, and locations.</li>
              <li><strong>Donation Information:</strong> Records of monetary and in-kind donations.</li>
              <li><strong>Event Registrations:</strong> Information about events you register for or attend.</li>
              <li><strong>Communication Preferences:</strong> WhatsApp number and notification preferences.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage your account</li>
              <li>Process pandit bookings and event registrations</li>
              <li>Track and acknowledge donations</li>
              <li>Send notifications about events, bookings, and updates</li>
              <li>Verify user identity through reference checks</li>
              <li>Improve our services and user experience</li>
              <li>Respond to your inquiries and provide support</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information in the following situations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>With Pandits:</strong> Booking details are shared with the pandit you book for ceremony coordination.</li>
              <li><strong>With Administrators:</strong> Our authorized administrators access information to manage services.</li>
              <li><strong>For Legal Compliance:</strong> When required by law or to protect our rights.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal 
              information. This includes encryption, secure servers, and access controls. However, no method of 
              transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide 
              you services. We may retain certain information for legal, accounting, or reporting purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under 18 years of age. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p><strong>Mahayagya - श्री प्रखर परोपकार मिशन</strong></p>
              <p>Email: info@mahayagya.com</p>
              <p>Phone: +91 9001291248</p>
              <p>Address: काशी, वाराणसी</p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
