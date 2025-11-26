"use client";

import * as React from "react";
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconEye,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FieldTransformation, TransformationType } from "@/types/mapping";
import {
  validateTransformation,
  previewTransformation,
} from "@/lib/transformation-engine";

interface TransformationConfigProps {
  transformations?: FieldTransformation[];
  sampleValues?: any[];
  onChange: (transformations: FieldTransformation[]) => void;
}

export function TransformationConfig({
  transformations = [],
  sampleValues = [],
  onChange,
}: TransformationConfigProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const addTransformation = () => {
    onChange([...transformations, { type: "trim" }]);
    setExpandedIndex(transformations.length);
  };

  const removeTransformation = (index: number) => {
    onChange(transformations.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const updateTransformation = (
    index: number,
    updates: Partial<FieldTransformation>
  ) => {
    onChange(
      transformations.map((t, i) =>
        i === index ? { ...t, ...updates } : t
      )
    );
  };

  return (
    <div className="space-y-3">
      {transformations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>No transformations configured</p>
          <p className="mt-1 text-xs">
            Add transformations to clean and normalize your data
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transformations.map((transformation, index) => (
            <TransformationItem
              key={index}
              transformation={transformation}
              sampleValues={sampleValues}
              isExpanded={expandedIndex === index}
              onToggle={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
              onUpdate={(updates) => updateTransformation(index, updates)}
              onRemove={() => removeTransformation(index)}
            />
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={addTransformation}
        className="w-full"
      >
        <IconPlus className="mr-2 h-4 w-4" />
        Add Transformation
      </Button>
    </div>
  );
}

interface TransformationItemProps {
  transformation: FieldTransformation;
  sampleValues: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<FieldTransformation>) => void;
  onRemove: () => void;
}

function TransformationItem({
  transformation,
  sampleValues,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
}: TransformationItemProps) {
  const [showPreview, setShowPreview] = React.useState(false);

  const validation = React.useMemo(
    () => validateTransformation(transformation),
    [transformation]
  );

  const preview = React.useMemo(
    () => (showPreview ? previewTransformation(sampleValues, transformation) : []),
    [showPreview, sampleValues, transformation]
  );

  const typeLabel = getTransformationLabel(transformation.type);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={`rounded-lg border ${!validation.valid ? "border-destructive" : ""} bg-background`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isExpanded ? (
                  <IconChevronUp className="h-3 w-3" />
                ) : (
                  <IconChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <Badge variant="outline">{typeLabel}</Badge>
            {!validation.valid && (
              <span className="text-xs text-destructive">{validation.error}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
          >
            <IconTrash className="h-3 w-3" />
          </Button>
        </div>

        {/* Configuration */}
        <CollapsibleContent>
          <div className="space-y-3 border-t p-3">
            {/* Type Selector */}
            <div className="space-y-1">
              <Label>Transformation Type</Label>
              <Select
                value={transformation.type}
                onValueChange={(value: TransformationType) =>
                  onUpdate({ type: value, config: {} })
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trim">Trim Whitespace</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="lowercase">Lowercase</SelectItem>
                  <SelectItem value="parseDate">Parse Date</SelectItem>
                  <SelectItem value="parseNumber">Parse Number</SelectItem>
                  <SelectItem value="removeUnits">Remove Units</SelectItem>
                  <SelectItem value="replaceText">Replace Text</SelectItem>
                  <SelectItem value="defaultValue">Default Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific configuration */}
            <TransformationTypeConfig
              transformation={transformation}
              onUpdate={onUpdate}
            />

            {/* Preview */}
            {sampleValues.length > 0 && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full gap-2"
                >
                  <IconEye className="h-4 w-4" />
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
                {showPreview && preview.length > 0 && (
                  <div className="mt-2 space-y-1 rounded border bg-muted/30 p-2 text-xs">
                    {preview.map((item, idx) => (
                      <div key={idx} className="flex justify-between gap-2">
                        <span className="font-mono text-muted-foreground">
                          {String(item.original || "null")}
                        </span>
                        <span>→</span>
                        <span className="font-mono font-semibold">
                          {String(item.transformed || "null")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function TransformationTypeConfig({
  transformation,
  onUpdate,
}: {
  transformation: FieldTransformation;
  onUpdate: (updates: Partial<FieldTransformation>) => void;
}) {
  const updateConfig = (key: string, value: any) => {
    onUpdate({
      config: { ...transformation.config, [key]: value },
    });
  };

  switch (transformation.type) {
    case "parseDate":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label>Input Format</Label>
            <Input
              placeholder="e.g., MM/DD/YYYY or DD-MM-YYYY"
              value={transformation.config?.inputFormat || ""}
              onChange={(e) => updateConfig("inputFormat", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use: YYYY (year), MM (month), DD (day), HH (hour), mm (minute)
            </p>
          </div>
          <div className="space-y-1">
            <Label>Output Format (optional)</Label>
            <Input
              placeholder="Leave empty for ISO format"
              value={transformation.config?.outputFormat || ""}
              onChange={(e) => updateConfig("outputFormat", e.target.value)}
            />
          </div>
        </div>
      );

    case "removeUnits":
      return (
        <div className="space-y-1">
          <Label>Units to Remove</Label>
          <Input
            placeholder="e.g., lbs, kg, hrs (comma-separated)"
            value={(transformation.config?.units || []).join(", ")}
            onChange={(e) =>
              updateConfig(
                "units",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        </div>
      );

    case "replaceText":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label>Find</Label>
            <Input
              placeholder="Text to find"
              value={transformation.config?.find || ""}
              onChange={(e) => updateConfig("find", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Replace With</Label>
            <Input
              placeholder="Replacement text (empty to remove)"
              value={transformation.config?.replacement || ""}
              onChange={(e) => updateConfig("replacement", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={transformation.config?.caseSensitive || false}
                onCheckedChange={(checked) =>
                  updateConfig("caseSensitive", checked)
                }
              />
              Case Sensitive
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={transformation.config?.useRegex || false}
                onCheckedChange={(checked) => updateConfig("useRegex", checked)}
              />
              Use Regex
            </label>
          </div>
        </div>
      );

    case "defaultValue":
      return (
        <div className="space-y-1">
          <Label>Default Value</Label>
          <Input
            placeholder="Value to use when field is empty"
            value={transformation.config?.value || ""}
            onChange={(e) => updateConfig("value", e.target.value)}
          />
        </div>
      );

    case "trim":
    case "uppercase":
    case "lowercase":
    case "parseNumber":
      return (
        <p className="text-xs text-muted-foreground">
          No additional configuration required
        </p>
      );

    default:
      return null;
  }
}

function getTransformationLabel(type: TransformationType): string {
  const labels: Record<TransformationType, string> = {
    trim: "Trim",
    uppercase: "Uppercase",
    lowercase: "Lowercase",
    parseDate: "Parse Date",
    parseNumber: "Parse Number",
    removeUnits: "Remove Units",
    replaceText: "Replace Text",
    defaultValue: "Default Value",
  };
  return labels[type] || type;
}
