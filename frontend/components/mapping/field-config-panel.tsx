"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PropertyMapping,
  FieldTransformation,
  BusinessRule,
} from "@/types/mapping";
import { formatSampleData } from "@/lib/csv-utils";
import { BusinessRuleConfig } from "./business-rule-config";

interface FieldConfigPanelProps {
  mapping: PropertyMapping;
  allMappings: PropertyMapping[]; // To get available fields for business rules
  sampleData?: Record<string, any>[]; // CSV sample rows for rule preview
  onSave: (updates: {
    transformations?: FieldTransformation[];
    businessRule?: BusinessRule;
  }) => void;
  onCancel: () => void;
}

export function FieldConfigPanel({
  mapping,
  allMappings,
  sampleData,
  onSave,
  onCancel,
}: FieldConfigPanelProps) {
  const [businessRule, setBusinessRule] = React.useState<BusinessRule | undefined>(
    mapping.businessRule
  );
  const [hasValidationErrors, setHasValidationErrors] = React.useState(false);

  // Get list of available CSV columns for business rules
  const availableFields = React.useMemo(() => {
    return allMappings
      .filter((m) => m.csvColumn && m.csvColumn !== mapping.csvColumn)
      .map((m) => m.csvColumn!)
      .filter((v, i, a) => a.indexOf(v) === i); // unique
  }, [allMappings, mapping.csvColumn]);

  const handleSave = () => {
    // Don't save if there are validation errors
    if (hasValidationErrors) {
      return;
    }
    onSave({
      businessRule,
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-2 border-b p-6">
        <h3 className="text-lg font-semibold">Field Configuration</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Field:</span>
            <span className="font-medium">
              {mapping.ontologyEntity}.{mapping.ontologyProperty}
            </span>
          </div>
          {mapping.csvColumn && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Source:</span>
              <Badge variant="outline">{mapping.csvColumn}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Sample Data Preview */}
      {mapping.sampleValues && mapping.sampleValues.length > 0 && (
        <div className="border-b bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Sample Values:</p>
          <p className="mt-1 font-mono text-sm">
            {formatSampleData(mapping.sampleValues)}
          </p>
        </div>
      )}

      {/* Configuration Tabs */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="business-rules" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="business-rules">
              Business Rules
              {businessRule && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  1
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transformations" disabled>
              Data Cleanup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business-rules" className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">Context-Aware Value Derivation</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Define how this field's value should be determined based on other
                fields or conditions. This encodes your domain knowledge.
              </p>
            </div>

            <BusinessRuleConfig
              businessRule={businessRule}
              availableFields={availableFields}
              sampleData={sampleData}
              onChange={setBusinessRule}
              onValidationChange={setHasValidationErrors}
            />

            {/* Examples */}
            <div className="space-y-2 rounded-lg border p-3 text-xs">
              <p className="font-medium">Common Examples:</p>
              <ul className="ml-4 space-y-1 list-disc text-muted-foreground">
                <li>
                  <strong>Lookup:</strong> Use Machine ID to look up scrap rate
                </li>
                <li>
                  <strong>Conditional:</strong> If shift start time &gt;= 18:00, use
                  night shift labor rate
                </li>
                <li>
                  <strong>Conditional:</strong> If material code starts with "PREM",
                  use premium material cost
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="transformations">
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Data transformation features (trim, parse dates, etc.) coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 border-t p-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={hasValidationErrors}
          className="flex-1"
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}
