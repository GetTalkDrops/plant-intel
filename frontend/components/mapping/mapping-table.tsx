"use client";

/**
 * Mapping Table Component
 * Interactive table for mapping CSV columns to ontology
 */

import { MappingRow, CSVUpload } from "@/types/mapping";
import { getFlatOntologyOptions } from "@/lib/ontology-schema";
import { getSampleData, formatSampleData, detectDataType } from "@/lib/csv-utils";
import { updateMappingStatus } from "@/lib/mapping-validation";

interface MappingTableProps {
  csvData: CSVUpload;
  mappings: MappingRow[];
  onMappingsChange: (mappings: MappingRow[]) => void;
}

export function MappingTable({
  csvData,
  mappings,
  onMappingsChange,
}: MappingTableProps) {
  const ontologyOptions = getFlatOntologyOptions();

  const updateMapping = (id: string, updates: Partial<MappingRow>) => {
    const updated = mappings.map((m) =>
      m.id === id ? updateMappingStatus({ ...m, ...updates }) : m
    );
    onMappingsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
              <th className="px-4 py-3 text-left text-sm font-medium">CSV Column</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Ontology Path</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Data Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Sample Data</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mappings.map((mapping) => {
              const samples = mapping.sourceColumn
                ? getSampleData(csvData, mapping.sourceColumn)
                : [];

              return (
                <tr key={mapping.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <select
                      value={mapping.sourceType}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          sourceType: e.target.value as "csv" | "fixed",
                        })
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="csv">CSV</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    {mapping.sourceType === "csv" ? (
                      <select
                        value={mapping.sourceColumn || ""}
                        onChange={(e) =>
                          updateMapping(mapping.id, {
                            sourceColumn: e.target.value,
                            dataType: detectDataType(
                              getSampleData(csvData, e.target.value)
                            ),
                          })
                        }
                        className="border rounded px-2 py-1 text-sm w-full"
                      >
                        <option value="">Select column...</option>
                        {csvData.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={mapping.fixedValue || ""}
                        onChange={(e) =>
                          updateMapping(mapping.id, { fixedValue: e.target.value })
                        }
                        placeholder="Enter fixed value..."
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={`${mapping.ontologyEntity}.${mapping.ontologyProperty}`}
                      onChange={(e) => {
                        const [entity, property] = e.target.value.split(".");
                        updateMapping(mapping.id, {
                          ontologyEntity: entity,
                          ontologyProperty: property,
                        });
                      }}
                      className="border rounded px-2 py-1 text-sm w-full"
                    >
                      <option value=".">Select ontology...</option>
                      {ontologyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{mapping.dataType}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatSampleData(samples)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`
                      inline-block px-2 py-1 rounded text-xs font-medium
                      ${
                        mapping.status === "mapped"
                          ? "bg-green-100 text-green-800"
                          : mapping.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    `}
                    >
                      {mapping.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>{mappings.length} mappings total</span>
        <span>
          {mappings.filter((m) => m.status === "mapped").length} mapped
        </span>
      </div>
    </div>
  );
}
