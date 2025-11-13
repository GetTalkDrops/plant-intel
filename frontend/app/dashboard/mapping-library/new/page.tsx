// app/dashboard/mapping-library/new/page.tsx

"use client";

import MappingTable from "@/components/mapping-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

// Define the mapping type
interface MappingRow {
  id: string;
  csvColumn: string;
  ontologyField: string;
  relationship?: string;
}

interface MappingPayload {
  rows: MappingRow[];
  metadata: {
    name: string;
    description?: string;
  };
}

export default function NewMapPage() {
  const handleSaveMapping = (mapping: MappingPayload) => {
    // ← FIX TYPE
    console.log("Saving mapping:", mapping);
    // TODO: Save to Supabase
    // router.push('/dashboard/mapping-library')
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mapping-library">
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Create New Map</h2>
          <p className="text-muted-foreground">
            Define your CSV mapping without uploading a file
          </p>
        </div>
      </div>

      <MappingTable onSave={handleSaveMapping} showMetadata={true} />
    </div>
  );
}
