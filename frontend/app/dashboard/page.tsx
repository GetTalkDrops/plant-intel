"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { ProfileSelectorCard } from "@/components/mapping/profile-selector-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { IconUpload, IconAlertCircle } from "@tabler/icons-react";
import { MappingProfile } from "@/types/mapping";

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
const mockProfiles: MappingProfile[] = [
  {
    id: "profile-1",
    name: "Standard Production Data",
    description: "Work orders, material costs, and labor hours at header level",
    erpSystem: "NetSuite",
    dataGranularity: "header",
    aggregationStrategy: null,
    mappings: [
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
    mappings: [
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
    configVariables: [],
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2025-01-18T00:00:00Z",
    userId: "user-1",
    isActive: true,
    usageCount: 8,
    lastUsed: "2025-01-18T14:20:00Z",
  },
  {
    id: "profile-3",
    name: "MES Import Template",
    description: "MES system export format with machine and equipment data",
    erpSystem: "Epicor",
    dataGranularity: "operation",
    aggregationStrategy: "keep_detail",
    mappings: [
      {
        ontologyEntity: "Machine",
        ontologyProperty: "machineId",
        displayName: "Machine ID",
        dataType: "string",
        required: false,
        sourceType: "csv",
        csvColumn: "Machine",
        confidence: "high",
        isMapped: true,
        sampleValues: ["M-001", "M-002"],
      },
    ],
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
  const [selectedProfiles, setSelectedProfiles] = React.useState<Set<string>>(
    new Set()
  );
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    router.push(`/dashboard/mapping-library/${profileId}`);
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

  const handleUpload = async () => {
    if (!uploadedFile || selectedProfiles.size === 0) return;

    // TODO: Upload file and selected profiles to backend
    // Backend will process and navigate to analysis page
    console.log("Uploading:", {
      file: uploadedFile.name,
      profiles: Array.from(selectedProfiles),
    });

    // For now, just close the sheet
    setIsSheetOpen(false);
    setUploadedFile(null);
    setSelectedProfiles(new Set());

    // TODO: Navigate to analysis page when backend is ready
    // router.push("/dashboard/analysis/new-id");
  };

  const calculateMappingCoverage = (profile: MappingProfile): number => {
    const mappedCount = profile.mappings.filter((m) => m.isMapped).length;
    return Math.round((mappedCount / profile.mappings.length) * 100);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Section */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Start New Analysis</h2>
            <p className="text-muted-foreground">
              Upload your data file and select mapping profiles
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="rounded-lg border border-dashed p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={handleBrowseFiles}
        >
          <IconUpload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Data File</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag CSV file here or click to browse
          </p>
          <Button variant="outline" onClick={(e) => e.stopPropagation()}>
            Browse Files
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

      {/* Available Mapping Profiles */}
      <div className="px-4 lg:px-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Available Mapping Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Select one or more profiles to apply to your upload
          </p>
        </div>

        {mockProfiles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockProfiles.map((profile) => (
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
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No mapping profiles available. Create one to get started.
            </p>
            <Button onClick={() => router.push("/dashboard/mapping-library/new")}>
              Create Profile
            </Button>
          </div>
        )}
      </div>

      {/* Recent Analyses Table */}
      <div className="px-4 lg:px-6">
        <h3 className="text-lg font-semibold mb-4">Recent Analyses</h3>
        <DataTable data={analysisData} />
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
