import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ShieldCheck } from 'lucide-react';

export default function MyPass() {
  const { isAuthenticated, isLoading, profile, isVerified } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="w-80 h-[500px] rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  const uid = (profile as any).registration_uid || 'N/A';

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-[340px] sm:w-[380px] overflow-hidden border-2 border-primary/30 shadow-temple">
              {/* Header */}
              <div className="bg-gradient-saffron px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-primary-foreground font-heading text-2xl font-bold">ॐ</span>
                </div>
                <h2 className="font-heading text-lg font-bold text-primary-foreground">
                  Official Mahayagya Entry Pass
                </h2>
                <p className="text-primary-foreground/80 text-xs mt-0.5">
                  Digital Gate Pass
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 flex flex-col items-center gap-5 bg-card">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>

                {/* Name */}
                <div className="text-center">
                  <h3 className="font-heading text-xl font-bold text-foreground">{profile.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {isVerified ? (
                      <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Member
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {profile.verification_status === 'pending' ? 'Verification Pending' : 'Not Verified'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* UID */}
                <div className="w-full text-center bg-muted rounded-xl py-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Registration ID</p>
                  <p className="font-heading text-2xl font-bold tracking-widest text-foreground">{uid}</p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCode value={uid} size={180} level="H" />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Show this pass at the entry gate for verification
                </p>
              </div>

              {/* Footer */}
              <div className="bg-accent px-6 py-3 text-center">
                <p className="text-accent-foreground text-xs font-medium">
                  महायज्ञ • Mahayagya Community
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
