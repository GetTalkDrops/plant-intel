/**
 * Validation Rules and Helpers for Mappings
 */

import { MappingRow, MappingTemplate } from "@/types/mapping";

/**
 * Validates a single mapping row
 */
export function validateMappingRow(row: MappingRow): {
  valid: boolean;
  error?: string;
} {
  // Check if mapping is complete
  if (!row.ontologyEntity || !row.ontologyProperty) {
    return { valid: false, error: "Ontology mapping required" };
  }

  // Check source
  if (row.sourceType === "csv" && !row.sourceColumn) {
    return { valid: false, error: "CSV column must be selected" };
  }

  if (row.sourceType === "fixed" && !row.fixedValue) {
    return { valid: false, error: "Fixed value required" };
  }

  return { valid: true };
}

/**
 * Validates entire mapping template
 */
export function validateMappingTemplate(template: MappingTemplate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check template name
  if (!template.name || template.name.trim() === "") {
    errors.push("Template name is required");
  }

  // Check if there are any mappings
  if (!template.mappings || template.mappings.length === 0) {
    errors.push("At least one mapping is required");
  }

  // Validate each mapping
  template.mappings.forEach((mapping, index) => {
    const result = validateMappingRow(mapping);
    if (!result.valid) {
      errors.push(`Row ${index + 1}: ${result.error}`);
    }
  });

  // Check for duplicate ontology paths
  const ontologyPaths = template.mappings
    .filter((m) => m.ontologyEntity && m.ontologyProperty)
    .map((m) => `${m.ontologyEntity}.${m.ontologyProperty}`);

  const duplicates = ontologyPaths.filter(
    (path, index) => ontologyPaths.indexOf(path) !== index
  );

  if (duplicates.length > 0) {
    errors.push(`Duplicate ontology mappings: ${duplicates.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Quick check if mapping is complete
 */
export function isMappingComplete(row: MappingRow): boolean {
  if (!row.ontologyEntity || !row.ontologyProperty) return false;

  if (row.sourceType === "csv" && !row.sourceColumn) return false;
  if (row.sourceType === "fixed" && !row.fixedValue) return false;

  return true;
}

/**
 * Updates mapping row status based on validation
 */
export function updateMappingStatus(row: MappingRow): MappingRow {
  const validation = validateMappingRow(row);

  return {
    ...row,
    status: validation.valid ? "mapped" : "unmapped",
    validationError: validation.error,
  };
}
