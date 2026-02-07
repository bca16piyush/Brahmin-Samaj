import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, User, Shield, FileCheck, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { signUpSchema, verificationSchema, cleanMobileNumber } from '@/lib/registrationValidation';
import { z } from 'zod';

const gotras = [
  'Bharadwaj', 'Kashyap', 'Shandilya', 'Vashishtha', 'Gautam',
  'Agastya', 'Atri', 'Bhrigu', 'Jamadagni', 'Vishwamitra', 'Other'
];

type Step = 1 | 2 | 3;

type FieldErrors = {
  [key: string]: string | undefined;
};

export default function Register() {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
  });
  const [formData, setFormData] = useState({
    gotra: '',
    father_name: '',
    native_village: '',
    reference_person: '',
    reference_mobile: '',
  });
  const { toast } = useToast();
  const { signUp, submitVerification } = useAuth();
  const navigate = useNavigate();

  // Validate a single field and update errors
  const validateField = (field: string, value: string, schema: z.ZodObject<any>) => {
    try {
      schema.shape[field].parse(value);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: error.errors[0]?.message }));
      }
    }
  };

  // Handle input change with validation
  const handleSignUpChange = (field: keyof typeof signUpData, value: string) => {
    setSignUpData((prev) => ({ ...prev, [field]: value }));
    // Debounce validation for better UX
    if (value.length > 0) {
      validateField(field, value, signUpSchema);
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleVerificationChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (value.length > 0 && field !== 'reference_person' && field !== 'reference_mobile') {
      validateField(field, value, verificationSchema);
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    // Use cleaned mobile number
    const cleanedMobile = cleanMobileNumber(signUpData.mobile);
    
    const { error } = await signUp(
      signUpData.email.trim(),
      signUpData.password,
      signUpData.name.trim(),
      cleanedMobile
    );
    
    if (error) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created',
        description: 'Please complete your verification details.',
      });
      setStep(2);
    }
    setIsLoading(false);
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = verificationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    const cleanedRefMobile = formData.reference_mobile ? cleanMobileNumber(formData.reference_mobile) : '';
    
    const { error } = await submitVerification({
      name: signUpData.name.trim(),
      gotra: formData.gotra,
      father_name: formData.father_name.trim(),
      native_village: formData.native_village.trim(),
      reference_person: formData.reference_person.trim(),
      reference_mobile: cleanedRefMobile,
    });
    
    if (error) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setStep(3);
      toast({
        title: 'Verification Submitted',
        description: 'Your request is being reviewed by our admin team.',
      });
    }
    setIsLoading(false);
  };

  // Error display component
  const FieldError = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return (
      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {errors[field]}
      </p>
    );
  };

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-12">
              {[
                { num: 1, label: 'Account', icon: User },
                { num: 2, label: 'Verification', icon: Shield },
                { num: 3, label: 'Complete', icon: FileCheck },
              ].map(({ num, label, icon: Icon }, index) => (
                <div key={num} className="flex items-center">
                  <div className={`flex items-center gap-2 ${step >= num ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= num ? 'bg-gradient-saffron text-primary-foreground' : 'bg-muted'
                    }`}>
                      {step > num ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{label}</span>
                  </div>
                  {index < 2 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > num ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Account Creation */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl bg-card border border-border shadow-temple"
              >
                <div className="text-center mb-8">
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Join Our Community
                  </h1>
                  <p className="text-muted-foreground">
                    Create your account to get started
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={signUpData.name}
                      onChange={(e) => handleSignUpChange('name', e.target.value)}
                      placeholder="Your full name"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    <FieldError field="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={signUpData.email}
                        onChange={(e) => handleSignUpChange('email', e.target.value)}
                        placeholder="your@email.com"
                        className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      />
                    </div>
                    <FieldError field="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="mobile"
                        type="tel"
                        value={signUpData.mobile}
                        onChange={(e) => handleSignUpChange('mobile', e.target.value)}
                        placeholder="9876543210"
                        className={`pl-10 ${errors.mobile ? 'border-destructive' : ''}`}
                      />
                    </div>
                    <FieldError field="mobile" />
                    <p className="text-xs text-muted-foreground">Enter 10-digit Indian mobile number</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={signUpData.password}
                        onChange={(e) => handleSignUpChange('password', e.target.value)}
                        placeholder="••••••••"
                        className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                      />
                    </div>
                    <FieldError field="password" />
                  </div>
                  <Button variant="hero" className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Already a member? <Link to="/login" className="text-primary hover:underline">Login</Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* Step 2: Verification Form */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl bg-card border border-border shadow-temple"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-gold" />
                  </div>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Brahmin Verification
                  </h1>
                  <p className="text-muted-foreground">
                    Complete your lineage details for verification
                  </p>
                </div>

                <form onSubmit={handleSubmitVerification} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gotra">Gotra *</Label>
                      <Select
                        value={formData.gotra}
                        onValueChange={(value) => handleVerificationChange('gotra', value)}
                      >
                        <SelectTrigger className={errors.gotra ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select your Gotra" />
                        </SelectTrigger>
                        <SelectContent>
                          {gotras.map((gotra) => (
                            <SelectItem key={gotra} value={gotra}>{gotra}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError field="gotra" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father's Name *</Label>
                      <Input
                        id="fatherName"
                        value={formData.father_name}
                        onChange={(e) => handleVerificationChange('father_name', e.target.value)}
                        placeholder="Enter father's name"
                        className={errors.father_name ? 'border-destructive' : ''}
                      />
                      <FieldError field="father_name" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="village">Native Village *</Label>
                    <Input
                      id="village"
                      value={formData.native_village}
                      onChange={(e) => handleVerificationChange('native_village', e.target.value)}
                      placeholder="Enter native village"
                      className={errors.native_village ? 'border-destructive' : ''}
                    />
                    <FieldError field="native_village" />
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="font-heading text-lg font-semibold mb-4">Reference Person</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Provide details of an existing verified community member who can vouch for you
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="refName">Reference Name</Label>
                        <Input
                          id="refName"
                          value={formData.reference_person}
                          onChange={(e) => handleVerificationChange('reference_person', e.target.value)}
                          placeholder="Name of reference person"
                          className={errors.reference_person ? 'border-destructive' : ''}
                        />
                        <FieldError field="reference_person" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="refMobile">Reference Mobile</Label>
                        <Input
                          id="refMobile"
                          type="tel"
                          value={formData.reference_mobile}
                          onChange={(e) => handleVerificationChange('reference_mobile', e.target.value)}
                          placeholder="9876543210"
                          className={errors.reference_mobile ? 'border-destructive' : ''}
                        />
                        <FieldError field="reference_mobile" />
                        <p className="text-xs text-muted-foreground">10-digit Indian mobile number</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="hero" type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Submit for Verification'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl bg-card border border-border shadow-temple text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-gold" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Verification Pending
                </h1>
                <div className="bg-gold/10 rounded-lg p-4 mb-6">
                  <p className="text-foreground">
                    Your request is being reviewed by our admin team. You will be notified once approved.
                  </p>
                </div>
                <p className="text-muted-foreground mb-6">
                  In the meantime, you have <strong>Guest Access</strong> to browse public content.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/">
                    <Button variant="hero">Explore Platform</Button>
                  </Link>
                  <Link to="/panditji">
                    <Button variant="outline">Browse Panditji</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
