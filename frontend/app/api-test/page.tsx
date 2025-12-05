'use client';

import { useApiClient } from '@/lib/api-client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function APITestPage() {
  const api = useApiClient();
  const [healthResult, setHealthResult] = useState<any>(null);
  const [profilesResult, setProfilesResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const testHealthCheck = async () => {
    try {
      setLoading('health');
      setHealthResult(null);

      const result = await api.healthCheck();
      setHealthResult(result);

      console.log('✅ Health check successful:', result);
      toast.success('Health check passed!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Health check failed:', err);
      toast.error(`Health check failed: ${errorMessage}`);
      setHealthResult({ error: errorMessage });
    } finally {
      setLoading(null);
    }
  };

  const testMappingProfiles = async () => {
    try {
      setLoading('profiles');
      setProfilesResult(null);

      const result = await api.mappings.list();
      setProfilesResult(result);

      console.log('✅ Mapping profiles fetch successful:', result);
      toast.success('Mapping profiles fetched!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Mapping profiles fetch failed:', err);
      toast.error(`Fetch failed: ${errorMessage}`);
      setProfilesResult({ error: errorMessage });
    } finally {
      setLoading(null);
    }
  };

  const testDirectFetch = async () => {
    try {
      setLoading('direct');

      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();

      console.log('✅ Direct fetch successful:', data);
      toast.success('Direct fetch passed!');
      setHealthResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Direct fetch failed:', err);
      toast.error(`Direct fetch failed: ${errorMessage}`);
      setHealthResult({ error: errorMessage });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">API Integration Test</h1>
      <p className="text-muted-foreground mb-8">
        Test frontend-backend connectivity and authentication
      </p>

      <div className="grid gap-6">
        {/* Test 1: Direct Fetch (No Auth) */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test 1: Direct Fetch (No Auth)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tests basic network connectivity to backend without authentication
          </p>

          <Button
            onClick={testDirectFetch}
            disabled={loading === 'direct'}
            variant="outline"
          >
            {loading === 'direct' ? 'Testing...' : 'Test Direct Fetch'}
          </Button>
        </Card>

        {/* Test 2: Health Check (With useApiClient) */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test 2: Health Check (With Auth)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tests useApiClient hook with automatic Clerk authentication
          </p>

          <Button
            onClick={testHealthCheck}
            disabled={loading === 'health'}
          >
            {loading === 'health' ? 'Testing...' : 'Test Health Check'}
          </Button>

          {healthResult && (
            <div className="mt-4">
              {healthResult.error ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold text-destructive mb-2">❌ Error</h3>
                  <p className="text-sm">{healthResult.error}</p>
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Success!
                  </h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(healthResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Test 3: Mapping Profiles (Protected Endpoint) */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test 3: Mapping Profiles (Protected)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tests protected endpoint that requires Clerk JWT authentication
          </p>

          <Button
            onClick={testMappingProfiles}
            disabled={loading === 'profiles'}
            variant="secondary"
          >
            {loading === 'profiles' ? 'Testing...' : 'Test Mapping Profiles'}
          </Button>

          {profilesResult && (
            <div className="mt-4">
              {profilesResult.error ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold text-destructive mb-2">❌ Error</h3>
                  <p className="text-sm">{profilesResult.error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This is expected if you're not signed in with Clerk
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Success!
                  </h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(profilesResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Environment Info */}
        <Card className="p-6 bg-muted/30">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-muted-foreground">API URL:</span>{' '}
              <span className="font-semibold">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Clerk Key:</span>{' '}
              <span className="font-semibold">
                {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Supabase URL:</span>{' '}
              <span className="font-semibold">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
