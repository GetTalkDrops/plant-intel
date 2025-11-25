// components/upload/validation-warnings.tsx

"use client";

import { MappingValidationIssue } from "@/types/mapping";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface Props {
  issues: MappingValidationIssue[];
}

export function ValidationWarnings({ issues }: Props) {
  if (issues.length === 0) {
    return null;
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  const getIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = (severity: string): "default" | "destructive" => {
    return severity === "error" ? "destructive" : "default";
  };

  return (
    <div className="space-y-4">
      {errors.map((issue, idx) => (
        <Alert key={`error-${idx}`} variant="destructive">
          <div className="flex items-start gap-3">
            {getIcon(issue.severity)}
            <div className="flex-1">
              <AlertTitle className="font-semibold">
                {issue.field === "multiple"
                  ? "Mapping Error"
                  : `Error: ${issue.field}`}
              </AlertTitle>
              <AlertDescription className="mt-1">
                {issue.message}
                {issue.affectedRows && (
                  <div className="text-sm mt-1 opacity-90">
                    Affects {issue.affectedRows} rows
                  </div>
                )}
                {issue.suggestion && (
                  <div className="text-sm mt-2 font-medium">
                    → {issue.suggestion}
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}

      {warnings.map((issue, idx) => (
        <Alert
          key={`warning-${idx}`}
          className="border-yellow-300 bg-yellow-50"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <AlertTitle className="font-semibold text-yellow-900">
                Warning: {issue.field}
              </AlertTitle>
              <AlertDescription className="mt-1 text-yellow-800">
                {issue.message}
                {issue.affectedRows && (
                  <div className="text-sm mt-1">
                    Affects {issue.affectedRows} rows
                  </div>
                )}
                {issue.suggestion && (
                  <div className="text-sm mt-2 font-medium">
                    → {issue.suggestion}
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}

      {infos.map((issue, idx) => (
        <Alert key={`info-${idx}`} className="border-blue-300 bg-blue-50">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <AlertTitle className="font-semibold text-blue-900">
                Info: {issue.field}
              </AlertTitle>
              <AlertDescription className="mt-1 text-blue-800">
                {issue.message}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
