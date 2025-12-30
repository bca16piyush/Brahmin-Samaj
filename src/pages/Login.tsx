import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = () => {
    if (mobileNumber.length >= 10) {
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: `Verification code sent to ${mobileNumber}`,
      });
    }
  };

  const handleLogin = () => {
    if (otp.length === 6) {
      login(mobileNumber);
      toast({
        title: 'Welcome Back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }
  };

  return (
    <Layout>
      <section className="py-12 lg:py-20 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-2xl bg-card border border-border shadow-temple"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground">
                  Login to access your community
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {!otpSent ? (
                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={handleSendOtp}
                    disabled={mobileNumber.length < 10}
                  >
                    Send OTP
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className="text-lg tracking-widest text-center"
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        Didn't receive? <button className="text-primary hover:underline" onClick={handleSendOtp}>Resend</button>
                      </p>
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleLogin}
                      disabled={otp.length !== 6}
                    >
                      Login
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}

                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    New to our community?{' '}
                    <Link to="/register" className="text-primary hover:underline font-medium">
                      Register Now
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}