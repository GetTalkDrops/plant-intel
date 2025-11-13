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
import { MappingTemplate, MappingRow, CSVUpload } from "@/types/mapping";
import { validateMappingTemplate } from "@/lib/mapping-validation";
import { getDefaultConfigValues } from "@/lib/config-variables";
import { toast } from "sonner";

interface CSVMapperProps {
  mode: "builder" | "selector";
  initialTemplate?: MappingTemplate;
  onSave?: (template: MappingTemplate) => void;
  onCancel?: () => void;
}

export function CSVMapper({
  mode,
  initialTemplate,
  onSave,
  onCancel,
}: CSVMapperProps) {
  const [csvData, setCsvData] = React.useState<CSVUpload | undefined>(
    undefined
  );
  const [templateName, setTemplateName] = React.useState(
    initialTemplate?.name || ""
  );
  const [templateDescription, setTemplateDescription] = React.useState(
    initialTemplate?.description || ""
  );
  const [mappings, setMappings] = React.useState<MappingRow[]>(
    initialTemplate?.mappings || []
  );
  const [configValues, setConfigValues] = React.useState<Record<string, any>>(
    initialTemplate?.configVariables.reduce(
      (acc, cv) => ({ ...acc, [cv.key]: cv.value }),
      {}
    ) || getDefaultConfigValues()
  );
  const [activeTab, setActiveTab] = React.useState("upload");

  const handleCsvUpload = (data: CSVUpload) => {
    setCsvData(data);
    setActiveTab("mapping");
  };

  const handleSave = () => {
    const template: MappingTemplate = {
      id: initialTemplate?.id || `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      createdAt: initialTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mappings,
      configVariables: Object.entries(configValues).map(([key, value]) => ({
        key,
        displayName: key,
        value,
        dataType: typeof value === "boolean" ? "boolean" : "number",
      })),
      userId: "current-user", // TODO: Get from auth context
      isActive: true,
    };

    const validation = validateMappingTemplate(template);

    if (!validation.isValid) {
      toast.error("Validation failed", {
        description: validation.errors[0],
      });
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn("Validation warnings:", validation.warnings);
    }

    onSave?.(template);
    toast.success("Map template saved successfully");
  };

  const canSave = templateName.trim() !== "" && mappings.length > 0;

  if (mode === "selector") {
    // TODO: Implement selector mode (list of existing templates)
    return <div>Selector mode - coming soon</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with template metadata */}
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">Map Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Production Data Standard Map"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Optional description of this mapping template"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
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
          Save Map Template
        </Button>
      </div>
    </div>
  );
}
