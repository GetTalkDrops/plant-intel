'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading Skeleton Components
 *
 * Reusable loading states for different UI patterns.
 * Provides visual feedback while data is being fetched.
 */

// ============================================================================
// Generic Skeletons
// ============================================================================

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-full" />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="mb-4 h-6 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </Card>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Page-Specific Skeletons
// ============================================================================

export function MappingProfileSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </Card>
  );
}

export function AnalysisResultSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cost Analysis */}
        <div>
          <Skeleton className="mb-4 h-6 w-1/3" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Equipment Analysis */}
        <div>
          <Skeleton className="mb-4 h-6 w-1/3" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Quality Analysis */}
        <div>
          <Skeleton className="mb-4 h-6 w-1/3" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Efficiency Analysis */}
        <div>
          <Skeleton className="mb-4 h-6 w-1/3" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-4">
      {/* User message */}
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-2">
          <Skeleton className="h-4 w-48 ml-auto" />
          <Skeleton className="h-16 w-64 ml-auto" />
        </div>
      </div>

      {/* AI response */}
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-96" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="mb-2 h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="mb-2 h-4 w-1/2" />
            <Skeleton className="mb-1 h-8 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

// ============================================================================
// Full Page Loading
// ============================================================================

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-lg font-medium">Loading Plant Intel</p>
        <p className="text-sm text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
}
