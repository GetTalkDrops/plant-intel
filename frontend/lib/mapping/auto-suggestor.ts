// lib/mapping/auto-suggester.ts

import { ONTOLOGY_SCHEMA } from "@/lib/ontology-schema";
import { FieldMapping, DataType } from "@/types/mapping";

function normalizeDataType(type: string): DataType {
  switch (type) {
    case "decimal":
    case "number":
      return "number";
    case "datetime":
    case "date":
      return "date";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

export function suggestMappings(
  columns: string[],
  sampleData: Record<string, any>[],
  targetLevel: "header" | "detail" = "header"
): Record<string, FieldMapping> {
  const suggestions: Record<string, FieldMapping> = {};

  // Get ontology fields for the target level
  const ontologyFields =
    targetLevel === "header" ? getHeaderFields() : getDetailFields();

  for (const [fieldName, fieldDef] of Object.entries(ontologyFields)) {
    const match = findBestMatch(fieldName, columns, sampleData, fieldDef);

    suggestions[fieldName] = {
      ontologyField: fieldName,
      sourceColumn: match.column,
      confidence: match.confidence,
      transformations: match.transformations,
      isRequired: fieldDef.required || false,
      isMapped: match.column !== null,
      dataType: normalizeDataType(fieldDef.type),
      sampleValues: match.column
        ? sampleData.slice(0, 3).map((row) => row[match.column!])
        : [],
    };
  }

  return suggestions;
}

function findBestMatch(
  ontologyField: string,
  columns: string[],
  sampleData: Record<string, any>[],
  fieldDef: any
): {
  column: string | null;
  confidence: "high" | "medium" | "low";
  transformations: string[];
} {
  const synonyms = getSynonyms(ontologyField);
  let bestMatch: string | null = null;
  let bestScore = 0;
  let transformations: string[] = [];

  for (const column of columns) {
    const colClean = column.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Check exact matches
    for (const synonym of synonyms) {
      const synClean = synonym.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Exact match
      if (colClean === synClean) {
        bestMatch = column;
        bestScore = 1.0;
        break;
      }

      // Contains match
      if (colClean.includes(synClean) || synClean.includes(colClean)) {
        const score =
          Math.max(
            synClean.length / colClean.length,
            colClean.length / synClean.length
          ) * 0.9;
        if (score > bestScore) {
          bestMatch = column;
          bestScore = score;
        }
      }

      // Fuzzy match (simple Levenshtein-ish)
      const distance = levenshteinDistance(colClean, synClean);
      const maxLen = Math.max(colClean.length, synClean.length);
      const similarity = 1 - distance / maxLen;

      if (similarity > 0.7 && similarity > bestScore) {
        bestMatch = column;
        bestScore = similarity;
      }
    }
  }

  // Validate with sample data
  if (bestMatch) {
    const validation = validateColumnType(bestMatch, sampleData, fieldDef.type);

    if (!validation.valid) {
      // Type mismatch - reduce confidence or discard
      if (bestScore > 0.8) {
        bestScore = 0.5; // Reduce to medium
      } else {
        bestMatch = null;
        bestScore = 0;
      }
    } else {
      transformations = validation.suggestedTransformations;
    }
  }

  let confidence: "high" | "medium" | "low";
  if (bestScore >= 0.8) confidence = "high";
  else if (bestScore >= 0.5) confidence = "medium";
  else confidence = "low";

  return {
    column: bestScore > 0.4 ? bestMatch : null,
    confidence,
    transformations,
  };
}

function getSynonyms(fieldName: string): string[] {
  const synonymMap: Record<string, string[]> = {
    work_order_number: [
      "wo",
      "workorder",
      "work_order",
      "job",
      "order_num",
      "wo_id",
      "job_number",
      "order_id",
      "production_order",
      "manufacturing_order",
    ],
    material_code: [
      "part",
      "material",
      "item",
      "sku",
      "part_num",
      "material_no",
      "part_number",
      "item_code",
      "component",
    ],
    supplier_id: ["supplier", "vendor", "vendor_id", "sup_id", "supplier_code"],
    machine_id: [
      "machine",
      "equipment",
      "asset",
      "workcenter",
      "resource",
      "equip_id",
      "machine_no",
    ],
    equipment_id: ["equipment", "asset", "machine", "device"],
    planned_material_cost: [
      "planned_mat",
      "budget_mat",
      "mat_planned",
      "material_budget",
      "est_material",
      "standard_material",
    ],
    actual_material_cost: [
      "actual_mat",
      "mat_actual",
      "material_actual",
      "mat_cost",
      "material_cost",
    ],
    planned_labor_hours: [
      "planned_hrs",
      "labor_planned",
      "hrs_planned",
      "budgeted_hours",
      "standard_hours",
      "est_hours",
    ],
    actual_labor_hours: [
      "actual_hrs",
      "labor_actual",
      "hrs_actual",
      "hours_worked",
      "labor_hours",
    ],
    operation_code: ["operation", "op_code", "step", "routing", "process"],
    operation_type: ["op_type", "operation", "step_type", "process_type"],
    units_produced: ["qty", "quantity", "produced", "output", "good_units"],
    units_scrapped: ["scrap", "scrapped", "rejected", "defects", "bad_units"],
    quality_issues: ["quality", "defect", "issue", "problem", "reject"],
    downtime_minutes: ["downtime", "stoppage", "delay", "idle_time"],
  };

  return [fieldName, ...(synonymMap[fieldName] || [])];
}

function validateColumnType(
  column: string,
  sampleData: Record<string, any>[],
  expectedType: string
): { valid: boolean; suggestedTransformations: string[] } {
  const values = sampleData
    .map((row) => row[column])
    .filter((v) => v != null && v !== "");
  const transformations: string[] = [];

  if (values.length === 0) {
    return { valid: false, suggestedTransformations: [] };
  }

  let validCount = 0;

  for (const value of values) {
    const strValue = String(value);

    switch (expectedType) {
      case "number":
      case "decimal":
        // Check if numeric after cleaning
        const cleaned = strValue.replace(/[$,€£¥]/g, "").trim();
        if (!isNaN(Number(cleaned))) {
          validCount++;
          if (strValue !== cleaned) {
            if (strValue.includes("$")) transformations.push("remove_currency");
            if (strValue.includes(",")) transformations.push("remove_commas");
          }
        }
        break;

      case "boolean":
        const lower = strValue.toLowerCase();
        if (
          ["true", "false", "yes", "no", "1", "0", "t", "f", "y", "n"].includes(
            lower
          )
        ) {
          validCount++;
          if (!["true", "false"].includes(lower)) {
            transformations.push("convert_to_boolean");
          }
        }
        break;

      case "date":
      case "datetime":
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          validCount++;
          if (strValue.match(/^\d{8}$/)) transformations.push("parse_yyyymmdd");
        }
        break;

      case "string":
        validCount++;
        break;
    }
  }

  const validRatio = validCount / values.length;

  return {
    valid: validRatio > 0.7,
    suggestedTransformations: Array.from(new Set(transformations)),
  };
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function getHeaderFields() {
  return {
    work_order_number: { type: "string", required: true },
    production_period_start: { type: "date", required: false },
    production_period_end: { type: "date", required: false },
    planned_material_cost: { type: "decimal", required: true },
    actual_material_cost: { type: "decimal", required: true },
    planned_labor_hours: { type: "decimal", required: true },
    actual_labor_hours: { type: "decimal", required: true },
  };
}

function getDetailFields() {
  return {
    operation_code: { type: "string", required: false },
    operation_type: { type: "string", required: false },
    machine_id: { type: "string", required: false },
    equipment_id: { type: "string", required: false },
    material_code: { type: "string", required: false },
    supplier_id: { type: "string", required: false },
    planned_material_cost: { type: "decimal", required: true },
    actual_material_cost: { type: "decimal", required: true },
    planned_labor_hours: { type: "decimal", required: true },
    actual_labor_hours: { type: "decimal", required: true },
    units_produced: { type: "number", required: false },
    units_scrapped: { type: "number", required: false },
    quality_issues: { type: "boolean", required: false },
    downtime_minutes: { type: "number", required: false },
  };
}
