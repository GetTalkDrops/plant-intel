"use client";

/**
 * CSV Mapper - Main Orchestrator Component
 * Manages the entire mapping workflow across 3 tabs
 */

import { useState } from "react";
import { MappingTemplate, MappingRow, CSVUpload } from "@/types/mapping";
import { getDefaultConfigValues } from "@/lib/config-variables";
import { validateMappingTemplate } from "@/lib/mapping-validation";
import { CSVUploadComponent } from "./csv-upload";
import { MappingTable } from "./mapping-table";
import { ConfigVariablesEditor } from "./config-variables-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CSVMapperProps {
  mode: "builder" | "viewer";
  initialTemplate?: MappingTemplate;
  onSave?: (template: MappingTemplate) => void;
}

export function CSVMapper({ mode, initialTemplate, onSave }: CSVMapperProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "mapping" | "config">(
    "upload"
  );
  const [csvData, setCsvData] = useState<CSVUpload | null>(
    initialTemplate?.csvUpload || null
  );
  const [templateName, setTemplateName] = useState(
    initialTemplate?.name || ""
  );
  const [templateDescription, setTemplateDescription] = useState(
    initialTemplate?.description || ""
  );
  const [mappings, setMappings] = useState<MappingRow[]>(
    initialTemplate?.mappings || []
  );
  const [configValues, setConfigValues] = useState<Record<string, any>>(
    initialTemplate?.configVariables || getDefaultConfigValues()
  );

  const handleCSVUpload = (data: CSVUpload) => {
    setCsvData(data);

    // Create initial mappings for each column
    const initialMappings: MappingRow[] = data.columns.map((col, idx) => ({
      id: `mapping-${idx}`,
      sourceType: "csv",
      sourceColumn: col,
      ontologyEntity: "",
      ontologyProperty: "",
      dataType: "string",
      status: "unmapped",
    }));

    setMappings(initialMappings);
    setActiveTab("mapping");
  };

  const handleSave = () => {
    const template: MappingTemplate = {
      name: templateName,
      description: templateDescription,
      mappings,
      configVariables: configValues,
      csvUpload: csvData || undefined,
    };

    const validation = validateMappingTemplate(template);

    if (!validation.valid) {
      alert(`Validation errors:\n${validation.errors.join("\n")}`);
      return;
    }

    console.log("Saving template:", template);
    onSave?.(template);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name..."
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="template-description">Description (optional)</Label>
          <Textarea
            id="template-description"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Describe this mapping template..."
            className="mt-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            }`}
          >
            1. Upload CSV
          </button>
          <button
            onClick={() => setActiveTab("mapping")}
            disabled={!csvData}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "mapping"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            2. Map Data
          </button>
          <button
            onClick={() => setActiveTab("config")}
            disabled={!csvData}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "config"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            3. Config Variables
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "upload" && (
          <div className="space-y-4">
            <CSVUploadComponent onUpload={handleCSVUpload} />
            {csvData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="font-medium text-green-800">
                  ✓ CSV Uploaded Successfully
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {csvData.filename} - {csvData.rowCount} rows,{" "}
                  {csvData.columns.length} columns
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "mapping" && csvData && (
          <MappingTable
            csvData={csvData}
            mappings={mappings}
            onMappingsChange={setMappings}
          />
        )}

        {activeTab === "config" && (
          <ConfigVariablesEditor
            values={configValues}
            onChange={setConfigValues}
          />
        )}
      </div>

      {/* Actions */}
      {mode === "builder" && (
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={!csvData}>
            Save Map Template
          </Button>
        </div>
      )}
    </div>
  );
}
