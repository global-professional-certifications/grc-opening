import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { useUser } from './UserContext';

interface EmployerProfile {
  companyName: string;
  isVerified: boolean;
  logoUrl?: string | null;
  industry?: string | null;
  companySize?: string | null;
}

interface EmployerProfileContextValue {
  profile: EmployerProfile | null;
  companyName: string;
  isLoading: boolean;
}

const EmployerProfileContext = createContext<EmployerProfileContextValue>({
  profile: null,
  companyName: '',
  isLoading: true,
});

export function EmployerProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'EMPLOYER') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiFetch<{ profile: EmployerProfile }>('/profile/employer')
      .then(res => setProfile(res.profile))
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, [user]);

  // Derive a safe display name: company name → email local part → 'Employer'
  const companyName =
    profile?.companyName ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Employer';

  return (
    <EmployerProfileContext.Provider value={{ profile, companyName, isLoading }}>
      {children}
    </EmployerProfileContext.Provider>
  );
}

export function useEmployerProfile() {
  return useContext(EmployerProfileContext);
}
