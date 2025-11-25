// Utility to reconstruct CSV sample rows from PropertyMapping array

import { PropertyMapping } from "@/types/mapping";

/**
 * Reconstruct sample data rows from property mappings
 * Each mapping has sampleValues, we combine them back into row objects
 */
export function reconstructSampleRows(
  mappings: PropertyMapping[]
): Record<string, any>[] {
  // Find the maximum number of sample values across all mappings
  const maxSamples = Math.max(
    ...mappings.map((m) => m.sampleValues?.length || 0),
    0
  );

  if (maxSamples === 0) {
    return [];
  }

  // Build rows by combining sample values at each index
  const rows: Record<string, any>[] = [];

  for (let i = 0; i < maxSamples; i++) {
    const row: Record<string, any> = {};

    for (const mapping of mappings) {
      if (mapping.csvColumn && mapping.sampleValues && mapping.sampleValues[i] !== undefined) {
        row[mapping.csvColumn] = mapping.sampleValues[i];
      }
    }

    // Only add row if it has at least one value
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }

  return rows;
}
