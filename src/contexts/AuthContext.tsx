import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'guest' | 'registered' | 'verified';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  gotra?: string;
  fatherName?: string;
  nativeVillage?: string;
  referencePerson?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  login: (mobile: string) => void;
  logout: () => void;
  submitVerification: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo
const mockVerifiedUser: User = {
  id: '1',
  name: 'Ramesh Sharma',
  mobile: '+91 98765 43210',
  role: 'verified',
  gotra: 'Bharadwaj',
  verificationStatus: 'verified',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (mobile: string) => {
    // Simulate login - in real app, this would verify OTP
    setUser({
      id: '2',
      name: 'Guest User',
      mobile,
      role: 'registered',
      verificationStatus: 'none',
    });
  };

  const logout = () => {
    setUser(null);
  };

  const submitVerification = (data: Partial<User>) => {
    if (user) {
      setUser({
        ...user,
        ...data,
        verificationStatus: 'pending',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isVerified: user?.verificationStatus === 'verified',
        login,
        logout,
        submitVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}