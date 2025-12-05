'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconFileUpload,
  IconDatabase,
  IconChartBar,
  IconMessageCircle,
  IconInbox,
  IconPlus,
} from '@tabler/icons-react';

/**
 * Empty State Components
 *
 * User-friendly empty states that guide users on what to do next
 * when there is no data to display.
 */

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex min-h-[300px] items-center justify-center p-8">
      <div className="text-center">
        {icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
        )}

        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>

        {action && (
          <Button onClick={action.onClick} className="gap-2">
            <IconPlus className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Pre-built Empty States for Common Scenarios
// ============================================================================

export function NoMappingProfilesEmptyState({ onCreateProfile }: { onCreateProfile: () => void }) {
  return (
    <EmptyState
      icon={<IconDatabase className="h-8 w-8 text-muted-foreground" />}
      title="No mapping profiles yet"
      description="Create your first mapping profile to define how your CSV columns map to the Plant Intel data model."
      action={{
        label: 'Create Mapping Profile',
        onClick: onCreateProfile,
      }}
    />
  );
}

export function NoDataUploadedEmptyState({ onUploadData }: { onUploadData: () => void }) {
  return (
    <EmptyState
      icon={<IconFileUpload className="h-8 w-8 text-muted-foreground" />}
      title="No data uploaded yet"
      description="Upload your first CSV file to start analyzing your production data and identifying savings opportunities."
      action={{
        label: 'Upload CSV File',
        onClick: onUploadData,
      }}
    />
  );
}

export function NoAnalysesEmptyState({ onRunAnalysis }: { onRunAnalysis: () => void }) {
  return (
    <EmptyState
      icon={<IconChartBar className="h-8 w-8 text-muted-foreground" />}
      title="No analyses yet"
      description="Run your first analysis to get AI-powered insights on cost savings, equipment efficiency, and quality improvements."
      action={{
        label: 'Run Analysis',
        onClick: onRunAnalysis,
      }}
    />
  );
}

export function NoChatHistoryEmptyState() {
  return (
    <EmptyState
      icon={<IconMessageCircle className="h-8 w-8 text-muted-foreground" />}
      title="Start a conversation"
      description="Ask questions about your production data and get instant AI-powered insights to help identify savings opportunities."
    />
  );
}

export function NoSearchResultsEmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      icon={<IconInbox className="h-8 w-8 text-muted-foreground" />}
      title="No results found"
      description={`We couldn't find anything matching "${searchTerm}". Try adjusting your search terms.`}
    />
  );
}

export function NoDataAvailableEmptyState() {
  return (
    <EmptyState
      icon={<IconInbox className="h-8 w-8 text-muted-foreground" />}
      title="No data available"
      description="There is no data to display at this time. Please check back later or upload new data."
    />
  );
}

// ============================================================================
// Table Empty States
// ============================================================================

interface TableEmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function TableEmptyState({ title, description, action }: TableEmptyStateProps) {
  return (
    <div className="flex min-h-[200px] items-center justify-center border-b border-t py-12">
      <div className="text-center">
        <IconInbox className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>

        {action && (
          <Button onClick={action.onClick} size="sm" variant="outline" className="gap-2">
            <IconPlus className="h-3 w-3" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
