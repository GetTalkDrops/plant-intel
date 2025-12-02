"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CSVMapper } from "@/components/mapping";
import { MappingProfile } from "@/types/mapping";
import { RuleClipboardProvider } from "@/contexts/rule-clipboard-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mock data - will be replaced with Supabase query
const mockProfiles: Record<string, MappingProfile> = {
  "profile-1": {
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
  "profile-2": {
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
  "profile-3": {
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
};

export default function MapDetailPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  // Load profile from mock data (will be Supabase query)
  const profile = mockProfiles[profileId];

  const handleSave = async (updatedProfile: MappingProfile) => {
    console.log("Saving profile:", updatedProfile);
    // TODO: Save to Supabase
    // await supabase.from('mapping_profiles').update(updatedProfile).eq('id', profileId)

    // Show success message and navigate back
    router.push("/dashboard/maps");
  };

  const handleCancel = () => {
    router.push("/dashboard/maps");
  };

  const handleDelete = async () => {
    console.log("Deleting profile:", profileId);
    // TODO: Delete from Supabase
    // await supabase.from('mapping_profiles').delete().eq('id', profileId)

    router.push("/dashboard/maps");
  };

  // Show 404 if profile not found
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4 lg:px-6">
        <h2 className="text-2xl font-bold mb-2">Map Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The mapping profile you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/dashboard/maps">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <RuleClipboardProvider>
      <div className="flex flex-col gap-6 px-4 lg:px-6 py-6">
        {/* Header with Back Button and Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/maps">
                <IconArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{profile.name}</h2>
              {profile.description && (
                <p className="text-muted-foreground mt-1">
                  {profile.description}
                </p>
              )}

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.erpSystem && (
                  <Badge variant="secondary">{profile.erpSystem}</Badge>
                )}
                <Badge variant="outline">
                  {profile.dataGranularity === "header" ? "Header Level" : "Detail Level"}
                </Badge>
                <Badge variant="outline">
                  {profile.mappings.length} Fields
                </Badge>
                {profile.usageCount !== undefined && (
                  <Badge variant="outline">
                    Used {profile.usageCount} times
                  </Badge>
                )}
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                <span>Created: {formatDate(profile.createdAt)}</span>
                <span>Updated: {formatDate(profile.updatedAt)}</span>
                {profile.lastUsed && (
                  <span>Last used: {formatDate(profile.lastUsed)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Mapping Profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{profile.name}"? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* CSVMapper Component */}
        <CSVMapper
          mode="builder"
          initialProfile={profile}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </RuleClipboardProvider>
  );
}
