"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileSelectorCard } from "@/components/mapping/profile-selector-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { IconUpload, IconAlertCircle, IconMap } from "@tabler/icons-react";
import { MappingProfile } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import { useApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { NoMappingProfilesEmptyState } from "@/components/empty-state";

// Sample data for recent analyses
const analysisData = [
  {
    id: 1,
    header: "Q4 Production Analysis",
    type: "Production Data",
    status: "Done",
    target: "150",
    limit: "200",
    reviewer: "Eddie Lake",
  },
  {
    id: 2,
    header: "November Manufacturing Report",
    type: "Manufacturing",
    status: "In Process",
    target: "120",
    limit: "180",
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: 3,
    header: "Quality Control October",
    type: "Quality Metrics",
    status: "Done",
    target: "100",
    limit: "150",
    reviewer: "Eddie Lake",
  },
  {
    id: 4,
    header: "ERP Data Integration",
    type: "ERP Import",
    status: "In Process",
    target: "80",
    limit: "120",
    reviewer: "Assign reviewer",
  },
  {
    id: 5,
    header: "MES Weekly Summary",
    type: "MES Data",
    status: "Done",
    target: "60",
    limit: "90",
    reviewer: "Jamik Tashpulatov",
  },
];

// Mock saved profiles - in production, this would come from Supabase
// Temporarily disabled - should use API calls instead
const mockProfiles: any[] = [
  {
    id: "profile-1",
    name: "Standard Production Data",
    description: "Work orders, material costs, and labor hours at header level",
    erpSystem: "NetSuite",
    dataGranularity: "header",
    aggregationStrategy: null,
    mappings: {
      "workOrderNumber": "WO",
      "plannedMaterialCost": "Planned Material"
    },
    oldMappings: [
      {
        ontologyEntity: "WorkOrder",
        ontologyProperty: "workOrderNumber",
        displayName: "Work Order Number",
        dataType: "string",
        required: true,
        sourceType: "csv",
        csvColumn: "WO",
        confidence: "high",
        isMapped: true,
        sampleValues: ["WO-001", "WO-002"],
      },
      {
        ontologyEntity: "WorkOrder",
        ontologyProperty: "plannedMaterialCost",
        displayName: "Planned Material Cost",
        dataType: "number",
        required: true,
        sourceType: "csv",
        csvColumn: "Planned Material",
        confidence: "high",
        isMapped: true,
        transformations: [{ type: "parseNumber" }],
        sampleValues: ["$1200", "$1500"],
      },
    ],
    configVariables: [],
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-20T00:00:00Z",
    userId: "user-1",
    isActive: true,
    usageCount: 12,
    lastUsed: "2025-01-20T10:30:00Z",
  },
  {
    id: "profile-2",
    name: "Detailed Operations Data",
    description: "Operation-level data with quality and downtime metrics",
    erpSystem: "SAP",
    dataGranularity: "operation",
    aggregationStrategy: "keep_detail",
    mappings: {
      "operationCode": "Op Code",
      "unitsProduced": "Units Produced"
    },
    configVariables: [],
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2025-01-18T00:00:00Z",
    userId: "user-1",
    isActive: true,
    usageCount: 8,
    lastUsed: "2025-01-18T14:20:00Z",
    oldMappings: [
      {
        ontologyEntity: "Operation",
        ontologyProperty: "operationCode",
        displayName: "Operation Code",
        dataType: "string",
        required: false,
        sourceType: "csv",
        csvColumn: "Op Code",
        confidence: "high",
        isMapped: true,
        sampleValues: ["OP-100", "OP-200"],
      },
      {
        ontologyEntity: "Operation",
        ontologyProperty: "unitsProduced",
        displayName: "Units Produced",
        dataType: "number",
        required: false,
        sourceType: "csv",
        csvColumn: "Qty Produced",
        confidence: "high",
        isMapped: true,
        sampleValues: ["100", "150"],
      },
    ],
  },
  {
    id: "profile-3",
    name: "MES Import Template",
    description: "MES system export format with machine and equipment data",
    erpSystem: "Epicor",
    dataGranularity: "operation",
    aggregationStrategy: "keep_detail",
    mappings: {
      "machineId": "Machine"
    },
    configVariables: [],
    createdAt: "2024-12-20T00:00:00Z",
    updatedAt: "2025-01-12T00:00:00Z",
    userId: "user-1",
    isActive: true,
    usageCount: 5,
    lastUsed: "2025-01-12T09:45:00Z",
  },
];

// Mock last used dates
const mockLastUsed: Record<string, Date> = {
  "profile-1": new Date("2025-01-20"),
  "profile-2": new Date("2025-01-18"),
  "profile-3": new Date("2025-01-12"),
};

export default function StartNewAnalysisPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const api = useApiClient();

  // State management
  const [profiles, setProfiles] = React.useState<MappingProfile[]>([]);
  const [analyses, setAnalyses] = React.useState<any[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = React.useState(true);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = React.useState(true);
  const [selectedProfiles, setSelectedProfiles] = React.useState<Set<string>>(
    new Set()
  );
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Redirect to sign-in if not authenticated
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch mapping profiles from API
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchProfiles = async () => {
      try {
        setIsLoadingProfiles(true);
        const data = await api.mappings.list();
        setProfiles(data);
      } catch (error) {
        console.error('Failed to load profiles:', error);
        toast.error('Failed to load mapping profiles');
        // Fall back to empty array
        setProfiles([]);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, [isLoaded, isSignedIn]);

  // Fetch recent analyses from API
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchAnalyses = async () => {
      try {
        setIsLoadingAnalyses(true);
        const data = await api.analyses.list();
        setAnalyses(data);
      } catch (error) {
        console.error('Failed to load analyses:', error);
        toast.error('Failed to load recent analyses');
        // Fall back to mock data for now
        setAnalyses(analysisData);
      } finally {
        setIsLoadingAnalyses(false);
      }
    };

    fetchAnalyses();
  }, [isLoaded, isSignedIn]);

  // Show loading state while checking auth or loading data
  if (!isLoaded || !isSignedIn || isLoadingProfiles) {
    return <DashboardSkeleton />;
  }

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfiles((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  };

  const handleViewDetails = (profileId: string) => {
    router.push(`/dashboard/maps/${profileId}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setUploadedFile(file);
      setIsSheetOpen(true);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "text/csv") {
      setUploadedFile(files[0]);
      setIsSheetOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || selectedProfiles.size === 0) return;

    // TODO: Upload file and selected profiles to backend
    // Backend will process and navigate to analysis page
    console.log("Uploading:", {
      file: uploadedFile.name,
      profiles: Array.from(selectedProfiles),
    });

    // For now, just close the sheet and navigate to mock analysis
    setIsSheetOpen(false);
    setUploadedFile(null);
    setSelectedProfiles(new Set());

    // Navigate to analysis page (using mock ID for now)
    router.push("/dashboard/analysis/analysis-1");
  };

  const calculateMappingCoverage = (profile: MappingProfile): number => {
    // Mappings is now Record<string, string>, calculate based on mapped keys
    const mappedCount = Object.keys(profile.mappings).length;
    const totalFields = 10; // TODO: Get total from ontology schema
    return Math.round((mappedCount / totalFields) * 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hero Upload Section - Prominent */}
      <div className="px-4 lg:px-6 py-8 border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manufacturing Intelligence</h1>
              <p className="text-lg text-muted-foreground">
                Upload your production data to unlock insights and optimize operations
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/maps">
                <IconMap className="mr-2 h-4 w-4" />
                Manage Maps
              </Link>
            </Button>
          </div>

          {/* Large Upload Area */}
          <div
            className={cn(
              "rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all",
              isDragging
                ? "border-primary bg-primary/10"
                : "hover:border-primary hover:bg-muted/30"
            )}
            onClick={handleBrowseFiles}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <IconUpload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Upload Production Data</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Drop your CSV file here or click to browse. We'll analyze work orders, costs, and operations automatically.
            </p>
            <Button size="lg" onClick={(e) => e.stopPropagation()}>
              <IconUpload className="mr-2 h-5 w-5" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 overflow-auto">
        <div className="grid lg:grid-cols-[1fr,400px] gap-6 px-4 lg:px-6 py-6">
          {/* Main Content - Available Profiles */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Mapping Profiles</h3>
              <p className="text-sm text-muted-foreground">
                Select profiles to apply when you upload data
              </p>
            </div>

            {profiles.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {profiles.map((profile) => (
                  <ProfileSelectorCard
                    key={profile.id}
                    profile={profile}
                    isSelected={selectedProfiles.has(profile.id)}
                    onSelect={handleProfileSelect}
                    onViewDetails={handleViewDetails}
                    lastUsed={mockLastUsed[profile.id]}
                    mappingCoverage={calculateMappingCoverage(profile)}
                  />
                ))}
              </div>
            ) : (
              <NoMappingProfilesEmptyState
                onCreateProfile={() => router.push("/dashboard/mapping-library/new")}
              />
            )}
          </div>

          {/* Sidebar - Recent Analyses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Analyses</h3>
            </div>
            <div className="space-y-2">
              {analyses.length > 0 ? (
                analyses.slice(0, 5).map((analysis) => (
                  <div
                    key={analysis.id}
                    className="rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {analysis.summary || `Analysis ${analysis.batch_id}`}
                      </h4>
                      <Badge
                        variant={analysis.status === "completed" ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {analysis.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{analysis.data_tier || 'Standard'}</span>
                        <span>•</span>
                        <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => router.push(`/dashboard/chat?analysis_id=${analysis.id}`)}
                      >
                        Ask AI
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No analyses yet. Upload data to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Upload Data File</SheetTitle>
            <SheetDescription>
              Review your upload and selected mapping profiles
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* File Info */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">File</h4>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm font-medium">{uploadedFile?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadedFile?.size
                    ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
                    : ""}
                </p>
              </div>
            </div>

            {/* Selected Profiles */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                Selected Mapping Profiles ({selectedProfiles.size})
              </h4>
              {selectedProfiles.size === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <IconAlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No profiles selected. Please select at least one profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(selectedProfiles).map((profileId) => {
                    const profile = mockProfiles.find((p) => p.id === profileId);
                    if (!profile) return null;

                    return (
                      <div
                        key={profileId}
                        className="rounded-lg border bg-card p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{profile.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {profile.description}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {calculateMappingCoverage(profile)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Warning if no profiles selected */}
            {selectedProfiles.size === 0 && uploadedFile && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4">
                <div className="flex gap-3">
                  <IconAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      No mapping profiles selected
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Please select at least one mapping profile to proceed with
                      the upload.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsSheetOpen(false);
                  setUploadedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={!uploadedFile || selectedProfiles.size === 0}
              >
                <IconUpload className="mr-2 h-4 w-4" />
                Upload & Process
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
