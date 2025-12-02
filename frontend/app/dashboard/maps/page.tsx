"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileSelectorCard } from "@/components/mapping/profile-selector-card";
import { MappingProfile } from "@/types/mapping";

// Mock data - will be replaced with Supabase query
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

const mockLastUsed: Record<string, Date> = {
  "profile-1": new Date("2025-01-20"),
  "profile-2": new Date("2025-01-18"),
  "profile-3": new Date("2025-01-12"),
};

export default function MappingLibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter profiles based on search query
  const filteredProfiles = React.useMemo(() => {
    if (!searchQuery.trim()) return mockProfiles;

    const query = searchQuery.toLowerCase();
    return mockProfiles.filter(
      (profile) =>
        profile.name.toLowerCase().includes(query) ||
        profile.description?.toLowerCase().includes(query) ||
        profile.erpSystem?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleViewDetails = (profileId: string) => {
    router.push(`/dashboard/maps/${profileId}`);
  };

  const calculateMappingCoverage = (profile: MappingProfile): number => {
    const mappedCount = profile.mappings.filter((m) => m.isMapped).length;
    return Math.round((mappedCount / profile.mappings.length) * 100);
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mapping Library</h2>
          <p className="text-muted-foreground">
            Manage your CSV mapping configurations
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/mapping-library/new">
            <IconPlus className="mr-2 h-4 w-4" />
            New Map
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search maps by name, description, or ERP system..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <ProfileSelectorCard
              key={profile.id}
              profile={profile}
              isSelected={false}
              onSelect={handleViewDetails}
              onViewDetails={handleViewDetails}
              lastUsed={mockLastUsed[profile.id]}
              mappingCoverage={calculateMappingCoverage(profile)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          {searchQuery ? (
            <>
              <h3 className="text-lg font-semibold mb-2">No maps found</h3>
              <p className="text-muted-foreground mb-4">
                No mapping profiles match "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">
                No mapping profiles yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first CSV mapping profile to get started
              </p>
              <Button asChild>
                <Link href="/dashboard/maps/new">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create First Map
                </Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
