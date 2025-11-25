"use client";

import * as React from "react";
import { IconPlus, IconX, IconEye, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BusinessRule,
  BusinessRuleType,
  LookupRuleConfig,
  ConditionalRuleConfig,
  ConditionalRule,
  ComparisonOperator,
} from "@/types/mapping";
import { previewBusinessRule, RuleError } from "@/lib/business-rule-validator";
import { RulePreview } from "./rule-preview";

interface BusinessRuleConfigProps {
  businessRule?: BusinessRule;
  availableFields: string[]; // Other CSV columns that can be referenced
  sampleData?: Record<string, any>[]; // CSV sample rows for preview
  onChange: (rule: BusinessRule | undefined) => void;
  onValidationChange?: (hasErrors: boolean) => void; // Notify parent of validation state
}

export function BusinessRuleConfig({
  businessRule,
  availableFields,
  sampleData,
  onChange,
  onValidationChange,
}: BusinessRuleConfigProps) {
  const [showPreview, setShowPreview] = React.useState(false);

  // Calculate preview result and errors whenever rule or data changes
  const previewResult = React.useMemo(() => {
    if (!businessRule) {
      return null;
    }
    // Even without sample data, we can detect configuration errors
    return previewBusinessRule(businessRule, sampleData || [], availableFields);
  }, [businessRule, sampleData, availableFields]);

  // Extract errors for validation
  const errors = previewResult?.errors || [];

  // Notify parent when validation state changes
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(errors.length > 0);
    }
  }, [errors.length, onValidationChange]);
  const handleTypeChange = (type: BusinessRuleType) => {
    // Initialize with default config for the selected type
    if (type === "lookup") {
      onChange({
        type: "lookup",
        config: {
          sourceField: "",
          lookupTable: {},
          defaultValue: "",
        },
      });
    } else if (type === "conditional") {
      onChange({
        type: "conditional",
        config: {
          conditions: [],
          defaultValue: "",
        },
      });
    } else {
      onChange({
        type: "formula",
        config: {
          formula: "",
          requiredFields: [],
        },
      });
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Business Rule Type</Label>
        {businessRule && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs text-muted-foreground"
          >
            Clear Rule
          </Button>
        )}
      </div>

      <Select
        value={businessRule?.type || "none"}
        onValueChange={(value) =>
          value === "none" ? handleClear() : handleTypeChange(value as BusinessRuleType)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select rule type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No business rule</SelectItem>
          <SelectItem value="lookup">Lookup Table</SelectItem>
          <SelectItem value="conditional">Conditional Override</SelectItem>
          <SelectItem value="formula">Formula (coming soon)</SelectItem>
        </SelectContent>
      </Select>

      {businessRule?.type === "lookup" && (
        <LookupRuleEditor
          config={businessRule.config as LookupRuleConfig}
          availableFields={availableFields}
          errors={errors}
          onChange={(config) => onChange({ type: "lookup", config })}
        />
      )}

      {businessRule?.type === "conditional" && (
        <ConditionalRuleEditor
          config={businessRule.config as ConditionalRuleConfig}
          availableFields={availableFields}
          errors={errors}
          onChange={(config) => onChange({ type: "conditional", config })}
        />
      )}

      {businessRule?.type === "formula" && (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Formula rules coming soon
        </div>
      )}

      {/* Preview Section */}
      {businessRule && businessRule.type !== "formula" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Rule Preview</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              disabled={!sampleData || sampleData.length === 0}
            >
              <IconEye className="mr-2 h-4 w-4" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>

          {showPreview && previewResult && (
            <div className="rounded-lg border p-4">
              <RulePreview result={previewResult} />
            </div>
          )}

          {showPreview && !sampleData && (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No sample data available for preview
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Lookup Table Editor
interface LookupRuleEditorProps {
  config: LookupRuleConfig;
  availableFields: string[];
  errors: RuleError[];
  onChange: (config: LookupRuleConfig) => void;
}

function LookupRuleEditor({
  config,
  availableFields,
  errors,
  onChange,
}: LookupRuleEditorProps) {
  // Check for specific errors
  const hasSourceFieldError = errors.some(
    (e) => e.type === "invalid_field" && e.message.includes("source field")
  );
  const hasEmptyTableError =
    Object.keys(config.lookupTable).length === 0 ||
    Object.entries(config.lookupTable).every(([k, v]) => !k || !v);
  const addLookupEntry = () => {
    onChange({
      ...config,
      lookupTable: { ...config.lookupTable, "": "" },
    });
  };

  const updateLookupEntry = (oldKey: string, newKey: string, value: any) => {
    const newTable = { ...config.lookupTable };
    delete newTable[oldKey];
    newTable[newKey] = value;
    onChange({ ...config, lookupTable: newTable });
  };

  const removeLookupEntry = (key: string) => {
    const newTable = { ...config.lookupTable };
    delete newTable[key];
    onChange({ ...config, lookupTable: newTable });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {/* Error Summary */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.map((error, i) => (
              <div key={i}>{error.message}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label className="text-xs">Lookup Source Field</Label>
        <Select
          value={config.sourceField}
          onValueChange={(value) => onChange({ ...config, sourceField: value })}
        >
          <SelectTrigger
            size="sm"
            className={hasSourceFieldError ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Select field to use as key" />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map((field) => (
              <SelectItem key={field} value={field}>
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasSourceFieldError && (
          <p className="text-xs text-destructive">
            Please select a valid source field
          </p>
        )}
        {!hasSourceFieldError && (
          <p className="text-xs text-muted-foreground">
            Use this field's value to look up the result
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Lookup Table</Label>
          <Button variant="outline" size="sm" onClick={addLookupEntry}>
            <IconPlus className="mr-1 h-3 w-3" />
            Add Entry
          </Button>
        </div>

        {Object.entries(config.lookupTable).length === 0 && (
          <div
            className={`rounded-lg border border-dashed p-4 text-center text-sm ${
              hasEmptyTableError
                ? "border-destructive bg-destructive/10 text-destructive"
                : "text-muted-foreground"
            }`}
          >
            No lookup entries yet. Click "Add Entry" to start.
          </div>
        )}

        <div className="space-y-2">
          {Object.entries(config.lookupTable).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <Input
                placeholder="Key (e.g., MACHINE-A)"
                value={key}
                onChange={(e) => updateLookupEntry(key, e.target.value, value)}
                className="h-8"
              />
              <Input
                placeholder="Value (e.g., 2.5)"
                value={value}
                onChange={(e) => updateLookupEntry(key, key, e.target.value)}
                className="h-8"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLookupEntry(key)}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Default Value (optional)</Label>
        <Input
          placeholder="Fallback if key not found"
          value={config.defaultValue || ""}
          onChange={(e) => onChange({ ...config, defaultValue: e.target.value })}
          className="h-8"
        />
      </div>
    </div>
  );
}

// Conditional Rule Editor
interface ConditionalRuleEditorProps {
  config: ConditionalRuleConfig;
  availableFields: string[];
  errors: RuleError[];
  onChange: (config: ConditionalRuleConfig) => void;
}

function ConditionalRuleEditor({
  config,
  availableFields,
  errors,
  onChange,
}: ConditionalRuleEditorProps) {
  // Check for specific errors
  const hasConditionErrors = errors.some(
    (e) => e.type === "invalid_field" || e.type === "invalid_operator"
  );
  const hasEmptyConditionsError = config.conditions.length === 0;
  const addCondition = () => {
    onChange({
      ...config,
      conditions: [
        ...config.conditions,
        {
          field: "",
          operator: "equals",
          value: "",
          result: "",
          label: "",
        },
      ],
    });
  };

  const updateCondition = (index: number, updates: Partial<ConditionalRule>) => {
    const newConditions = config.conditions.map((c, i) =>
      i === index ? { ...c, ...updates } : c
    );
    onChange({ ...config, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...config,
      conditions: config.conditions.filter((_, i) => i !== index),
    });
  };

  const operatorLabels: Record<ComparisonOperator, string> = {
    equals: "equals",
    notEquals: "not equals",
    greaterThan: "greater than",
    lessThan: "less than",
    greaterThanOrEqual: "greater than or equal",
    lessThanOrEqual: "less than or equal",
    contains: "contains",
    startsWith: "starts with",
    endsWith: "ends with",
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {/* Error Summary */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.map((error, i) => (
              <div key={i}>{error.message}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <Label className="text-xs">Conditions</Label>
        <Button variant="outline" size="sm" onClick={addCondition}>
          <IconPlus className="mr-1 h-3 w-3" />
          Add Condition
        </Button>
      </div>

      {config.conditions.length === 0 && (
        <div
          className={`rounded-lg border border-dashed p-4 text-center text-sm ${
            hasEmptyConditionsError
              ? "border-destructive bg-destructive/10 text-destructive"
              : "text-muted-foreground"
          }`}
        >
          No conditions yet. Click "Add Condition" to start.
        </div>
      )}

      <div className="space-y-3">
        {config.conditions.map((condition, index) => {
          // Check if this specific condition has errors
          const conditionHasError =
            !condition.field || !condition.value || !condition.result;

          return (
            <div
              key={index}
              className={`space-y-2 rounded-lg border p-3 ${
                conditionHasError ? "border-destructive bg-destructive/5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Condition {index + 1}
                  {conditionHasError && (
                    <span className="ml-2 text-destructive">
                      (incomplete)
                    </span>
                  )}
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(index)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                >
                  <IconX className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid gap-2">
                <Input
                  placeholder="Label (e.g., Night shift premium)"
                  value={condition.label || ""}
                  onChange={(e) => updateCondition(index, { label: e.target.value })}
                  className="h-8 text-xs"
                />

                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value })}
                  >
                    <SelectTrigger
                      size="sm"
                      className={!condition.field ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(value: ComparisonOperator) =>
                    updateCondition(index, { operator: value })
                  }
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(operatorLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Value"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  className={`h-8 ${!condition.value ? "border-destructive" : ""}`}
                />
              </div>

              <Input
                placeholder="Result value if condition is true"
                value={condition.result}
                onChange={(e) => updateCondition(index, { result: e.target.value })}
                className={`h-8 ${!condition.result ? "border-destructive" : ""}`}
              />
            </div>
          </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Default Value (optional)</Label>
        <Input
          placeholder="Fallback if no conditions match"
          value={config.defaultValue || ""}
          onChange={(e) => onChange({ ...config, defaultValue: e.target.value })}
          className="h-8"
        />
      </div>
    </div>
  );
}
