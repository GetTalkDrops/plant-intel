"use client";

import * as React from "react";
import { IconSparkles, IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RuleTemplate, RULE_TEMPLATES, TemplateParams } from "@/lib/rule-templates";
import { BusinessRule } from "@/types/mapping";

interface RuleTemplateSelectorProps {
  availableFields: string[];
  onApplyTemplate: (rule: BusinessRule) => void;
}

export function RuleTemplateSelector({
  availableFields,
  onApplyTemplate,
}: RuleTemplateSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<RuleTemplate | null>(null);
  const [params, setParams] = React.useState<TemplateParams>({});

  const handleApply = () => {
    if (!selectedTemplate) return;

    const rule = selectedTemplate.createRule(params);
    onApplyTemplate(rule);
    setOpen(false);
    setSelectedTemplate(null);
    setParams({});
  };

  const categoryColors: Record<string, string> = {
    labor: "bg-blue-100 text-blue-800",
    material: "bg-green-100 text-green-800",
    machine: "bg-purple-100 text-purple-800",
    time: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <IconSparkles className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rule Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built template to quickly configure common business rules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          {!selectedTemplate ? (
            <div className="space-y-3">
              {RULE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge
                          variant="secondary"
                          className={categoryColors[template.category]}
                        >
                          {template.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.ruleType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Template Configuration
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setParams({});
                  }}
                >
                  ← Back
                </Button>
                <div className="flex-1">
                  <h4 className="font-medium">{selectedTemplate.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Configure Template</p>
                </div>

                {selectedTemplate.ruleType === "lookup" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Source Field</Label>
                    <Select
                      value={params.sourceField || ""}
                      onValueChange={(value) =>
                        setParams({ ...params, sourceField: value })
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Select field to use as lookup key" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The field whose value will be used to look up results
                    </p>
                  </div>
                )}

                {selectedTemplate.ruleType === "conditional" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Condition Field</Label>
                    <Select
                      value={params.conditionField || ""}
                      onValueChange={(value) =>
                        setParams({ ...params, conditionField: value })
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Select field to evaluate" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The field whose value will be checked against conditions
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Default Value (optional)</Label>
                  <Input
                    placeholder="Fallback value"
                    value={params.defaultValue || ""}
                    onChange={(e) =>
                      setParams({ ...params, defaultValue: e.target.value })
                    }
                    className="h-8"
                  />
                  <p className="text-xs text-muted-foreground">
                    Value to use when no conditions match
                  </p>
                </div>

                {/* Preview the template structure */}
                <div className="rounded-lg bg-muted/50 p-3 text-xs">
                  <p className="font-medium mb-2">Template Preview:</p>
                  <div className="space-y-1 text-muted-foreground">
                    {selectedTemplate.ruleType === "lookup" && (
                      <p>
                        Will create a lookup table with pre-filled example values.
                        You can edit these after applying.
                      </p>
                    )}
                    {selectedTemplate.ruleType === "conditional" && (
                      <p>
                        Will create conditions with pre-filled logic. You can edit
                        conditions and values after applying.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={
                    (selectedTemplate.ruleType === "lookup" && !params.sourceField) ||
                    (selectedTemplate.ruleType === "conditional" && !params.conditionField)
                  }
                >
                  Apply Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
