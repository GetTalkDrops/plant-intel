'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { OrganizationSetupForm } from '@/components/onboarding/OrganizationSetupForm';
import { useApiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const apiClient = useApiClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/onboarding');
      return;
    }

    // Check if onboarding is already complete
    if (isLoaded && isSignedIn) {
      checkOnboardingStatus();
    }
  }, [isLoaded, isSignedIn, router]);

  const checkOnboardingStatus = async () => {
    try {
      const status = await apiClient.getOnboardingStatus();

      // If organization setup is complete, redirect to dashboard
      if (status.steps?.organization_setup) {
        router.push('/dashboard');
        return;
      }

      setChecking(false);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setChecking(false);
    }
  };

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <OrganizationSetupForm />
    </div>
  );
}
