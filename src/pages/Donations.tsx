import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Package, Copy, Check, MapPin, Gift, Heart } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const inKindItems = ['Ghee', 'Rice', 'Wheat', 'Clothes', 'Utensils', 'Books', 'Other'];
const dropOffLocations = [
  'Community Center - Varanasi',
  'Temple Trust Office - Allahabad',
  'Samaj Bhawan - Lucknow',
  'Delhi Chapter Office',
];

const bankDetails = {
  bankName: 'Kotak Mahindra Bank',
  accountName: 'Brahmin Samaj Trust',
  accountNumber: '1234567890123456',
  ifsc: 'KKBK0001234',
  upiId: 'brahminsamaj@kotak',
};

export default function Donations() {
  const [copied, setCopied] = useState<string | null>(null);
  const [inKindForm, setInKindForm] = useState({
    itemType: '',
    quantity: '',
    location: '',
    message: '',
  });
  const { toast } = useToast();
  const { isVerified } = useAuth();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: 'Copied!',
      description: `${field} copied to clipboard`,
    });
  };

  const handleInKindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Donation Pledged!',
      description: 'Thank you for your generous donation. We will contact you shortly.',
    });
    setInKindForm({ itemType: '', quantity: '', location: '', message: '' });
  };

  if (!isVerified) {
    return (
      <Layout>
        <section className="py-12 lg:py-20 min-h-[60vh] flex items-center">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
              Donations for Verified Members
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Please complete your Brahmin verification to access the donation portal and contribute to our community.
            </p>
            <Link to="/register">
              <Button variant="hero">Get Verified</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <Gift className="w-4 h-4" />
              Support Our Community
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Make a <span className="text-gradient-saffron">Donation</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Your contributions help us preserve our traditions and support community welfare
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <Tabs defaultValue="monetary" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="monetary" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Monetary
                </TabsTrigger>
                <TabsTrigger value="inkind" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  In-Kind (Goods)
                </TabsTrigger>
              </TabsList>

              {/* Monetary Donation */}
              <TabsContent value="monetary">
                <div className="p-8 rounded-2xl bg-card border border-border shadow-temple">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="font-heading text-xl font-semibold mb-2">Bank Transfer / UPI</h2>
                    <p className="text-muted-foreground text-sm">
                      Transfer directly to our trust account
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Bank Details */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                      {[
                        { label: 'Bank Name', value: bankDetails.bankName },
                        { label: 'Account Name', value: bankDetails.accountName },
                        { label: 'Account Number', value: bankDetails.accountNumber },
                        { label: 'IFSC Code', value: bankDetails.ifsc },
                        { label: 'UPI ID', value: bankDetails.upiId },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-medium font-mono">{value}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(value, label)}
                            className="shrink-0"
                          >
                            {copied === label ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="text-center pt-6 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-4">Scan to pay via UPI</p>
                      <div className="w-48 h-48 bg-muted rounded-xl mx-auto flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-32 bg-foreground/10 rounded-lg grid grid-cols-5 gap-0.5 p-2">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <div
                                key={i}
                                className={`rounded-sm ${Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">UPI QR Code</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* In-Kind Donation */}
              <TabsContent value="inkind">
                <div className="p-8 rounded-2xl bg-card border border-border shadow-temple">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-gold" />
                    </div>
                    <h2 className="font-heading text-xl font-semibold mb-2">Donate Goods</h2>
                    <p className="text-muted-foreground text-sm">
                      Pledge items for community events and welfare
                    </p>
                  </div>

                  <form onSubmit={handleInKindSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="itemType">Item Type *</Label>
                        <Select
                          value={inKindForm.itemType}
                          onValueChange={(value) => setInKindForm({ ...inKindForm, itemType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inKindItems.map((item) => (
                              <SelectItem key={item} value={item}>{item}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          required
                          placeholder="e.g., 5 kg, 10 pieces"
                          value={inKindForm.quantity}
                          onChange={(e) => setInKindForm({ ...inKindForm, quantity: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Drop-off Location *</Label>
                      <Select
                        value={inKindForm.location}
                        onValueChange={(value) => setInKindForm({ ...inKindForm, location: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropOffLocations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              <span className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                {loc}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Any special instructions or dedication..."
                        value={inKindForm.message}
                        onChange={(e) => setInKindForm({ ...inKindForm, message: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <Button variant="hero" type="submit" className="w-full">
                      <Gift className="w-4 h-4 mr-2" />
                      Pledge Donation
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}