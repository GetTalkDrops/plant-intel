"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfigVariable } from "@/types/mapping";
import { CORE_CONFIG_VARIABLES } from "@/lib/config-variables";

interface ConfigVariablesEditorProps {
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

export function ConfigVariablesEditor({
  values,
  onChange,
}: ConfigVariablesEditorProps) {
  const [config, setConfig] = React.useState<Record<string, any>>(() => {
    if (values) return values;

    // Initialize with default values
    const defaults: Record<string, any> = {};
    CORE_CONFIG_VARIABLES.forEach((variable) => {
      defaults[variable.key] = variable.value;
    });
    return defaults;
  });

  React.useEffect(() => {
    onChange?.(config);
  }, [config, onChange]);

  const updateValue = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const renderInput = (variable: ConfigVariable) => {
    const value = config[variable.key];

    if (variable.dataType === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={variable.key} className="text-sm font-normal">
            {variable.displayName}
          </Label>
          <Switch
            id={variable.key}
            checked={value as boolean}
            onCheckedChange={(checked) => updateValue(variable.key, checked)}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={variable.key}>{variable.displayName}</Label>
        <div className="flex items-center gap-2">
          <Input
            id={variable.key}
            type={variable.dataType === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => {
              const newValue =
                variable.dataType === "number"
                  ? parseFloat(e.target.value)
                  : e.target.value;
              updateValue(variable.key, newValue);
            }}
            className="flex-1"
          />
          {variable.unit && (
            <span className="text-sm text-muted-foreground w-20">
              {variable.unit}
            </span>
          )}
        </div>
        {variable.description && (
          <p className="text-xs text-muted-foreground">
            {variable.description}
          </p>
        )}
      </div>
    );
  };

  // Group variables by category
  const costVariables = CORE_CONFIG_VARIABLES.filter((v) =>
    ["labor_rate_hourly", "scrap_cost_per_unit"].includes(v.key)
  );

  const thresholdVariables = CORE_CONFIG_VARIABLES.filter((v) =>
    [
      "variance_threshold_pct",
      "min_variance_amount",
      "confidence_threshold_pct",
      "quality_min_issue_rate_pct",
      "pattern_min_orders",
    ].includes(v.key)
  );

  const focusVariables = CORE_CONFIG_VARIABLES.filter((v) =>
    v.key.startsWith("focus_")
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Settings</CardTitle>
          <CardDescription>
            Set your base cost rates for labor and scrap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {costVariables.map((variable) => (
            <div key={variable.key}>{renderInput(variable)}</div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detection Thresholds</CardTitle>
          <CardDescription>
            Configure sensitivity for anomaly detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {thresholdVariables.map((variable) => (
            <div key={variable.key}>{renderInput(variable)}</div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Focus Areas</CardTitle>
          <CardDescription>
            Enable or disable specific analysis types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {focusVariables.map((variable) => (
            <div key={variable.key}>{renderInput(variable)}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
