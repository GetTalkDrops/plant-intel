"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InsightCard, AIChat } from "@/components/analysis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

// Mock analysis data - will be replaced with API fetch
const mockAnalysis = {
  id: "analysis-1",
  name: "Q4 Production Analysis",
  uploadedAt: "2025-01-20T10:30:00Z",
  status: "completed",
  fileData: {
    fileName: "q4_production.csv",
    rowCount: 156,
    mappingProfiles: ["Standard Production Data"],
  },
  summary: {
    totalImpact: 125000,
    savingsOpportunity: 42000,
    workOrderCount: 156,
    patternsFound: 12,
  },
  patterns: [
    {
      id: "pattern-1",
      title: "High Material Variance - Supplier A",
      description:
        "Supplier A shows consistently higher material costs (+18%) compared to historical baseline. 24 work orders affected with $15,200 total variance.",
      category: "Material Cost",
      impact: 15200,
      savingsOpportunity: 8500,
      riskLevel: "high" as const,
      confidence: 0.92,
      workOrderCount: 24,
      trend: "up" as const,
    },
    {
      id: "pattern-2",
      title: "Labor Efficiency Improvement Opportunity",
      description:
        "Operations team averaging 15% longer cycle times on Assembly Line 3 compared to similar work orders. Process review recommended.",
      category: "Labor",
      impact: 8900,
      savingsOpportunity: 6200,
      riskLevel: "medium" as const,
      confidence: 0.87,
      workOrderCount: 42,
      trend: "stable" as const,
    },
    {
      id: "pattern-3",
      title: "Optimal Scheduling Pattern Detected",
      description:
        "Work orders scheduled on Tuesday-Wednesday show 12% better material utilization and 8% faster completion times.",
      category: "Operations",
      impact: -12000,
      savingsOpportunity: 12000,
      riskLevel: "low" as const,
      confidence: 0.94,
      workOrderCount: 38,
      trend: "down" as const,
    },
    {
      id: "pattern-4",
      title: "Equipment Downtime Correlation",
      description:
        "Machine M-401 maintenance correlates with 22% increase in labor hours on dependent operations. Preventive maintenance optimization needed.",
      category: "Equipment",
      impact: 18500,
      savingsOpportunity: 11000,
      riskLevel: "high" as const,
      confidence: 0.89,
      workOrderCount: 19,
      trend: "up" as const,
    },
  ],
  workOrders: [
    {
      id: "wo-1",
      workOrderNumber: "WO-2024-1501",
      totalVariance: 2850,
      riskLevel: "high" as const,
      confidence: 0.94,
      variances: {
        material: 1800,
        labor: 850,
        overhead: 200,
      },
      patterns: ["High Material Variance - Supplier A"],
    },
    {
      id: "wo-2",
      workOrderNumber: "WO-2024-1502",
      totalVariance: 1200,
      riskLevel: "medium" as const,
      confidence: 0.88,
      variances: {
        material: 400,
        labor: 650,
        overhead: 150,
      },
      patterns: ["Labor Efficiency Improvement Opportunity"],
    },
    {
      id: "wo-3",
      workOrderNumber: "WO-2024-1503",
      totalVariance: -450,
      riskLevel: "low" as const,
      confidence: 0.96,
      variances: {
        material: -300,
        labor: -100,
        overhead: -50,
      },
      patterns: ["Optimal Scheduling Pattern Detected"],
    },
  ],
};

export default function AnalysisDetailPage() {
  const params = useParams();
  const analysisId = params.id as string;
  const [expandedWorkOrders, setExpandedWorkOrders] = React.useState<Set<string>>(new Set());

  // Load analysis data (will be API call)
  const analysis = mockAnalysis;

  const toggleWorkOrder = (woId: string) => {
    setExpandedWorkOrders((prev) => {
      const next = new Set(prev);
      if (next.has(woId)) {
        next.delete(woId);
      } else {
        next.add(woId);
      }
      return next;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{analysis.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
              <span>{analysis.fileData.fileName}</span>
              <span>•</span>
              <span>{analysis.fileData.rowCount} rows</span>
              <span>•</span>
              <span>{formatDate(analysis.uploadedAt)}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysis.fileData.mappingProfiles.map((profile) => (
                <Badge key={profile} variant="secondary">
                  {profile}
                </Badge>
              ))}
              <Badge variant="outline" className="text-green-600 border-green-600">
                {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analysis.summary.totalImpact)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Savings Opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(analysis.summary.savingsOpportunity)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Work Orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.summary.workOrderCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Patterns Found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.summary.patternsFound}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Insights */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Pattern Insights</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {analysis.patterns.map((pattern) => (
            <InsightCard
              key={pattern.id}
              title={pattern.title}
              description={pattern.description}
              category={pattern.category}
              impact={pattern.impact}
              savingsOpportunity={pattern.savingsOpportunity}
              riskLevel={pattern.riskLevel}
              confidence={pattern.confidence}
              workOrderCount={pattern.workOrderCount}
              trend={pattern.trend}
            />
          ))}
        </div>
      </div>

      {/* Work Order Details */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Work Order Details</h3>
        <div className="space-y-2">
          {analysis.workOrders.map((wo) => {
            const isExpanded = expandedWorkOrders.has(wo.id);
            return (
              <div
                key={wo.id}
                className="rounded-lg border bg-card transition-all"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleWorkOrder(wo.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-semibold">{wo.workOrderNumber}</span>
                    <Badge variant={getRiskBadgeVariant(wo.riskLevel)}>
                      {wo.riskLevel.charAt(0).toUpperCase() + wo.riskLevel.slice(1)} Risk
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Variance: {formatCurrency(wo.totalVariance)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {Math.round(wo.confidence * 100)}%
                    </span>
                  </div>
                  {isExpanded ? (
                    <IconChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <IconChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t">
                    <div className="pt-4">
                      <h4 className="text-sm font-medium mb-2">Variance Breakdown</h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Material:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(wo.variances.material)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Labor:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(wo.variances.labor)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Overhead:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(wo.variances.overhead)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Related Patterns</h4>
                      <div className="flex flex-wrap gap-2">
                        {wo.patterns.map((pattern, idx) => (
                          <Badge key={idx} variant="outline">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Chat Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Ask AI About This Analysis</h3>
        <AIChat analysisId={analysisId} analysisContext={analysis} />
      </div>
    </div>
  );
}
