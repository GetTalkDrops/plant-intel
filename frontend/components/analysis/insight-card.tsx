// components/analysis/insight-card.tsx

import * as React from "react";
import { IconAlertTriangle, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface InsightCardProps {
  title: string;
  description: string;
  impact?: number;
  savingsOpportunity?: number;
  riskLevel?: "low" | "medium" | "high";
  confidence?: number;
  category?: string;
  trend?: "up" | "down" | "stable";
  workOrderCount?: number;
  onClick?: () => void;
}

export function InsightCard({
  title,
  description,
  impact,
  savingsOpportunity,
  riskLevel,
  confidence,
  category,
  trend,
  workOrderCount,
  onClick,
}: InsightCardProps) {
  const getRiskColor = (level?: string) => {
    switch (level) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
      case "medium":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900";
      case "low":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900";
      default:
        return "";
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        riskLevel && getRiskColor(riskLevel)
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header with title and badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {riskLevel && (
              <Badge variant="outline" className="text-xs">
                <IconAlertTriangle className="h-3 w-3 mr-1" />
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{description}</p>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {impact !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Impact:</span>
              <span className="font-semibold">{formatCurrency(impact)}</span>
            </div>
          )}

          {savingsOpportunity !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Savings:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(savingsOpportunity)}
              </span>
            </div>
          )}

          {confidence !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">{Math.round(confidence * 100)}%</span>
            </div>
          )}

          {workOrderCount !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Work Orders:</span>
              <span className="font-medium">{workOrderCount}</span>
            </div>
          )}

          {trend && trend !== "stable" && (
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <IconTrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <IconTrendingDown className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
