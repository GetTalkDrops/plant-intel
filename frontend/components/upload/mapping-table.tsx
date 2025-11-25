// components/upload/mapping-table.tsx

"use client";

import { FieldMapping } from "@/types/mapping";
import { FieldMapperRow } from "./field-mapper-row";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  headerMappings: Record<string, FieldMapping>;
  detailMappings: Record<string, FieldMapping> | null;
  csvColumns: string[];
  onMappingChange: (
    field: string,
    column: string | null,
    level: "header" | "detail"
  ) => void;
}

export function MappingTable({
  headerMappings,
  detailMappings,
  csvColumns,
  onMappingChange,
}: Props) {
  const requiredHeaderFields = Object.entries(headerMappings).filter(
    ([_, m]) => m.isRequired
  );
  const optionalHeaderFields = Object.entries(headerMappings).filter(
    ([_, m]) => !m.isRequired
  );

  const requiredDetailFields = detailMappings
    ? Object.entries(detailMappings).filter(([_, m]) => m.isRequired)
    : [];
  const optionalDetailFields = detailMappings
    ? Object.entries(detailMappings).filter(([_, m]) => !m.isRequired)
    : [];

  const renderMappingSection = (
    title: string,
    fields: [string, FieldMapping][],
    level: "header" | "detail"
  ) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>

      {/* Header Row */}
      <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b font-medium text-sm text-gray-600">
        <div className="col-span-3">Ontology Field</div>
        <div className="col-span-3">CSV Column</div>
        <div className="col-span-4">Sample Data</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {/* Mapping Rows */}
      <div className="space-y-2">
        {fields.map(([fieldName, mapping]) => (
          <FieldMapperRow
            key={fieldName}
            mapping={mapping}
            csvColumns={csvColumns}
            onColumnSelect={(column) =>
              onMappingChange(fieldName, column, level)
            }
          />
        ))}
      </div>
    </div>
  );

  if (!detailMappings) {
    // Header-level only
    return (
      <Card className="p-6">
        {renderMappingSection(
          "Required Fields",
          requiredHeaderFields,
          "header"
        )}
        {optionalHeaderFields.length > 0 && (
          <div className="mt-8">
            {renderMappingSection(
              "Optional Fields",
              optionalHeaderFields,
              "header"
            )}
          </div>
        )}
      </Card>
    );
  }

  // Has detail mappings - show tabs
  return (
    <Card className="p-6">
      <Tabs defaultValue="header">
        <TabsList>
          <TabsTrigger value="header">Work Order (Header)</TabsTrigger>
          <TabsTrigger value="detail">
            Operations/Materials (Detail)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-6 mt-6">
          {renderMappingSection(
            "Required Work Order Fields",
            requiredHeaderFields,
            "header"
          )}
          {optionalHeaderFields.length > 0 && (
            <div className="mt-8">
              {renderMappingSection(
                "Optional Work Order Fields",
                optionalHeaderFields,
                "header"
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="detail" className="space-y-6 mt-6">
          {renderMappingSection(
            "Required Detail Fields",
            requiredDetailFields,
            "detail"
          )}
          {optionalDetailFields.length > 0 && (
            <div className="mt-8">
              {renderMappingSection(
                "Optional Detail Fields",
                optionalDetailFields,
                "detail"
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
