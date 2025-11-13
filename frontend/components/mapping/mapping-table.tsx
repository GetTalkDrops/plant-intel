"use client";

import * as React from "react";
import {
  IconCircleCheckFilled,
  IconAlertTriangle,
  IconGripVertical,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MappingRow, CSVUpload, SourceType } from "@/types/mapping";
import {
  getFlatOntologyOptions,
  getEntityNames,
  getEntityProperties,
} from "@/lib/ontology-schema";
import { formatSampleData, getSampleData } from "@/lib/csv-utils";
import { validateMappingRow } from "@/lib/mapping-validation";

interface MappingTableProps {
  csvData?: CSVUpload;
  initialMappings?: MappingRow[];
  onChange?: (mappings: MappingRow[]) => void;
}

export function MappingTable({
  csvData,
  initialMappings = [],
  onChange,
}: MappingTableProps) {
  const [mappings, setMappings] = React.useState<MappingRow[]>(() => {
    // If CSV data is provided and no initial mappings, create rows from CSV columns
    if (csvData && initialMappings.length === 0) {
      return csvData.columns.map((column, index) => ({
        id: `mapping-${index}`,
        sourceType: "csv" as SourceType,
        csvColumn: column,
        sampleData: getSampleData(csvData, column),
        ontologyEntity: "",
        ontologyProperty: "",
        status: "unmapped" as const,
      }));
    }
    return initialMappings;
  });

  React.useEffect(() => {
    onChange?.(mappings);
  }, [mappings, onChange]);

  const updateMapping = (
    id: string,
    updates: Partial<MappingRow>
  ) => {
    setMappings((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, ...updates };

          // Auto-update status based on validation
          const validation = validateMappingRow(updated);
          updated.status = validation.isValid ? "mapped" : "error";
          updated.validationMessage = validation.errors[0];

          return updated;
        }
        return row;
      })
    );
  };

  const addRow = () => {
    const newRow: MappingRow = {
      id: `mapping-${Date.now()}`,
      sourceType: "fixed",
      ontologyEntity: "",
      ontologyProperty: "",
      status: "unmapped",
    };
    setMappings((prev) => [...prev, newRow]);
  };

  const removeRow = (id: string) => {
    setMappings((prev) => prev.filter((row) => row.id !== id));
  };

  const columns: ColumnDef<MappingRow>[] = [
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
              updateMapping(row.original.id, { sourceType: value })
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
                  updateMapping(mapping.id, { csvColumn: value })
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
              {mapping.sampleData && (
                <p className="text-xs text-muted-foreground">
                  {formatSampleData(mapping.sampleData)}
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
              updateMapping(mapping.id, { fixedValue: e.target.value })
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
                updateMapping(mapping.id, {
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
                updateMapping(mapping.id, { ontologyProperty: value })
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
        const validation = validateMappingRow(mapping);

        if (validation.isValid) {
          return (
            <Badge variant="outline" className="gap-1">
              <IconCircleCheckFilled className="h-3 w-3 fill-green-500" />
              Mapped
            </Badge>
          );
        }

        if (validation.errors.length > 0) {
          return (
            <Badge variant="outline" className="gap-1 text-amber-600">
              <IconAlertTriangle className="h-3 w-3" />
              {validation.errors[0]}
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
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeRow(row.original.id)}
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
      <div className="rounded-lg border">
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

      <Button onClick={addRow} variant="outline">
        Add Row
      </Button>
    </div>
  );
}
