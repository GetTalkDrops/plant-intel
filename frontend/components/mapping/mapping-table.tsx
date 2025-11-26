"use client";

import * as React from "react";
import {
  IconCircleCheckFilled,
  IconAlertTriangle,
  IconGripVertical,
  IconSettings,
} from "@tabler/icons-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyMapping, CSVUpload, SourceType, FieldTransformation, BusinessRule } from "@/types/mapping";
import {
  getEntityNames,
  getEntityProperties,
} from "@/lib/ontology-schema";
import { formatSampleData, getSampleData } from "@/lib/csv-utils";
import { reconstructSampleRows } from "@/lib/sample-data-utils";
import { FieldConfigPanel } from "./field-config-panel";

interface MappingTableProps {
  csvData?: CSVUpload;
  initialMappings?: PropertyMapping[];
  onChange?: (mappings: PropertyMapping[]) => void;
}

export function MappingTable({
  csvData,
  initialMappings = [],
  onChange,
}: MappingTableProps) {
  const [mappings, setMappings] = React.useState<PropertyMapping[]>(() => {
    // If CSV data is provided and no initial mappings, create rows from CSV columns
    if (csvData && initialMappings.length === 0) {
      return csvData.columns.map((column, index) => ({
        ontologyEntity: "",
        ontologyProperty: "",
        displayName: "",
        dataType: "string",
        required: false,
        sourceType: "csv" as SourceType,
        csvColumn: column,
        isMapped: false,
        sampleValues: getSampleData(csvData, column),
      }));
    }
    return initialMappings;
  });

  React.useEffect(() => {
    onChange?.(mappings);
  }, [mappings, onChange]);

  const updateMapping = (
    index: number,
    updates: Partial<PropertyMapping>
  ) => {
    setMappings((prev) =>
      prev.map((row, idx) => {
        if (idx === index) {
          const updated = { ...row, ...updates };

          // Auto-update isMapped status
          updated.isMapped = !!(
            updated.ontologyEntity &&
            updated.ontologyProperty &&
            (updated.csvColumn || updated.fixedValue)
          );

          return updated;
        }
        return row;
      })
    );
  };

  const addRow = () => {
    const newRow: PropertyMapping = {
      ontologyEntity: "",
      ontologyProperty: "",
      displayName: "",
      dataType: "string",
      required: false,
      sourceType: "fixed",
      isMapped: false,
    };
    setMappings((prev) => [...prev, newRow]);
  };

  const removeRow = (index: number) => {
    setMappings((prev) => prev.filter((_, idx) => idx !== index));
  };

  const columns: ColumnDef<PropertyMapping>[] = [
    {
      id: "drag",
      header: () => null,
      cell: () => (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-grab text-muted-foreground"
        >
          <IconGripVertical className="h-3 w-3" />
        </Button>
      ),
    },
    {
      id: "source",
      header: "Source",
      cell: ({ row }) => (
        <div className="w-32">
          <Select
            value={row.original.sourceType}
            onValueChange={(value: SourceType) =>
              updateMapping(row.index, { sourceType: value })
            }
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV Column</SelectItem>
              <SelectItem value="fixed">Fixed Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      id: "sourceValue",
      header: "Source Value / Preview",
      cell: ({ row }) => {
        const mapping = row.original;

        if (mapping.sourceType === "csv") {
          return (
            <div className="space-y-1">
              <Select
                value={mapping.csvColumn || ""}
                onValueChange={(value) =>
                  updateMapping(row.index, { csvColumn: value })
                }
              >
                <SelectTrigger size="sm" className="w-48">
                  <SelectValue placeholder="Select CSV column" />
                </SelectTrigger>
                <SelectContent>
                  {csvData?.columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapping.sampleValues && (
                <p className="text-xs text-muted-foreground">
                  {formatSampleData(mapping.sampleValues)}
                </p>
              )}
            </div>
          );
        }

        return (
          <Input
            placeholder="Enter fixed value"
            value={mapping.fixedValue || ""}
            onChange={(e) =>
              updateMapping(row.index, { fixedValue: e.target.value })
            }
            className="h-8 w-48"
          />
        );
      },
    },
    {
      id: "ontology",
      header: "Map to Ontology",
      cell: ({ row }) => {
        const mapping = row.original;
        const entityNames = getEntityNames();

        return (
          <div className="flex gap-2">
            <Select
              value={mapping.ontologyEntity}
              onValueChange={(value) =>
                updateMapping(row.index, {
                  ontologyEntity: value,
                  ontologyProperty: "", // Reset property when entity changes
                })
              }
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {entityNames.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={mapping.ontologyProperty}
              onValueChange={(value) =>
                updateMapping(row.index, { ontologyProperty: value })
              }
              disabled={!mapping.ontologyEntity}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {mapping.ontologyEntity &&
                  getEntityProperties(mapping.ontologyEntity).map((prop) => (
                    <SelectItem key={prop.key} value={prop.key}>
                      {prop.displayName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const mapping = row.original;

        // Check if mapping is complete
        const isMapped = mapping.isMapped &&
          mapping.ontologyEntity &&
          mapping.ontologyProperty &&
          (mapping.csvColumn || mapping.fixedValue);

        if (isMapped) {
          return (
            <Badge variant="outline" className="gap-1">
              <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />
              Mapped
            </Badge>
          );
        }

        // Check for partial mapping (started but not complete)
        const isPartial = mapping.ontologyEntity || mapping.ontologyProperty || mapping.csvColumn || mapping.fixedValue;

        if (isPartial) {
          return (
            <Badge variant="outline" className="gap-1 text-amber-600">
              <IconAlertTriangle className="h-3 w-3" />
              Incomplete
            </Badge>
          );
        }

        return (
          <Badge variant="outline" className="text-muted-foreground">
            Unmapped
          </Badge>
        );
      },
    },
    {
      id: "configure",
      header: () => null,
      cell: ({ row }) => {
        const mapping = row.original;
        const [open, setOpen] = React.useState(false);

        // Only show configure button if field is mapped and not a fixed value
        const canConfigure =
          mapping.isMapped &&
          mapping.sourceType === "csv" &&
          mapping.ontologyEntity &&
          mapping.ontologyProperty;

        if (!canConfigure) {
          return null;
        }

        const handleSave = (updates: {
          transformations?: FieldTransformation[];
          businessRule?: any;
        }) => {
          updateMapping(row.index, updates);
          setOpen(false);
        };

        const hasConfig =
          (mapping.transformations && mapping.transformations.length > 0) ||
          mapping.businessRule;

        // Reconstruct sample data rows from all mappings
        const sampleRows = React.useMemo(
          () => reconstructSampleRows(mappings),
          [mappings]
        );

        return (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <IconSettings className="h-4 w-4" />
                {hasConfig && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {mapping.businessRule ? "Rule" : ""}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <FieldConfigPanel
                mapping={mapping}
                allMappings={mappings}
                sampleData={sampleRows}
                onSave={handleSave}
                onCancel={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
        );
      },
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeRow(row.index)}
          className="text-muted-foreground hover:text-destructive"
        >
          Remove
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: mappings,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Desktop: Full Table with horizontal scroll */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {csvData
                    ? "Upload a CSV file to start mapping"
                    : "No mappings yet. Add a row to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden space-y-3">
        {mappings.length > 0 ? (
          mappings.map((mapping, index) => (
            <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
              {/* Source Type */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Source</div>
                <Select
                  value={mapping.sourceType}
                  onValueChange={(value: SourceType) =>
                    updateMapping(index, { sourceType: value })
                  }
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV Column</SelectItem>
                    <SelectItem value="fixed">Fixed Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Value */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {mapping.sourceType === "csv" ? "CSV Column" : "Fixed Value"}
                </div>
                {mapping.sourceType === "csv" ? (
                  <div className="space-y-1">
                    <Select
                      value={mapping.csvColumn || ""}
                      onValueChange={(value) =>
                        updateMapping(index, { csvColumn: value })
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Select CSV column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvData?.columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mapping.sampleValues && (
                      <p className="text-xs text-muted-foreground truncate">
                        {formatSampleData(mapping.sampleValues)}
                      </p>
                    )}
                  </div>
                ) : (
                  <Input
                    placeholder="Enter fixed value"
                    value={mapping.fixedValue || ""}
                    onChange={(e) =>
                      updateMapping(index, { fixedValue: e.target.value })
                    }
                    className="h-9"
                  />
                )}
              </div>

              {/* Ontology Mapping */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Map to Ontology</div>
                <div className="flex gap-2">
                  <Select
                    value={mapping.ontologyEntity}
                    onValueChange={(value) =>
                      updateMapping(index, {
                        ontologyEntity: value,
                        ontologyProperty: "",
                      })
                    }
                  >
                    <SelectTrigger size="sm" className="flex-1">
                      <SelectValue placeholder="Entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEntityNames().map((entity) => (
                        <SelectItem key={entity} value={entity}>
                          {entity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={mapping.ontologyProperty}
                    onValueChange={(value) =>
                      updateMapping(index, { ontologyProperty: value })
                    }
                    disabled={!mapping.ontologyEntity}
                  >
                    <SelectTrigger size="sm" className="flex-1">
                      <SelectValue placeholder="Property" />
                    </SelectTrigger>
                    <SelectContent>
                      {mapping.ontologyEntity &&
                        getEntityProperties(mapping.ontologyEntity).map((prop) => (
                          <SelectItem key={prop.key} value={prop.key}>
                            {prop.displayName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  {mapping.isMapped &&
                  mapping.ontologyEntity &&
                  mapping.ontologyProperty &&
                  (mapping.csvColumn || mapping.fixedValue) ? (
                    <Badge variant="outline" className="gap-1">
                      <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />
                      Mapped
                    </Badge>
                  ) : mapping.ontologyEntity ||
                    mapping.ontologyProperty ||
                    mapping.csvColumn ||
                    mapping.fixedValue ? (
                    <Badge variant="outline" className="gap-1 text-amber-600">
                      <IconAlertTriangle className="h-3 w-3" />
                      Incomplete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Unmapped
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {mapping.isMapped &&
                    mapping.sourceType === "csv" &&
                    mapping.ontologyEntity &&
                    mapping.ontologyProperty && (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8">
                            <IconSettings className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md">
                          <FieldConfigPanel
                            mapping={mapping}
                            allMappings={mappings}
                            sampleData={reconstructSampleRows(mappings)}
                            onSave={(updates) => {
                              updateMapping(index, updates);
                            }}
                            onCancel={() => {}}
                          />
                        </SheetContent>
                      </Sheet>
                    )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    className="h-8 text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            {csvData
              ? "Upload a CSV file to start mapping"
              : "No mappings yet. Add a row to get started."}
          </div>
        )}
      </div>

      <Button onClick={addRow} variant="outline" className="w-full md:w-auto">
        Add Row
      </Button>
    </div>
  );
}
