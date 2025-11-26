"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { CSVMapper } from "@/components/mapping";
import { MappingProfile } from "@/types/mapping";
import { RuleClipboardProvider } from "@/contexts/rule-clipboard-context";

export default function UploadMappingPage() {
  const router = useRouter();

  const handleSave = async (profile: MappingProfile) => {
    console.log("Saving mapping profile from upload:", profile);

    // TODO: Save to Supabase and/or process the data
    // For now, redirect to dashboard or analytics
    // router.push("/dashboard");
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  return (
    <RuleClipboardProvider>
      <div className="px-4 lg:px-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Upload & Map Data</h2>
            <p className="text-muted-foreground">
              Upload a CSV and map your data to the ontology
            </p>
          </div>
        </div>

        {/* Use the new CSVMapper component */}
        <CSVMapper
          mode="builder"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </RuleClipboardProvider>
  );
}
