# API Client Setup Complete ✅

**Status**: API Client Infrastructure Ready | **Date**: 2025-12-03

---

## Summary

Successfully created the TypeScript API client infrastructure with full type safety and authentication integration. The client is now ready to replace mock data in components.

---

## Files Created

### 1. ✅ Type Definitions
**File**: [frontend/lib/types/api.ts](frontend/lib/types/api.ts)

**Purpose**: Complete TypeScript interfaces for all API request/response payloads

**Interfaces Defined** (11 total):
- `MappingProfile` - Mapping profile entity with all fields
- `CreateMappingProfileRequest` - Request payload for creating profiles
- `UpdateMappingProfileRequest` - Request payload for updating profiles
- `Analysis` - Analysis results with insights
- `AnalysisInsights` - Structured insights (urgent, notable, summary)
- `Insight` - Individual insight with severity and recommendations
- `ChatMessage` - Chat message entity
- `SendChatMessageRequest` - Chat message request payload
- `SendChatMessageResponse` - Chat API response
- `UploadCSVResponse` - CSV upload response with batch info
- `WorkOrder` - Work order entity from CSV
- `AnalyzerConfig` - Analyzer configuration
- `APIError` - Standard error response format
- `HealthCheckResponse` - Health check status

---

### 2. ✅ API Client Hook
**File**: [frontend/lib/api-client.ts](frontend/lib/api-client.ts)

**Purpose**: React hook-based API client with Clerk authentication

**Architecture**:
- **Hook-based**: `useApiClient()` hook that uses Clerk's `useAuth()`
- **Type-safe**: All methods return properly typed Promise<T>
- **Authenticated**: Automatically includes JWT token from Clerk in all requests
- **Error handling**: Converts API errors to user-friendly messages

**Methods Provided**:

```typescript
const api = useApiClient();

// Health Check
api.healthCheck(): Promise<HealthCheckResponse>

// Mapping Profiles
api.mappings.list(): Promise<MappingProfile[]>
api.mappings.get(id): Promise<MappingProfile>
api.mappings.create(data): Promise<MappingProfile>
api.mappings.update(id, data): Promise<MappingProfile>
api.mappings.delete(id): Promise<{ success: boolean }>

// CSV Upload
api.upload.csv(file): Promise<UploadCSVResponse>

// Analyses
api.analyses.list(): Promise<Analysis[]>
api.analyses.get(id): Promise<Analysis>
api.analyses.getByBatch(batchId): Promise<Analysis>

// Chat
api.chat.sendMessage(data): Promise<SendChatMessageResponse>
api.chat.getHistory(analysisId): Promise<ChatMessage[]>

// Config
api.config.get(): Promise<AnalyzerConfig>
api.config.update(data): Promise<AnalyzerConfig>
```

---

## How to Use in Components

### Example 1: Fetching Mapping Profiles

**Before (Mock Data)**:
```typescript
const mockProfiles: MappingProfile[] = [
  { id: "profile-1", name: "Standard Production Data", ... },
  { id: "profile-2", name: "Detailed Operations Data", ... },
];
```

**After (Real API)**:
```typescript
'use client';

import { useApiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';

export function DashboardPage() {
  const api = useApiClient();
  const [profiles, setProfiles] = useState<MappingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const data = await api.mappings.list();
        setProfiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profiles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {profiles.map(profile => (
        <div key={profile.id}>{profile.name}</div>
      ))}
    </div>
  );
}
```

---

### Example 2: Uploading CSV

**Before (Console.log)**:
```typescript
const handleUpload = async () => {
  console.log("Uploading:", { file: uploadedFile.name });
  router.push("/dashboard/analysis/analysis-1");
};
```

**After (Real API)**:
```typescript
const api = useApiClient();

const handleUpload = async () => {
  if (!uploadedFile) return;

  try {
    setIsUploading(true);

    // Upload CSV to backend
    const response = await api.upload.csv(uploadedFile);

    // Response contains: batch_id, row_count, data_tier, suggested_mappings
    console.log('Upload successful:', response);

    // Navigate to analysis for this batch
    router.push(`/dashboard/analysis/${response.batch_id}`);
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error('Failed to upload file. Please try again.');
  } finally {
    setIsUploading(false);
  }
};
```

---

### Example 3: Sending Chat Messages

**Before (TODO Comment)**:
```typescript
const handleSendMessage = async () => {
  // TODO: Call API
  console.log('Sending message:', input);
};
```

**After (Real API)**:
```typescript
const api = useApiClient();

const handleSendMessage = async () => {
  if (!input.trim()) return;

  try {
    setIsLoading(true);

    const response = await api.chat.sendMessage({
      message: input,
      analysis_id: currentAnalysisId,
    });

    // Add user message and AI response to chat
    setMessages(prev => [
      ...prev,
      { role: 'user', content: input },
      { role: 'assistant', content: response.response },
    ]);

    setInput('');
  } catch (error) {
    toast.error('Failed to send message');
  } finally {
    setIsLoading(false);
  }
};
```

---

## Technical Details

### Authentication Flow
1. Component calls `useApiClient()` hook
2. Hook uses Clerk's `useAuth()` to get `getToken()` function
3. Before each API request, `getToken()` fetches fresh JWT token
4. Token included in `Authorization: Bearer <token>` header
5. Backend validates token and extracts `org_id` for multi-tenancy

### Error Handling
- All API errors converted to Error objects with descriptive messages
- Backend error responses parsed and extracted
- 401/403 errors indicate auth issues
- 404 errors indicate resource not found
- 500 errors indicate server issues

### Type Safety
- All API methods return properly typed Promises
- TypeScript enforces correct request/response shapes
- IDE autocomplete works for all API methods
- Compile-time errors if using API incorrectly

---

## Configuration

### Environment Variable
Set in [frontend/.env.local](frontend/.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Local Development**: http://localhost:8000
**Production**: https://api.plantintel.com (or your production URL)

---

## Next Steps

### ⏭️ To Complete API Integration:

1. **Replace Mock Data in Dashboard** ([frontend/app/dashboard/page.tsx](frontend/app/dashboard/page.tsx))
   - Lines 71-184: Replace `mockProfiles` with `api.mappings.list()`
   - Lines 270-287: Update `handleUpload` to call `api.upload.csv()`
   - Lines 22-68: Replace `analysisData` with `api.analyses.list()`

2. **Add Error Boundaries** - Wrap components with error handling
3. **Add Loading States** - Show skeletons while data loads
4. **Add Toast Notifications** - Notify users of success/errors
5. **Add Empty States** - Handle when no data exists

---

## Files Ready to Update

### Priority 1 (Core User Flow):
- [frontend/app/dashboard/page.tsx](frontend/app/dashboard/page.tsx) - Upload & profile selection
- [frontend/app/dashboard/mapping/page.tsx](frontend/app/dashboard/mapping/page.tsx) - CSV mapping
- [frontend/app/dashboard/analysis/page.tsx](frontend/app/dashboard/analysis/page.tsx) - Analysis results
- [frontend/app/dashboard/chat/page.tsx](frontend/app/dashboard/chat/page.tsx) - AI chat

### Priority 2 (Admin Features):
- [frontend/app/dashboard/maps/page.tsx](frontend/app/dashboard/maps/page.tsx) - Mapping library CRUD
- [frontend/app/dashboard/config/page.tsx](frontend/app/dashboard/config/page.tsx) - Analyzer config

---

## Testing the API Client

### Manual Test in Component:
```typescript
'use client';

import { useApiClient } from '@/lib/api-client';
import { useEffect } from 'react';

export function TestPage() {
  const api = useApiClient();

  useEffect(() => {
    const test = async () => {
      try {
        // Test health check
        const health = await api.healthCheck();
        console.log('Health:', health);

        // Test mapping profiles
        const profiles = await api.mappings.list();
        console.log('Profiles:', profiles);
      } catch (error) {
        console.error('API Error:', error);
      }
    };

    test();
  }, []);

  return <div>Check console for API test results</div>;
}
```

---

## Status

**API Client**: ✅ Complete and ready to use
**Type Definitions**: ✅ Complete
**Authentication**: ✅ Integrated with Clerk
**Error Handling**: ✅ User-friendly errors
**Type Safety**: ✅ Full TypeScript support

**Next Step**: Replace mock data in dashboard components (Day 3-4 continued)
