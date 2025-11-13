import { MappingRow, MappingTemplate } from "@/types/mapping";
import { ONTOLOGY_SCHEMA } from "./ontology-schema";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single mapping row
 */
export function validateMappingRow(row: MappingRow): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if ontology entity and property are selected
  if (!row.ontologyEntity || !row.ontologyProperty) {
    errors.push("Ontology mapping is required");
  }

  // Validate based on source type
  if (row.sourceType === "csv") {
    if (!row.csvColumn) {
      errors.push("CSV column must be selected for CSV source type");
    }
  } else if (row.sourceType === "fixed") {
    if (!row.fixedValue && row.fixedValue !== "0") {
      errors.push("Fixed value is required for fixed source type");
    }
  }

  // Check if the ontology entity exists
  const entity = ONTOLOGY_SCHEMA.find((e) => e.name === row.ontologyEntity);
  if (!entity) {
    errors.push(`Unknown ontology entity: ${row.ontologyEntity}`);
  } else {
    // Check if the property exists on the entity
    const property = entity.properties.find((p) => p.key === row.ontologyProperty);
    if (!property) {
      errors.push(`Unknown property ${row.ontologyProperty} on entity ${row.ontologyEntity}`);
    } else {
      // Check if required property is mapped
      if (property.required && row.status !== "mapped") {
        warnings.push(`${property.displayName} is a required property`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate entire mapping template
 */
export function validateMappingTemplate(template: MappingTemplate): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if template has a name
  if (!template.name || template.name.trim() === "") {
    errors.push("Mapping template must have a name");
  }

  // Check if there are any mappings
  if (template.mappings.length === 0) {
    errors.push("Mapping template must have at least one mapping");
  }

  // Validate each mapping row
  template.mappings.forEach((row, index) => {
    const rowValidation = validateMappingRow(row);

    rowValidation.errors.forEach((error) => {
      errors.push(`Row ${index + 1}: ${error}`);
    });

    rowValidation.warnings.forEach((warning) => {
      warnings.push(`Row ${index + 1}: ${warning}`);
    });
  });

  // Check for duplicate ontology mappings
  const ontologyMappings = template.mappings.map(
    (row) => `${row.ontologyEntity}.${row.ontologyProperty}`
  );
  const duplicates = ontologyMappings.filter(
    (item, index) => ontologyMappings.indexOf(item) !== index
  );

  if (duplicates.length > 0) {
    warnings.push(`Duplicate mappings found: ${[...new Set(duplicates)].join(", ")}`);
  }

  // Check if required properties are mapped
  ONTOLOGY_SCHEMA.forEach((entity) => {
    const requiredProps = entity.properties.filter((p) => p.required);
    const mappedProps = template.mappings
      .filter((row) => row.ontologyEntity === entity.name)
      .map((row) => row.ontologyProperty);

    requiredProps.forEach((prop) => {
      if (!mappedProps.includes(prop.key)) {
        warnings.push(
          `Required property ${entity.name}.${prop.displayName} is not mapped`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a mapping is complete
 */
export function isMappingComplete(row: MappingRow): boolean {
  if (!row.ontologyEntity || !row.ontologyProperty) {
    return false;
  }

  if (row.sourceType === "csv" && !row.csvColumn) {
    return false;
  }

  if (row.sourceType === "fixed" && !row.fixedValue && row.fixedValue !== "0") {
    return false;
  }

  return true;
}
