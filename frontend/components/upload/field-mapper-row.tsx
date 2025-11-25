// components/upload/field-mapper-row.tsx

"use client";

import { FieldMapping } from "@/types/mapping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, HelpCircle } from "lucide-react";

interface Props {
  mapping: FieldMapping;
  csvColumns: string[];
  onColumnSelect: (column: string | null) => void;
}

export function FieldMapperRow({ mapping, csvColumns, onColumnSelect }: Props) {
  const getConfidenceBadge = () => {
    if (!mapping.isMapped) {
      return mapping.isRequired ? (
        <Badge variant="destructive" className="text-xs">
          Required
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-xs">
          Optional
        </Badge>
      );
    }

    switch (mapping.confidence) {
      case "high":
        return (
          <Badge variant="default" className="text-xs bg-green-600">
            High Confidence
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="default" className="text-xs bg-yellow-600">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="default" className="text-xs bg-orange-600">
            Low - Please Review
          </Badge>
        );
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div
      className={`grid grid-cols-12 gap-4 items-start p-4 border rounded ${
        mapping.isRequired && !mapping.isMapped
          ? "bg-red-50 border-red-200"
          : "bg-white"
      }`}
    >
      {/* Ontology Field Name */}
      <div className="col-span-3">
        <div className="font-medium text-sm flex items-center gap-2">
          {formatFieldName(mapping.ontologyField)}
          {mapping.isRequired && <span className="text-red-600">*</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Type: {mapping.dataType}
        </div>
      </div>

      {/* CSV Column Selector */}
      <div className="col-span-3">
        <Select
          value={mapping.sourceColumn || "unmapped"}
          onValueChange={(value) =>
            onColumnSelect(value === "unmapped" ? null : value)
          }
        >
          <SelectTrigger
            className={
              mapping.isRequired && !mapping.isMapped ? "border-red-300" : ""
            }
          >
            <SelectValue placeholder="Select CSV column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unmapped">
              <span className="text-gray-500">-- Not Mapped --</span>
            </SelectItem>
            {csvColumns.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sample Data Preview */}
      <div className="col-span-4">
        {mapping.sampleValues.length > 0 ? (
          <div className="text-xs font-mono text-gray-600 space-y-0.5">
            {mapping.sampleValues.slice(0, 3).map((val, idx) => (
              <div key={idx} className="truncate">
                {String(val)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No data preview</div>
        )}
      </div>

      {/* Status Badge */}
      <div className="col-span-2 flex items-center justify-end gap-2">
        {getConfidenceBadge()}
        {mapping.isMapped && mapping.confidence === "high" && (
          <Check className="text-green-600" size={16} />
        )}
        {mapping.isRequired && !mapping.isMapped && (
          <AlertCircle className="text-red-600" size={16} />
        )}
        {mapping.transformations.length > 0 && (
          <HelpCircle
            className="text-blue-600 cursor-help"
            size={16}
            title={`Transformations: ${mapping.transformations.join(", ")}`}
          />
        )}
      </div>
    </div>
  );
}
