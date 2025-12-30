import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }
    setIsLoading(false);
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

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    New to our community?{' '}
                    <Link to="/register" className="text-primary hover:underline font-medium">
                      Register Now
                    </Link>
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
