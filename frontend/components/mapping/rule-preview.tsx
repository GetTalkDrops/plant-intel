"use client";

import * as React from "react";
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RulePreviewResult } from "@/lib/business-rule-validator";

interface RulePreviewProps {
  result: RulePreviewResult;
}

export function RulePreview({ result }: RulePreviewProps) {
  if (result.errors.length > 0) {
    return (
      <div className="space-y-2">
        {result.errors.map((error, i) => (
          <Alert key={i} variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {result.matchedRows}
          </div>
          <div className="text-xs text-muted-foreground">Matched</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {result.defaultRows}
          </div>
          <div className="text-xs text-muted-foreground">Default</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {result.unmatchedRows}
          </div>
          <div className="text-xs text-muted-foreground">Unmatched</div>
        </div>
      </div>

      {/* Coverage Percentage */}
      <div className="rounded-lg border p-3">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Coverage</span>
          <span className="font-medium">
            {result.totalRows > 0
              ? Math.round(
                  ((result.matchedRows + result.defaultRows) / result.totalRows) * 100
                )
              : 0}
            %
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-green-500"
            style={{
              width: `${
                result.totalRows > 0
                  ? ((result.matchedRows + result.defaultRows) / result.totalRows) * 100
                  : 0
              }%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {result.matchedRows + result.defaultRows} of {result.totalRows} sample rows will
          have values
        </p>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((warning, i) => (
            <Alert
              key={i}
              variant={warning.severity === "warning" ? "default" : "default"}
            >
              {warning.severity === "warning" ? (
                <IconAlertTriangle className="h-4 w-4" />
              ) : (
                <IconInfoCircle className="h-4 w-4" />
              )}
              <AlertDescription>{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Sample Matches */}
      {result.matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium">Sample Matches:</p>
          <div className="space-y-1">
            {result.matches.slice(0, 5).map((match, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Row {match.rowIndex + 1}
                  </Badge>
                  <span className="text-muted-foreground">{match.matchReason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCircleCheck className="h-3 w-3 text-green-500" />
                  <span className="font-medium">{String(match.resultValue)}</span>
                </div>
              </div>
            ))}
            {result.matches.length > 5 && (
              <p className="text-xs text-muted-foreground">
                ... and {result.matches.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
