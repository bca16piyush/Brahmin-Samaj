import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface LockedContentProps {
  children: React.ReactNode;
  message?: string;
}

export function LockedContent({ children, message = 'Become a verified member to unlock this content' }: LockedContentProps) {
  const { isVerified } = useAuth();

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-lock pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
            {message}
          </p>
          <Link to="/register">
            <Button variant="hero" size="sm">
              Register Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}