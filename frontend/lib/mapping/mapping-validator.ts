// lib/mapping/mapping-validator.ts

import { MappingValidationIssue, FieldMapping } from "@/types/mapping";

export function validateMappings(
  mappings: Record<string, FieldMapping>,
  csvData: Record<string, any>[]
): MappingValidationIssue[] {
  const issues: MappingValidationIssue[] = [];

  // Check 1: All required fields mapped
  Object.entries(mappings).forEach(([field, mapping]) => {
    if (mapping.isRequired && !mapping.isMapped) {
      issues.push({
        severity: "error",
        field,
        message: `Required field "${field}" is not mapped`,
        suggestion: "Map this field or upload different data",
      });
    }
  });

  // Check 2: No duplicate mappings
  const sourceColumns = Object.values(mappings)
    .filter((m) => m.sourceColumn)
    .map((m) => m.sourceColumn);

  const duplicates = sourceColumns.filter(
    (col, idx) => sourceColumns.indexOf(col) !== idx
  );

  if (duplicates.length > 0) {
    issues.push({
      severity: "error",
      field: "multiple",
      message: `Column "${duplicates[0]}" is mapped to multiple ontology fields`,
      suggestion: "Each CSV column should map to only one ontology field",
    });
  }

  // Check 3: Logical consistency (planned vs actual)
  const plannedMat = mappings.planned_material_cost;
  const actualMat = mappings.actual_material_cost;

  if (
    plannedMat?.isMapped &&
    actualMat?.isMapped &&
    plannedMat.sourceColumn &&
    actualMat.sourceColumn
  ) {
    let swappedCount = 0;

    for (const row of csvData) {
      const planned = Number(row[plannedMat.sourceColumn]);
      const actual = Number(row[actualMat.sourceColumn]);

      if (!isNaN(planned) && !isNaN(actual) && actual < planned * 0.5) {
        swappedCount++;
      }
    }

    if (swappedCount > csvData.length * 0.7) {
      issues.push({
        severity: "warning",
        field: "planned_material_cost",
        message:
          '⚠️ "Actual" costs are consistently lower than "Planned" costs',
        affectedRows: swappedCount,
        suggestion: "You may have swapped Planned and Actual columns",
      });
    }
  }

  // Check 4: Unit consistency for labor hours
  const laborHours = mappings.actual_labor_hours;
  if (laborHours?.isMapped && laborHours.sourceColumn) {
    const values = csvData
      .map((row) => Number(row[laborHours.sourceColumn!]))
      .filter((v) => !isNaN(v));

    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      if (avg > 100) {
        issues.push({
          severity: "warning",
          field: "actual_labor_hours",
          message: `Average value is ${avg.toFixed(
            0
          )} - this might be in MINUTES, not hours`,
          suggestion: "Add unit conversion: minutes → hours (divide by 60)",
        });
      } else if (avg < 0.5) {
        issues.push({
          severity: "warning",
          field: "actual_labor_hours",
          message: `Average value is ${avg.toFixed(2)} hours - unusually low`,
          suggestion: "Verify this is the correct column and unit",
        });
      }
    }
  }

  // Check 5: Date format consistency
  const dateFields = Object.entries(mappings).filter(
    ([field]) => field.includes("date") || field.includes("period")
  );

  for (const [field, mapping] of dateFields) {
    if (mapping.isMapped && mapping.sourceColumn) {
      const dates = csvData
        .map((row) => row[mapping.sourceColumn!])
        .filter(Boolean)
        .slice(0, 20);

      const formats = new Set<string>();

      for (const dateStr of dates) {
        const str = String(dateStr);
        if (str.match(/^\d{8}$/)) formats.add("YYYYMMDD");
        else if (str.match(/^\d{4}-\d{2}-\d{2}$/)) formats.add("YYYY-MM-DD");
        else if (str.match(/^\d{2}\/\d{2}\/\d{4}$/)) formats.add("MM/DD/YYYY");
        else if (str.match(/^\d{2}\/\d{2}\/\d{2}$/)) formats.add("MM/DD/YY");
        else formats.add("unknown");
      }

      if (formats.size > 1) {
        issues.push({
          severity: "error",
          field,
          message: `Inconsistent date formats detected: ${Array.from(
            formats
          ).join(", ")}`,
          suggestion: "Dates must use consistent format throughout file",
        });
      }
    }
  }

  return issues;
}
