"use client";

import * as React from "react";
import {
  IconShieldCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ConfidenceScore,
  ConfidenceWarning,
  getConfidenceColor,
  getConfidenceLevel,
} from "@/lib/confidence-scorer";

interface ConfidenceScorePanelProps {
  score: ConfidenceScore;
}

export function ConfidenceScorePanel({ score }: ConfidenceScorePanelProps) {
  const [breakdownOpen, setBreakdownOpen] = React.useState(false);
  const [warningsOpen, setWarningsOpen] = React.useState(true);

  const colorClass = getConfidenceColor(score.overall);
  const level = getConfidenceLevel(score.overall);

  // Group warnings by severity
  const errors = score.warnings.filter((w) => w.severity === "error");
  const warnings = score.warnings.filter((w) => w.severity === "warning");
  const info = score.warnings.filter((w) => w.severity === "info");

  return (
    <Card className="border-2 bg-muted/30 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Mapping Confidence</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Quality score based on completeness and validation
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${colorClass}`}>
            {score.overall}%
          </div>
          <Badge
            variant={score.overall >= 70 ? "default" : "secondary"}
            className="mt-1"
          >
            {level}
          </Badge>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mt-4">
        <Progress value={score.overall} className="h-2" />
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded border bg-background p-2">
          <div className="text-muted-foreground">Mapped Fields</div>
          <div className="mt-1 text-lg font-semibold">
            {score.metrics.mappedFields}/{score.metrics.totalFields}
          </div>
        </div>
        <div className="rounded border bg-background p-2">
          <div className="text-muted-foreground">Required Fields</div>
          <div className="mt-1 text-lg font-semibold">
            {score.metrics.requiredFieldsMapped}/{score.metrics.requiredFields}
          </div>
        </div>
        <div className="rounded border bg-background p-2">
          <div className="text-muted-foreground">Business Rules</div>
          <div className="mt-1 text-lg font-semibold">
            {score.metrics.fieldsWithRules}
          </div>
        </div>
        <div className="rounded border bg-background p-2">
          <div className="text-muted-foreground">Issues</div>
          <div className="mt-1 text-lg font-semibold">
            {score.metrics.totalErrors + score.metrics.totalWarnings}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-between text-xs"
          >
            <span>Score Breakdown</span>
            {breakdownOpen ? (
              <IconChevronUp className="h-3 w-3" />
            ) : (
              <IconChevronDown className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2 text-xs">
          <BreakdownItem
            label="Mapping Completeness"
            value={score.breakdown.mappingCompleteness}
            weight="40%"
          />
          <BreakdownItem
            label="Validation Health"
            value={score.breakdown.validationHealth}
            weight="30%"
          />
          <BreakdownItem
            label="Sample Data Coverage"
            value={score.breakdown.sampleDataCoverage}
            weight="20%"
          />
          <BreakdownItem
            label="Business Rules Coverage"
            value={score.breakdown.businessRulesCoverage}
            weight="10%"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold">Recommendations</div>
          <div className="space-y-1">
            {score.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded bg-blue-50 p-2 text-xs text-blue-900"
              >
                <IconInfoCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings & Errors */}
      {score.warnings.length > 0 && (
        <Collapsible
          open={warningsOpen}
          onOpenChange={setWarningsOpen}
          className="mt-4"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs"
            >
              <span>
                Issues ({errors.length} errors, {warnings.length} warnings,{" "}
                {info.length} info)
              </span>
              {warningsOpen ? (
                <IconChevronUp className="h-3 w-3" />
              ) : (
                <IconChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {errors.map((warning, idx) => (
              <WarningItem key={`error-${idx}`} warning={warning} />
            ))}
            {warnings.map((warning, idx) => (
              <WarningItem key={`warning-${idx}`} warning={warning} />
            ))}
            {info.map((warning, idx) => (
              <WarningItem key={`info-${idx}`} warning={warning} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
}

function BreakdownItem({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  const colorClass = getConfidenceColor(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">
          {label} <span className="text-[10px]">({weight})</span>
        </span>
        <span className={`font-semibold ${colorClass}`}>
          {Math.round(value)}%
        </span>
      </div>
      <Progress value={value} className="h-1" />
    </div>
  );
}

function WarningItem({ warning }: { warning: ConfidenceWarning }) {
  const bgClass =
    warning.severity === "error"
      ? "bg-red-50 text-red-900"
      : warning.severity === "warning"
        ? "bg-yellow-50 text-yellow-900"
        : "bg-blue-50 text-blue-900";

  const Icon =
    warning.severity === "error" || warning.severity === "warning"
      ? IconAlertCircle
      : IconInfoCircle;

  return (
    <div className={`flex items-start gap-2 rounded p-2 text-xs ${bgClass}`}>
      <Icon className="mt-0.5 h-3 w-3 flex-shrink-0" />
      <div>
        {warning.field && (
          <div className="font-semibold">{warning.field}</div>
        )}
        <div>{warning.message}</div>
      </div>
    </div>
  );
}
