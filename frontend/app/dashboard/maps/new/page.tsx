"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { CSVMapper } from "@/components/mapping";
import { RuleClipboardProvider } from "@/contexts/rule-clipboard-context";
import { MappingProfile } from "@/types/mapping";

export default function NewMapPage() {
  const router = useRouter();

  const handleSave = async (profile: MappingProfile) => {
    console.log("Creating new profile:", profile);
    // TODO: Save to Supabase
    // await supabase.from('mapping_profiles').insert(profile)

    // Navigate to library after save
    router.push("/dashboard/maps");
  };

  const handleCancel = () => {
    router.push("/dashboard/maps");
  };

  return (
    <RuleClipboardProvider>
      <div className="flex flex-col gap-6 px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/maps">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold">Create New Mapping Profile</h2>
            <p className="text-muted-foreground mt-1">
              Upload a CSV file and configure field mappings to your manufacturing data model
            </p>
          </div>
        </div>

        {/* CSVMapper Component */}
        <CSVMapper
          mode="builder"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </RuleClipboardProvider>
  );
}
