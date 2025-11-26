"use client";

import * as React from "react";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCircleDot,
  IconLink,
  IconLinkOff,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PropertyMapping } from "@/types/mapping";
import {
  buildDependencyGraph,
  getImpactedFields,
  DependencyGraph,
} from "@/lib/dependency-analyzer";

interface DependencyVisualizerProps {
  mappings: PropertyMapping[];
}

export function DependencyVisualizer({ mappings }: DependencyVisualizerProps) {
  const graph = React.useMemo(
    () => buildDependencyGraph(mappings),
    [mappings]
  );

  const [expandedField, setExpandedField] = React.useState<string | null>(null);

  const fieldsWithDeps = Array.from(graph.fields.values()).filter(
    (f) => f.dependsOn.length > 0 || f.dependedOnBy.length > 0
  );

  if (fieldsWithDeps.length === 0) {
    return (
      <Card className="p-6 text-center">
        <IconLinkOff className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No field dependencies detected
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add business rules that reference other fields to create dependencies
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold">Dependency Summary</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Fields with business rules that reference other fields
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {fieldsWithDeps.length} connected
            </Badge>
            {graph.orphanedFields.length > 0 && (
              <Badge variant="secondary">
                {graph.orphanedFields.length} isolated
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Circular Dependencies */}
      {graph.circularDependencies.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <IconAlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">
                Circular Dependencies Detected
              </h3>
              <p className="mt-1 text-xs text-red-700">
                These fields depend on each other in a cycle, which may cause
                issues
              </p>
              <div className="mt-2 space-y-1">
                {graph.circularDependencies.map((cycle, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded bg-white p-2 text-xs"
                  >
                    <IconCircleDot className="h-3 w-3 flex-shrink-0" />
                    <span className="font-mono">{cycle.cycle.join(" → ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dependency Chains */}
      {graph.dependencyChains.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Dependency Chains</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Fields that depend on other fields in sequence
          </p>
          <div className="mt-3 space-y-2">
            {graph.dependencyChains.slice(0, 5).map((chain, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded border bg-muted/30 p-2 text-xs"
              >
                <Badge variant="outline" className="text-[10px]">
                  {chain.depth} levels
                </Badge>
                <div className="flex flex-wrap items-center gap-1 font-mono">
                  {chain.chain.map((fieldId, i) => (
                    <React.Fragment key={fieldId}>
                      {i > 0 && <IconArrowRight className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-foreground">{fieldId}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Field Details */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold">Field Dependencies</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Click to see impact analysis for each field
        </p>
        <div className="mt-3 space-y-1">
          {fieldsWithDeps.map((field) => (
            <FieldDependencyItem
              key={field.fieldId}
              field={field}
              graph={graph}
              isExpanded={expandedField === field.fieldId}
              onToggle={() =>
                setExpandedField(
                  expandedField === field.fieldId ? null : field.fieldId
                )
              }
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

interface FieldDependencyItemProps {
  field: {
    fieldId: string;
    fieldName: string;
    dependsOn: string[];
    dependedOnBy: string[];
    hasBusinessRule: boolean;
    csvColumn?: string;
  };
  graph: DependencyGraph;
  isExpanded: boolean;
  onToggle: () => void;
}

function FieldDependencyItem({
  field,
  graph,
  isExpanded,
  onToggle,
}: FieldDependencyItemProps) {
  const impactedFields = React.useMemo(
    () => getImpactedFields(field.fieldId, graph),
    [field.fieldId, graph]
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="rounded border bg-background">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-left"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <IconChevronUp className="h-3 w-3" />
              ) : (
                <IconChevronDown className="h-3 w-3" />
              )}
              <span className="font-mono text-xs">{field.fieldId}</span>
              {field.hasBusinessRule && (
                <Badge variant="secondary" className="text-[10px]">
                  Rule
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {field.dependsOn.length > 0 && (
                <span>Uses {field.dependsOn.length}</span>
              )}
              {field.dependedOnBy.length > 0 && (
                <span>Used by {field.dependedOnBy.length}</span>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-3 border-t p-3 text-xs">
            {/* Source */}
            {field.csvColumn && (
              <div>
                <span className="font-semibold">Source: </span>
                <Badge variant="outline" className="text-[10px]">
                  {field.csvColumn}
                </Badge>
              </div>
            )}

            {/* Depends On */}
            {field.dependsOn.length > 0 && (
              <div>
                <span className="font-semibold">Depends on:</span>
                <div className="mt-1 space-y-1">
                  {field.dependsOn.map((depId) => (
                    <div key={depId} className="flex items-center gap-2 pl-4">
                      <IconLink className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono">{depId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Depended On By */}
            {field.dependedOnBy.length > 0 && (
              <div>
                <span className="font-semibold">Used by:</span>
                <div className="mt-1 space-y-1">
                  {field.dependedOnBy.map((depId) => (
                    <div key={depId} className="flex items-center gap-2 pl-4">
                      <IconLink className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono">{depId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Impact Analysis */}
            {impactedFields.length > 0 && (
              <div className="rounded bg-yellow-50 p-2">
                <span className="font-semibold text-yellow-900">
                  Impact Analysis:
                </span>
                <p className="mt-1 text-yellow-800">
                  Changing this field would affect {impactedFields.length} other
                  field{impactedFields.length !== 1 ? "s" : ""}
                </p>
                {impactedFields.length <= 5 && (
                  <div className="mt-1 space-y-1">
                    {impactedFields.map((id) => (
                      <div key={id} className="font-mono text-yellow-900">
                        • {id}
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
