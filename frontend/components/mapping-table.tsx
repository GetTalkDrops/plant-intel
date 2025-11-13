// components/mapping-table.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  IconTrash,
  IconPlus,
  IconCheck,
  IconChevronsDown,
  IconInfoCircle,
} from "@tabler/icons-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// FIX 4: Define proper type for ontology fields
interface OntologyField {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  hint?: string;
  unit?: string;
  relationship?: string;
}

// Full Production Ontology from Schema
const ontologyOptions: Record<string, OntologyField[]> = {
  "Work Order": [
    {
      key: "work_order_number",
      label: "Work Order Number",
      required: true,
      type: "string",
      hint: "Unique identifier for production order",
    },
    {
      key: "facility_id",
      label: "Facility ID",
      required: true,
      type: "integer",
      hint: "Manufacturing facility identifier",
    },
    {
      key: "uploaded_batch_id",
      label: "Uploaded Batch ID",
      type: "string",
      hint: "Batch tracking number",
    },
    {
      key: "operation_type",
      label: "Operation Type",
      type: "string",
      hint: "Type of manufacturing operation",
    },
    {
      key: "start_date",
      label: "Start Date",
      type: "date-time",
      hint: "Production start timestamp",
    },
    {
      key: "end_date",
      label: "End Date",
      type: "date-time",
      hint: "Production completion timestamp",
    },
  ],

  Material: [
    {
      key: "material_code",
      label: "Material Code",
      required: true,
      type: "string",
      hint: "Material SKU or identifier",
      relationship: "Links to Supplier ID for vendor tracking",
    },
    {
      key: "planned_material_cost",
      label: "Planned Material Cost",
      type: "number",
      unit: "$",
      hint: "Budgeted material cost",
    },
    {
      key: "actual_material_cost",
      label: "Actual Material Cost",
      type: "number",
      unit: "$",
      hint: "Actual material expenditure",
    },
    {
      key: "material_variance",
      label: "Material Variance",
      type: "number",
      unit: "$",
      hint: "Difference between planned and actual",
    },
    {
      key: "material_efficiency",
      label: "Material Efficiency",
      type: "number",
      unit: "%",
      hint: "Material utilization rate",
    },
    {
      key: "material_context",
      label: "Material Context",
      type: "string",
      hint: "Additional material notes",
    },
    {
      key: "unit_of_measure",
      label: "Unit of Measure",
      type: "string",
      hint: "Measurement unit (e.g., kg, lbs, units)",
    },
  ],

  Labor: [
    {
      key: "planned_labor_hours",
      label: "Planned Labor Hours",
      type: "number",
      unit: "hours",
      hint: "Expected labor hours",
    },
    {
      key: "actual_labor_hours",
      label: "Actual Labor Hours",
      type: "number",
      unit: "hours",
      hint: "Actual hours worked",
    },
    {
      key: "labor_cost_planned",
      label: "Planned Labor Cost",
      type: "number",
      unit: "$",
      hint: "Budgeted labor expense",
    },
    {
      key: "labor_cost_actual",
      label: "Actual Labor Cost",
      type: "number",
      unit: "$",
      hint: "Actual labor expense",
    },
    {
      key: "labor_variance",
      label: "Labor Variance",
      type: "number",
      unit: "$",
      hint: "Difference between planned and actual",
    },
    {
      key: "labor_efficiency",
      label: "Labor Efficiency",
      type: "number",
      unit: "%",
      hint: "Labor productivity rate",
    },
    {
      key: "labor_context",
      label: "Labor Context",
      type: "string",
      hint: "Additional labor notes",
    },
  ],

  Supplier: [
    {
      key: "supplier_id",
      label: "Supplier ID",
      type: "string",
      hint: "Vendor identifier",
      relationship: "Links to Material Code for vendor analysis",
    },
    {
      key: "supplier_name",
      label: "Supplier Name",
      type: "string",
      hint: "Vendor company name",
    },
    {
      key: "supplier_rating",
      label: "Supplier Rating",
      type: "number",
      hint: "Vendor performance score",
    },
    {
      key: "supplier_cost_variance",
      label: "Supplier Cost Variance",
      type: "number",
      unit: "$",
      hint: "Cost deviation from vendor quotes",
    },
  ],

  Quality: [
    {
      key: "quality_issues",
      label: "Quality Issues",
      type: "boolean/integer",
      hint: "Quality flag or count",
    },
    {
      key: "units_scrapped",
      label: "Units Scrapped",
      type: "number",
      hint: "Number of rejected units",
    },
    {
      key: "scrap_cost_per_unit",
      label: "Scrap Cost per Unit",
      type: "number",
      unit: "$",
      hint: "Cost per scrapped unit",
    },
    {
      key: "scrap_rate",
      label: "Scrap Rate",
      type: "number",
      unit: "%",
      hint: "Percentage of units scrapped",
    },
    {
      key: "quality_impact",
      label: "Quality Impact",
      type: "number",
      unit: "$",
      hint: "Financial impact of quality issues",
    },
    {
      key: "primary_driver",
      label: "Primary Quality Driver",
      type: "string",
      hint: "Root cause of quality issues",
    },
  ],

  Performance: [
    {
      key: "total_variance",
      label: "Total Variance",
      type: "number",
      unit: "$",
      hint: "Overall cost deviation",
    },
    {
      key: "total_planned",
      label: "Total Planned Cost",
      type: "number",
      unit: "$",
      hint: "Total budgeted cost",
    },
    {
      key: "variance_threshold",
      label: "Variance Threshold",
      type: "number",
      unit: "$",
      hint: "Alert threshold for variances",
    },
    {
      key: "confidence_score",
      label: "Confidence Score",
      type: "number",
      hint: "Analysis confidence level (0-1)",
    },
    {
      key: "risk_level",
      label: "Risk Level",
      type: "enum",
      hint: "low, medium, high, or critical",
    },
  ],

  Trend: [
    {
      key: "baseline_current",
      label: "Current Baseline",
      type: "number",
      hint: "Current performance baseline",
    },
    {
      key: "baseline_rolling_avg",
      label: "Rolling Average Baseline",
      type: "number",
      hint: "Moving average baseline",
    },
    {
      key: "deviation_pct",
      label: "Deviation Percentage",
      type: "number",
      unit: "%",
      hint: "Deviation from baseline",
    },
    {
      key: "trend_direction",
      label: "Trend Direction",
      type: "enum",
      hint: "increasing, decreasing, or stable",
    },
    {
      key: "trend_start_date",
      label: "Trend Start Date",
      type: "date-time",
      hint: "When trend was first detected",
    },
  ],

  Correlation: [
    {
      key: "correlated_variables",
      label: "Correlated Variables",
      type: "array",
      hint: "Comma-separated related variables",
    },
    {
      key: "correlation_strength",
      label: "Correlation Strength",
      type: "number",
      hint: "Strength of relationship (-1 to 1)",
    },
    {
      key: "relationship_type",
      label: "Relationship Type",
      type: "enum",
      hint: "positive or negative correlation",
    },
  ],

  Prediction: [
    {
      key: "predicted_variance",
      label: "Predicted Variance",
      type: "number",
      unit: "$",
      hint: "Forecasted cost deviation",
    },
    {
      key: "predicted_efficiency_savings",
      label: "Predicted Efficiency Savings",
      type: "number",
      unit: "$",
      hint: "Expected cost savings",
    },
    {
      key: "primary_driver",
      label: "Primary Driver",
      type: "string",
      hint: "Main factor affecting prediction",
    },
    {
      key: "recommended_actions",
      label: "Recommended Actions",
      type: "array",
      hint: "Comma-separated action items",
    },
    {
      key: "confidence_level",
      label: "Confidence Level",
      type: "number",
      unit: "%",
      hint: "Prediction confidence (0-100)",
    },
  ],

  Metadata: [
    {
      key: "facility_name",
      label: "Facility Name",
      type: "string",
      hint: "Manufacturing facility name",
    },
    {
      key: "time_window",
      label: "Time Window",
      type: "string",
      hint: "Time period for data",
    },
    {
      key: "data_source",
      label: "Data Source",
      type: "string",
      hint: "Origin system (ERP, MES, etc.)",
    },
    {
      key: "mapping_version",
      label: "Mapping Version",
      type: "string",
      hint: "Version of this mapping config",
    },
    {
      key: "uploaded_by",
      label: "Uploaded By",
      type: "string",
      hint: "User who uploaded data",
    },
    {
      key: "timestamp",
      label: "Timestamp",
      type: "date-time",
      hint: "Upload timestamp",
    },
  ],
};

// Flatten for search
const allOntologyFields = Object.entries(ontologyOptions).flatMap(
  ([group, fields]) =>
    fields.map((field) => ({
      ...field,
      group,
    }))
);

interface MappingRow {
  id: string;
  csvColumn: string;
  ontologyField: string;
  relationship?: string;
}

interface MappingTableProps {
  csvHeaders?: string[];
  existingMapping?: MappingRow[];
  onSave: (mapping: {
    rows: MappingRow[];
    metadata: {
      name: string;
      description?: string;
    };
  }) => void;
  showMetadata?: boolean;
}

export default function MappingTable({
  csvHeaders = [],
  existingMapping = [],
  onSave,
  showMetadata = true,
}: MappingTableProps) {
  const [mapName, setMapName] = useState("");
  const [mapDescription, setMapDescription] = useState("");

  // FIX 2: Initialize state properly
  const [rows, setRows] = useState<MappingRow[]>(() => {
    if (existingMapping.length > 0) {
      return existingMapping;
    } else if (csvHeaders.length > 0) {
      return csvHeaders.map((header, idx) => ({
        id: `row-${idx}`,
        csvColumn: header,
        ontologyField: "",
        relationship: "",
      }));
    }
    return [
      {
        id: "row-0",
        csvColumn: "",
        ontologyField: "",
        relationship: "",
      },
    ];
  });

  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  // FIX 3: Fix useEffect dependencies and synchronous setState
  useEffect(() => {
    // Only update if props actually changed
    const csvHeadersChanged =
      csvHeaders.length > 0 &&
      (rows.length !== csvHeaders.length ||
        rows.some((row, idx) => row.csvColumn !== csvHeaders[idx]));

    const existingMappingChanged =
      existingMapping.length > 0 &&
      JSON.stringify(rows) !== JSON.stringify(existingMapping);

    if (existingMappingChanged) {
      setRows(existingMapping);
    } else if (csvHeadersChanged) {
      setRows(
        csvHeaders.map((header, idx) => ({
          id: `row-${idx}`,
          csvColumn: header,
          ontologyField: "",
          relationship: "",
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvHeaders, existingMapping]); // FIX 3: Added all dependencies

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: `row-${Date.now()}`,
        csvColumn: "",
        ontologyField: "",
        relationship: "",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleRowChange = (
    id: string,
    field: keyof MappingRow,
    value: string
  ) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const validateMapping = (rows: MappingRow[]) => {
    const errors: string[] = [];

    // Check for required fields
    const hasWorkOrder = rows.some(
      (r) => r.ontologyField === "work_order_number"
    );
    const hasFacilityId = rows.some((r) => r.ontologyField === "facility_id");
    const hasMaterialCode = rows.some(
      (r) => r.ontologyField === "material_code"
    );

    if (!hasWorkOrder) {
      errors.push("Work Order Number is required");
    }
    if (!hasFacilityId) {
      errors.push("Facility ID is required");
    }
    if (!hasMaterialCode) {
      errors.push("Material Code is required (for cost analysis)");
    }

    return errors;
  };

  const handleSave = () => {
    // Validation
    if (showMetadata && !mapName.trim()) {
      toast.error("Please enter a map name");
      return;
    }

    const unmapped = rows.filter((row) => row.csvColumn && !row.ontologyField);
    if (unmapped.length > 0) {
      toast.error(
        `Please map all columns. Missing: ${unmapped
          .map((r) => r.csvColumn)
          .join(", ")}`
      );
      return;
    }

    // Schema validation
    const validationErrors = validateMapping(rows);
    if (validationErrors.length > 0) {
      toast.error(`Validation failed: ${validationErrors.join(", ")}`);
      return;
    }

    const payload = {
      rows,
      metadata: {
        name: mapName,
        description: mapDescription,
      },
    };

    onSave(payload);
    toast.success("Mapping saved successfully!");
  };

  const getFieldInfo = (fieldKey: string) => {
    return allOntologyFields.find((f) => f.key === fieldKey);
  };

  return (
    <Card className="shadow-xl border rounded-2xl">
      <CardHeader>
        <h2 className="text-xl font-semibold">
          Map CSV Columns to Plant Intel Ontology
        </h2>
        <p className="text-sm text-muted-foreground">
          Match your data fields to standardized ontology variables for accurate
          analysis. Required fields are marked with
          <span className="text-red-500 ml-1">*</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metadata Section */}
        {showMetadata && (
          <div className="space-y-4 border-b pb-6">
            <div className="space-y-2">
              <Label htmlFor="map-name">
                Map Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="map-name"
                placeholder="e.g., ERP Production Template"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="map-description">Description</Label>
              <Input
                id="map-description"
                placeholder="Optional description"
                value={mapDescription}
                onChange={(e) => setMapDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Mapping Table */}
        <div className="max-h-[60vh] overflow-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr className="text-left">
                <th className="p-3 font-medium w-1/4">CSV Column Name</th>
                <th className="p-3 font-medium w-2/5">Ontology Variable</th>
                <th className="p-3 font-medium w-1/4">
                  Relationship (Optional)
                </th>
                <th className="p-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              <TooltipProvider>
                {rows.map((row) => {
                  const selectedField = getFieldInfo(row.ontologyField);
                  return (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        {csvHeaders.length > 0 ? (
                          <span className="font-medium">{row.csvColumn}</span>
                        ) : (
                          <Input
                            placeholder="e.g., Order_ID"
                            value={row.csvColumn}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "csvColumn",
                                e.target.value
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-2">
                          {/* Searchable Combobox */}
                          <Popover
                            open={openPopovers[row.id]}
                            onOpenChange={(open) =>
                              setOpenPopovers({
                                ...openPopovers,
                                [row.id]: open,
                              })
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !row.ontologyField && "text-muted-foreground"
                                )}
                              >
                                {row.ontologyField ? (
                                  <span className="truncate">
                                    {selectedField?.label}
                                    {selectedField?.unit && (
                                      <span className="text-muted-foreground ml-1">
                                        ({selectedField.unit})
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  "Select ontology field..."
                                )}
                                <IconChevronsDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Search fields..." />
                                <CommandList>
                                  <CommandEmpty>No field found.</CommandEmpty>
                                  {Object.entries(ontologyOptions).map(
                                    ([group, options]) => (
                                      <CommandGroup key={group} heading={group}>
                                        {options.map((opt) => (
                                          <CommandItem
                                            key={opt.key}
                                            value={`${opt.key} ${opt.label}`}
                                            onSelect={() => {
                                              handleRowChange(
                                                row.id,
                                                "ontologyField",
                                                opt.key
                                              );
                                              setOpenPopovers({
                                                ...openPopovers,
                                                [row.id]: false,
                                              });
                                            }}
                                          >
                                            <IconCheck
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                row.ontologyField === opt.key
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                            <div className="flex flex-col flex-1">
                                              <div className="flex items-center gap-2">
                                                <span>{opt.label}</span>
                                                {opt.required && (
                                                  <Badge
                                                    variant="destructive"
                                                    className="text-xs"
                                                  >
                                                    Required
                                                  </Badge>
                                                )}
                                                {opt.unit && (
                                                  <span className="text-xs text-muted-foreground">
                                                    ({opt.unit})
                                                  </span>
                                                )}
                                              </div>
                                              {opt.type && (
                                                <span className="text-xs text-muted-foreground">
                                                  Type: {opt.type}
                                                </span>
                                              )}
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {/* Field Info & Hints */}
                          {selectedField && selectedField.hint && (
                            <div className="flex items-start gap-2 text-xs">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <IconInfoCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{selectedField.hint}</p>
                                  {selectedField.relationship && (
                                    <p className="mt-2 text-blue-400">
                                      💡 {selectedField.relationship}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-muted-foreground">
                                {selectedField.hint}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="e.g., Machine ID"
                          value={row.relationship || ""}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "relationship",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={rows.length === 1}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </TooltipProvider>
            </tbody>
          </table>
        </div>

        {/* Add Row Button */}
        {csvHeaders.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="w-full"
          >
            <IconPlus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave} size="lg">
            Save Mapping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
