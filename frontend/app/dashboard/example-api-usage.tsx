// =============================================================================
// EXAMPLE: How to Use API Client in Dashboard
// =============================================================================
// This file shows example usage patterns for the useApiClient hook
// Copy these patterns into actual components once backend is running

'use client';

import { useApiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { MappingProfile, Analysis } from '@/lib/types/api';

// =============================================================================
// Example 1: Fetching Mapping Profiles
// =============================================================================

export function ProfileListExample() {
  const api = useApiClient();
  const [profiles, setProfiles] = useState<MappingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const data = await api.mappings.list();
        setProfiles(data);
        toast.success(`Loaded ${data.length} mapping profiles`);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        toast.error('Failed to load mapping profiles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [api]);

  if (isLoading) {
    return <div>Loading profiles...</div>;
  }

  return (
    <div>
      {profiles.map(profile => (
        <div key={profile.id}>
          <h3>{profile.name}</h3>
          <p>{profile.description}</p>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Example 2: Uploading CSV File
// =============================================================================

export function CSVUploadExample() {
  const api = useApiClient();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      toast.loading('Uploading CSV file...');

      const response = await api.upload.csv(file);

      toast.success(
        `Upload successful! Processed ${response.row_count} rows. Data tier: ${response.data_tier}`
      );

      // Navigate to analysis page or do something with batch_id
      console.log('Batch ID:', response.batch_id);
      console.log('Suggested mappings:', response.suggested_mappings);

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <button
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleUpload(file);
        };
        input.click();
      }}
      disabled={isUploading}
    >
      {isUploading ? 'Uploading...' : 'Upload CSV'}
    </button>
  );
}

// =============================================================================
// Example 3: Creating Mapping Profile
// =============================================================================

export function CreateProfileExample() {
  const api = useApiClient();
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateProfile = async () => {
    try {
      setIsSaving(true);
      toast.loading('Creating mapping profile...');

      const newProfile = await api.mappings.create({
        name: 'New Profile',
        description: 'Created from dashboard',
        erp_system: 'NetSuite',
        mappings: {
          work_order: 'WO Number',
          product_name: 'Product',
        },
      });

      toast.success(`Profile created: ${newProfile.name}`);
      console.log('Created profile:', newProfile);

    } catch (error) {
      console.error('Failed to create profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button onClick={handleCreateProfile} disabled={isSaving}>
      {isSaving ? 'Creating...' : 'Create Profile'}
    </button>
  );
}

// =============================================================================
// Example 4: Fetching Analyses
// =============================================================================

export function AnalysisListExample() {
  const api = useApiClient();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setIsLoading(true);
        const data = await api.analyses.list();
        setAnalyses(data);
      } catch (error) {
        console.error('Failed to fetch analyses:', error);
        toast.error('Failed to load analyses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyses();
  }, [api]);

  if (isLoading) {
    return <div>Loading analyses...</div>;
  }

  return (
    <div>
      {analyses.map(analysis => (
        <div key={analysis.id}>
          <h3>Batch: {analysis.batch_id}</h3>
          <p>Data Tier: {analysis.data_tier}</p>
          <p>Analyzers: {analysis.analyzers_run.join(', ')}</p>
          <p>
            Insights: {analysis.insights.urgent.length} urgent,{' '}
            {analysis.insights.notable.length} notable
          </p>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Example 5: Sending Chat Message
// =============================================================================

export function ChatExample() {
  const api = useApiClient();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsSending(true);

      const response = await api.chat.sendMessage({
        message: message,
        analysis_id: 'some-analysis-id', // Optional
      });

      console.log('User:', response.message);
      console.log('AI:', response.response);

      toast.success('Message sent');
      setMessage('');

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask a question..."
      />
      <button onClick={handleSendMessage} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}

// =============================================================================
// Example 6: Error Handling Pattern
// =============================================================================

export function ErrorHandlingExample() {
  const api = useApiClient();

  const handleAction = async () => {
    try {
      // API call here
      const result = await api.mappings.list();

      // Success handling
      toast.success('Action completed');
      return result;

    } catch (error) {
      // Error handling
      if (error instanceof Error) {
        // Show user-friendly message from API
        toast.error(error.message);

        // Log full error for debugging
        console.error('API Error:', error);
      } else {
        toast.error('An unexpected error occurred');
      }

      // Re-throw if you want calling code to handle it
      throw error;
    }
  };

  return <button onClick={handleAction}>Do Action</button>;
}

// =============================================================================
// Example 7: Loading States Pattern
// =============================================================================

export function LoadingStateExample() {
  const api = useApiClient();
  const [data, setData] = useState<MappingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await api.mappings.list();
        setData(result);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [api]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Success state
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
