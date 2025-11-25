"use client";

import * as React from "react";
import { IconDeviceFloppy, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { CSVUploadComponent } from "./csv-upload";
import { MappingTable } from "./mapping-table";
import { ConfigVariablesEditor } from "./config-variables-editor";
import { MappingProfile, PropertyMapping, CSVUpload, ConfigVariable } from "@/types/mapping";
import { getDefaultConfigValues } from "@/lib/config-variables";
import { toast } from "sonner";

interface CSVMapperProps {
  mode: "builder" | "selector";
  initialProfile?: MappingProfile;
  onSave?: (profile: MappingProfile) => void;
  onCancel?: () => void;
}

export function CSVMapper({
  mode,
  initialProfile,
  onSave,
  onCancel,
}: CSVMapperProps) {
  const [csvData, setCsvData] = React.useState<CSVUpload | undefined>(
    undefined
  );
  const [profileName, setProfileName] = React.useState(
    initialProfile?.name || ""
  );
  const [profileDescription, setProfileDescription] = React.useState(
    initialProfile?.description || ""
  );
  const [mappings, setMappings] = React.useState<PropertyMapping[]>(
    initialProfile?.mappings || []
  );
  const [configValues, setConfigValues] = React.useState<Record<string, any>>(
    initialProfile?.configVariables.reduce(
      (acc: Record<string, any>, cv: ConfigVariable) => ({ ...acc, [cv.key]: cv.value }),
      {}
    ) || getDefaultConfigValues()
  );
  const [activeTab, setActiveTab] = React.useState("upload");

  const handleCsvUpload = (data: CSVUpload) => {
    setCsvData(data);
    setActiveTab("mapping");
  };

  const handleSave = () => {
    const profile: MappingProfile = {
      id: initialProfile?.id || `profile-${Date.now()}`,
      name: profileName,
      description: profileDescription,
      dataGranularity: "header", // TODO: Detect from CSV or let user choose
      aggregationStrategy: null,
      mappings,
      configVariables: Object.entries(configValues).map(([key, value]) => ({
        key,
        displayName: key,
        value,
        dataType: (typeof value === "boolean" ? "boolean" : "number") as "boolean" | "number",
      })),
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "current-user", // TODO: Get from auth context
      isActive: true,
    };

    // Basic validation - ensure profile has name and at least one mapping
    if (!profile.name.trim()) {
      toast.error("Validation failed", {
        description: "Profile name is required",
      });
      return;
    }

    if (profile.mappings.length === 0) {
      toast.error("Validation failed", {
        description: "At least one mapping is required",
      });
      return;
    }

    onSave?.(profile);
    toast.success("Mapping profile saved successfully");
  };

  const canSave = profileName.trim() !== "" && mappings.length > 0;

  if (mode === "selector") {
    // TODO: Implement selector mode (list of existing templates)
    return <div>Selector mode - coming soon</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with profile metadata */}
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Mapping Profile Name *</Label>
            <Input
              id="profile-name"
              placeholder="e.g., NetSuite Standard Export"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-description">Description</Label>
            <Textarea
              id="profile-description"
              placeholder="Optional description of this mapping profile"
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
              rows={1}
            />
          </div>
        </div>
      </div>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">1. Upload CSV</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!csvData}>
            2. Map Data
          </TabsTrigger>
          <TabsTrigger value="config">3. Config Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <CSVUploadComponent
            onUploadComplete={handleCsvUpload}
            onRemove={() => setCsvData(undefined)}
            currentFile={csvData}
          />

          {csvData && (
            <Alert>
              <IconAlertCircle className="h-4 w-4" />
              <AlertTitle>CSV Loaded</AlertTitle>
              <AlertDescription>
                Your file has {csvData.columns.length} columns and{" "}
                {csvData.rowCount} rows. Click "Map Data" to continue.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Column Mapping</h3>
            <p className="text-sm text-muted-foreground">
              Map your CSV columns or fixed values to ontology properties.
              Choose "CSV Column" to map from your data, or "Fixed Value" for
              constants.
            </p>
          </div>

          <MappingTable
            csvData={csvData}
            initialMappings={mappings}
            onChange={setMappings}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Configuration Variables</h3>
            <p className="text-sm text-muted-foreground">
              Set your analysis parameters. These values will be used when
              running analyses with this map template.
            </p>
          </div>

          <ConfigVariablesEditor
            values={configValues}
            onChange={setConfigValues}
          />
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex justify-between rounded-lg border bg-muted/50 p-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          <IconDeviceFloppy className="mr-2 h-4 w-4" />
          Save Mapping Profile
        </Button>
      </div>
    </div>
  );
}
