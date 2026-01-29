import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type ViewMode = 'login' | 'forgot-password' | 'update-password';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Check for password reset token in URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setViewMode('update-password');
    }
  }, []);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    
    if (error) {
      toast({
        title: 'Reset Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset Email Sent',
        description: 'Check your email for the password reset link.',
      });
      setViewMode('login');
    }
    setIsResetting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated. Please login with your new password.',
      });
      // Clear hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      setViewMode('login');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsUpdating(false);
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
              <AnimatePresence mode="wait">
                {viewMode === 'update-password' && (
                  <motion.div
                    key="update-password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Set New Password
                      </h1>
                      <p className="text-muted-foreground">
                        Enter your new password below
                      </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="confirm-password"
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      <Button
                        variant="hero"
                        className="w-full"
                        type="submit"
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Updating...' : 'Update Password'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </motion.div>
                )}

                {viewMode === 'forgot-password' && (
                  <motion.div
                    key="forgot-password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Reset Password
                      </h1>
                      <p className="text-muted-foreground">
                        Enter your email to receive a reset link
                      </p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <Button
                        variant="hero"
                        className="w-full"
                        type="submit"
                        disabled={isResetting}
                      >
                        {isResetting ? 'Sending...' : 'Send Reset Link'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full"
                        type="button"
                        onClick={() => setViewMode('login')}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                      </Button>
                    </form>
                  </motion.div>
                )}

                {viewMode === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
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
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setViewMode('forgot-password')}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          Forgot Password?
                        </button>
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
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}