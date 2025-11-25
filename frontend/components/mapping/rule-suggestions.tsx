"use client";

import * as React from "react";
import { IconBulb, IconCheck, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PatternSuggestion } from "@/lib/pattern-detector";
import { BusinessRule } from "@/types/mapping";

interface RuleSuggestionsProps {
  suggestions: PatternSuggestion[];
  onApplySuggestion: (rule: BusinessRule) => void;
  onDismiss: () => void;
}

export function RuleSuggestions({
  suggestions,
  onApplySuggestion,
  onDismiss,
}: RuleSuggestionsProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

  if (suggestions.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.6) return "text-blue-600 bg-blue-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconBulb className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-sm">Smart Suggestions</h4>
              <p className="text-xs text-muted-foreground">
                Detected {suggestions.length} pattern
                {suggestions.length > 1 ? "s" : ""} in your data
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 text-muted-foreground"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions List */}
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`rounded-lg border bg-white p-3 ${
                expandedIndex === index ? "border-blue-300" : "border-gray-200"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getConfidenceColor(
                          suggestion.confidence
                        )}`}
                      >
                        {getConfidenceLabel(suggestion.confidence)} confidence
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{suggestion.reason}</p>
                  </div>
                </div>
              </button>

              {expandedIndex === index && (
                <div className="mt-3 space-y-3 border-t pt-3">
                  <div className="text-xs text-muted-foreground">
                    {suggestion.fieldAnalysis}
                  </div>

                  {/* Preview of suggested rule */}
                  <div className="rounded-md bg-muted/50 p-2 text-xs">
                    <p className="font-medium mb-1">Rule Preview:</p>
                    {suggestion.type === "lookup" && (
                      <div className="space-y-1">
                        <p>
                          Type: Lookup Table (
                          {
                            Object.keys(
                              (suggestion.suggestedRule.config as any)
                                .lookupTable
                            ).length
                          }{" "}
                          entries)
                        </p>
                        <p>
                          Source:{" "}
                          {(suggestion.suggestedRule.config as any).sourceField}
                        </p>
                      </div>
                    )}
                    {suggestion.type === "conditional" && (
                      <div className="space-y-1">
                        <p>
                          Type: Conditional (
                          {
                            (suggestion.suggestedRule.config as any).conditions
                              .length
                          }{" "}
                          condition
                          {(suggestion.suggestedRule.config as any).conditions
                            .length > 1
                            ? "s"
                            : ""}
                          )
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => onApplySuggestion(suggestion.suggestedRule)}
                    size="sm"
                    className="w-full gap-2"
                  >
                    <IconCheck className="h-4 w-4" />
                    Apply This Suggestion
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {suggestions.length > 1 && (
          <p className="text-xs text-muted-foreground text-center">
            Click on a suggestion to expand and apply
          </p>
        )}
      </div>
    </Card>
  );
}
