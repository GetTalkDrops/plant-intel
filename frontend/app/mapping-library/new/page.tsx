"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { CSVMapper } from "@/components/mapping";
import { MappingTemplate } from "@/types/mapping";

export default function NewMapPage() {
  const router = useRouter();

  const handleSave = async (template: MappingTemplate) => {
    console.log("Saving template:", template);

    // TODO: Save to Supabase
    // Example:
    // const { data, error } = await supabase
    //   .from('mapping_templates')
    //   .insert([template])

    // For now, just log and redirect
    // router.push("/dashboard/mapping-library");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mapping-library">
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Map</h1>
          <p className="text-muted-foreground">
            Upload a CSV and map your data to the ontology
          </p>
        </div>
      </div>

      {/* Main mapper component */}
      <CSVMapper
        mode="builder"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
