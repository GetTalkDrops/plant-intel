// lib/ingestion/granularity-detector.ts

import { GranularityAnalysis, DataGranularity } from "@/types/mapping";

export function detectDataGranularity(
  columns: string[],
  sampleData: Record<string, any>[]
): GranularityAnalysis {
  // Find work order column
  const woColumn = columns.find((col) =>
    col
      .toLowerCase()
      .match(/^(wo|work.?order|job|order|production).*(number|id|no|num)/i)
  );

  if (!woColumn) {
    return {
      granularity: "header",
      confidence: 0.3,
      reasoning: "No work order identifier found - assuming header level",
      hasMultipleRowsPerWO: false,
      rowsPerWO: 1,
      groupingFields: [],
      aggregationNeeded: false,
    };
  }

  // Count unique work orders vs total rows
  const workOrderCounts = new Map<string, number>();
  sampleData.forEach((row) => {
    const wo = String(row[woColumn] || "").trim();
    if (wo) {
      workOrderCounts.set(wo, (workOrderCounts.get(wo) || 0) + 1);
    }
  });

  const uniqueWorkOrders = workOrderCounts.size;
  const totalRows = sampleData.length;
  const avgRowsPerWO = totalRows / uniqueWorkOrders;

  const hasMultipleRowsPerWO = avgRowsPerWO > 1.1; // Allow small variance

  if (!hasMultipleRowsPerWO) {
    return {
      granularity: "header",
      confidence: 0.95,
      reasoning:
        "Each work order appears once - this is aggregated header-level data",
      hasMultipleRowsPerWO: false,
      rowsPerWO: 1,
      groupingFields: [woColumn],
      aggregationNeeded: false,
    };
  }

  // Get example work order
  const exampleWO = Array.from(workOrderCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const exampleRows = sampleData.filter(
    (row) => row[woColumn] === exampleWO[0]
  );

  // Look for operation indicators
  const operationColumn = columns.find((col) =>
    col.toLowerCase().match(/(operation|step|phase|process|routing|seq)/i)
  );

  // Look for line item indicators
  const lineItemColumn = columns.find((col) =>
    col.toLowerCase().match(/(line|item|position|detail)/i)
  );

  // Look for material/part columns
  const materialColumn = columns.find((col) =>
    col.toLowerCase().match(/(material|part|item|sku|component)/i)
  );

  // Check if operations/materials vary within work order
  let granularity: DataGranularity;
  let confidence: number;
  let reasoning: string;
  let groupingFields: string[] = [woColumn];

  if (operationColumn && lineItemColumn) {
    // Both operation and line item = line item level
    granularity = "line_item";
    confidence = 0.9;
    reasoning = `Multiple rows per work order with operation (${operationColumn}) and line item (${lineItemColumn}) columns`;
    groupingFields = [woColumn, operationColumn, lineItemColumn];
  } else if (operationColumn) {
    // Has operations = operation level
    granularity = "operation";
    confidence = 0.85;
    reasoning = `Multiple rows per work order with operation column (${operationColumn})`;
    groupingFields = [woColumn, operationColumn];

    // Check if operations actually vary
    const uniqueOperations = new Set(
      exampleRows.map((row) => row[operationColumn])
    );
    if (uniqueOperations.size === 1) {
      // Operations don't vary - might be materials instead
      if (materialColumn) {
        reasoning += ` - appears to be multiple materials per operation`;
      }
    }
  } else if (materialColumn) {
    // Has materials varying = operation level (material-based)
    const uniqueMaterials = new Set(
      exampleRows.map((row) => row[materialColumn])
    );
    if (uniqueMaterials.size > 1) {
      granularity = "operation";
      confidence = 0.8;
      reasoning = `Multiple rows per work order with varying materials (${materialColumn})`;
      groupingFields = [woColumn, materialColumn];
    } else {
      granularity = "operation";
      confidence = 0.6;
      reasoning = "Multiple rows per work order but structure unclear";
      groupingFields = [woColumn];
    }
  } else {
    // Can't determine clear structure
    granularity = "operation";
    confidence = 0.5;
    reasoning =
      "Multiple rows per work order but no clear operation or material columns";
    groupingFields = [woColumn];
  }

  // Extract example details
  const exampleOperations = operationColumn
    ? Array.from(
        new Set(exampleRows.map((row) => row[operationColumn]))
      ).filter(Boolean)
    : undefined;

  const exampleMaterials = materialColumn
    ? Array.from(new Set(exampleRows.map((row) => row[materialColumn])))
        .filter(Boolean)
        .slice(0, 3)
    : undefined;

  return {
    granularity,
    confidence,
    reasoning,
    hasMultipleRowsPerWO: true,
    rowsPerWO: Math.round(avgRowsPerWO),
    groupingFields,
    aggregationNeeded: true,
    exampleWorkOrder: {
      number: exampleWO[0],
      rowCount: exampleWO[1],
      operations: exampleOperations,
      materials: exampleMaterials,
    },
  };
}
