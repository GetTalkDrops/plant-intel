"use client";

import * as React from "react";
import { IconCopy, IconClipboard } from "@tabler/icons-react";
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
import { TransformationConfig } from "./transformation-config";
import { useRuleClipboard } from "@/contexts/rule-clipboard-context";

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
  const [transformations, setTransformations] = React.useState<FieldTransformation[]>(
    mapping.transformations || []
  );
  const [hasValidationErrors, setHasValidationErrors] = React.useState(false);
  const { copiedRule, copyRule, pasteRule } = useRuleClipboard();

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
      transformations,
    });
  };

  const handleCopy = () => {
    if (businessRule) {
      const fieldName = `${mapping.ontologyEntity}.${mapping.ontologyProperty}`;
      copyRule(businessRule, fieldName);
    }
  };

  const handlePaste = () => {
    const rule = pasteRule();
    if (rule) {
      setBusinessRule(rule);
    }
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
            <TabsTrigger value="transformations">
              Data Cleanup
              {transformations && transformations.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {transformations.length}
                </Badge>
              )}
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

          <TabsContent value="transformations" className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">Data Cleanup & Normalization</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Apply transformations to clean your data before business rules.
                Transformations run in sequence from top to bottom.
              </p>
            </div>

            <TransformationConfig
              transformations={transformations}
              sampleValues={mapping.sampleValues}
              onChange={setTransformations}
            />

            {/* Examples */}
            <div className="space-y-2 rounded-lg border p-3 text-xs">
              <p className="font-medium">Common Examples:</p>
              <ul className="ml-4 space-y-1 list-disc text-muted-foreground">
                <li>
                  <strong>Trim:</strong> Remove leading/trailing whitespace
                </li>
                <li>
                  <strong>Remove Units:</strong> Strip "lbs", "kg" from numeric values
                </li>
                <li>
                  <strong>Parse Date:</strong> Convert "01/15/2024" to ISO format
                </li>
                <li>
                  <strong>Default Value:</strong> Replace empty cells with "N/A"
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="space-y-2 border-t p-4">
        {/* Copy/Paste Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!businessRule}
            className="flex-1 gap-2"
          >
            <IconCopy className="h-4 w-4" />
            Copy Rule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaste}
            disabled={!copiedRule}
            className="flex-1 gap-2"
          >
            <IconClipboard className="h-4 w-4" />
            Paste Rule
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
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
    </div>
  );
}
