import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock, KeyRound, ArrowLeft, Eye, EyeOff, Phone } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

type ViewMode = 'login' | 'forgot-password' | 'update-password' | 'otp-reset';

// Password strength calculator
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 6) score += 20;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;
  
  if (score <= 30) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 50) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 70) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score: Math.min(score, 100), label: 'Strong', color: 'bg-green-500' };
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Password strength memo
  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

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
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      toast({
        title: 'Welcome Back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    
    if (error) {
      toast({
        title: 'Google Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    
    if (error) {
      toast({
        title: 'Apple Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber || mobileNumber.length < 10) {
      toast({
        title: 'Mobile Number Required',
        description: 'Please enter a valid mobile number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingOtp(true);
    
    try {
      const response = await supabase.functions.invoke('send-otp', {
        body: { mobile: mobileNumber, type: 'password_reset' },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: 'A 6-digit code has been sent to your mobile number.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Unable to send OTP. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSendingOtp(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the complete 6-digit code.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifyingOtp(true);
    
    try {
      const response = await supabase.functions.invoke('verify-otp', {
        body: { mobile: mobileNumber, otp, type: 'password_reset' },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setOtpVerified(true);
      toast({
        title: 'OTP Verified',
        description: 'Please set your new password.',
      });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    }
    setIsVerifyingOtp(false);
  };

  const handleOtpPasswordReset = async (e: React.FormEvent) => {
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
    
    try {
      const response = await supabase.functions.invoke('reset-password-with-otp', {
        body: { mobile: mobileNumber, newPassword },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been reset. Please login with your new password.',
      });
      setViewMode('login');
      setMobileNumber('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
      setOtpVerified(false);
    } catch (error: any) {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Unable to reset password. Please try again.',
        variant: 'destructive',
      });
    }
    setIsUpdating(false);
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
                        
                        {/* Password Strength Indicator */}
                        {newPassword && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-1 pt-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Password Strength</span>
                              <span className={`font-medium ${
                                passwordStrength.label === 'Weak' ? 'text-destructive' :
                                passwordStrength.label === 'Fair' ? 'text-orange-500' :
                                passwordStrength.label === 'Good' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${passwordStrength.score}%` }}
                                transition={{ duration: 0.3 }}
                                className={`h-full ${passwordStrength.color} rounded-full`}
                              />
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-0.5 pt-1">
                              <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                                • At least 8 characters
                              </li>
                              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                                • One uppercase letter
                              </li>
                              <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                                • One number
                              </li>
                              <li className={/[^a-zA-Z0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                                • One special character
                              </li>
                            </ul>
                          </motion.div>
                        )}
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
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-xs text-destructive">Passwords do not match</p>
                        )}
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

                {viewMode === 'otp-reset' && (
                  <motion.div
                    key="otp-reset"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Reset via OTP
                      </h1>
                      <p className="text-muted-foreground">
                        {!otpSent ? 'Enter your mobile number' : !otpVerified ? 'Enter the 6-digit code' : 'Set your new password'}
                      </p>
                    </div>

                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="mobile">Mobile Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="mobile"
                              type="tel"
                              placeholder="+91 9876543210"
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <Button
                          variant="hero"
                          className="w-full"
                          type="submit"
                          disabled={isSendingOtp}
                        >
                          {isSendingOtp ? 'Sending...' : 'Send OTP'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        <Button
                          variant="ghost"
                          className="w-full"
                          type="button"
                          onClick={() => setViewMode('forgot-password')}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Reset via Email Instead
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
                    ) : !otpVerified ? (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="block text-center">Enter OTP</Label>
                          <div className="flex justify-center">
                            <InputOTP
                              maxLength={6}
                              value={otp}
                              onChange={(value) => setOtp(value)}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            Sent to {mobileNumber}
                          </p>
                        </div>

                        <Button
                          variant="hero"
                          className="w-full"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otp.length !== 6}
                        >
                          {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            className="flex-1"
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtp('');
                            }}
                          >
                            Change Number
                          </Button>
                          <Button
                            variant="ghost"
                            className="flex-1"
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp}
                          >
                            Resend OTP
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleOtpPasswordReset} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="otp-new-password">New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="otp-new-password"
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
                          
                          {newPassword && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-1 pt-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Password Strength</span>
                                <span className={`font-medium ${
                                  passwordStrength.label === 'Weak' ? 'text-destructive' :
                                  passwordStrength.label === 'Fair' ? 'text-orange-500' :
                                  passwordStrength.label === 'Good' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {passwordStrength.label}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${passwordStrength.score}%` }}
                                  transition={{ duration: 0.3 }}
                                  className={`h-full ${passwordStrength.color} rounded-full`}
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="otp-confirm-password">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="otp-confirm-password"
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pl-10 pr-10"
                              required
                              minLength={6}
                            />
                          </div>
                          {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-destructive">Passwords do not match</p>
                          )}
                        </div>

                        <Button
                          variant="hero"
                          className="w-full"
                          type="submit"
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Updating...' : 'Reset Password'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </form>
                    )}
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
                        onClick={() => setViewMode('otp-reset')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Reset via OTP Instead
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

                    {/* Social Login Buttons */}
                    <div className="space-y-3 mb-6">
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={handleAppleLogin}
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Continue with Apple
                      </Button>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                      </div>
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

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remember-me"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                          />
                          <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                            Remember me
                          </Label>
                        </div>
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
