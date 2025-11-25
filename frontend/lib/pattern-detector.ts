// Pattern Detection for Auto-Suggesting Business Rules
// Analyzes sample data to detect patterns and suggest appropriate rules

import {
  BusinessRule,
  LookupRuleConfig,
  ConditionalRuleConfig,
} from "@/types/mapping";

export interface PatternSuggestion {
  type: "lookup" | "conditional";
  confidence: number; // 0-1 score
  reason: string;
  suggestedRule: BusinessRule;
  fieldAnalysis: string; // Description of what was detected
}

interface FieldAnalysis {
  uniqueValues: Set<any>;
  uniqueCount: number;
  totalCount: number;
  dataType: "string" | "number" | "date" | "time" | "boolean" | "mixed";
  patterns: {
    hasTimePattern: boolean;
    hasMachineIdPattern: boolean;
    hasMaterialCodePattern: boolean;
    hasDepartmentPattern: boolean;
    hasNumericRange: boolean;
  };
}

/**
 * Analyze a field's sample data to detect its characteristics
 */
function analyzeField(
  fieldName: string,
  sampleValues: any[]
): FieldAnalysis {
  const uniqueValues = new Set(sampleValues.filter((v) => v != null));
  const uniqueCount = uniqueValues.size;
  const totalCount = sampleValues.length;

  // Detect data type
  let dataType: FieldAnalysis["dataType"] = "string";
  const types = new Set(
    sampleValues
      .filter((v) => v != null)
      .map((v) => {
        const val = String(v).trim();
        if (!isNaN(Number(val)) && val !== "") return "number";
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) return "time";
        if (/^\d{4}-\d{2}-\d{2}/.test(val)) return "date";
        if (val === "true" || val === "false") return "boolean";
        return "string";
      })
  );

  if (types.size === 1) {
    dataType = Array.from(types)[0] as FieldAnalysis["dataType"];
  } else if (types.size > 1) {
    dataType = "mixed";
  }

  // Detect patterns
  const sampleStrings = sampleValues
    .filter((v) => v != null)
    .map((v) => String(v).trim());

  const hasTimePattern = sampleStrings.some((v) =>
    /^\d{1,2}:\d{2}/.test(v)
  );

  const hasMachineIdPattern = sampleStrings.some(
    (v) =>
      /^(MACHINE|MACH|MCH|M)-?[A-Z0-9]+$/i.test(v) ||
      /^[A-Z]+-\d+$/.test(v)
  );

  const hasMaterialCodePattern = sampleStrings.some(
    (v) =>
      /^(PREM|STD|ECON|MAT|MATL)-?[A-Z0-9]+$/i.test(v) ||
      /^[A-Z]{3,4}-\d+$/.test(v)
  );

  const hasDepartmentPattern = sampleStrings.some(
    (v) =>
      /^(PROD|ASSY|QC|SHIP|MFG|ENG|MAINT)$/i.test(v) ||
      fieldName.toLowerCase().includes("dept")
  );

  const hasNumericRange =
    dataType === "number" &&
    sampleValues.filter((v) => !isNaN(Number(v))).length > 0;

  return {
    uniqueValues,
    uniqueCount,
    totalCount,
    dataType,
    patterns: {
      hasTimePattern,
      hasMachineIdPattern,
      hasMaterialCodePattern,
      hasDepartmentPattern,
      hasNumericRange,
    },
  };
}

/**
 * Detect if field is a good candidate for lookup table
 * Low cardinality + structured values = good lookup candidate
 */
function detectLookupPattern(
  sourceFieldName: string,
  sourceAnalysis: FieldAnalysis,
  sampleData: Record<string, any>[]
): PatternSuggestion | null {
  const { uniqueCount, totalCount, patterns } = sourceAnalysis;

  // Good lookup candidate: 2-20 unique values, structured pattern
  const cardinalityRatio = uniqueCount / totalCount;
  const hasStructuredPattern =
    patterns.hasMachineIdPattern ||
    patterns.hasMaterialCodePattern ||
    patterns.hasDepartmentPattern;

  if (uniqueCount < 2 || uniqueCount > 20) {
    return null; // Too few or too many unique values
  }

  if (cardinalityRatio > 0.8) {
    return null; // Too unique (almost 1:1), not a good lookup
  }

  // Build a suggested lookup table from sample data
  const lookupTable: Record<string, any> = {};
  const valueFrequency: Record<string, number> = {};

  // Count frequency of each value
  sampleData.forEach((row) => {
    const val = row[sourceFieldName];
    if (val != null) {
      const key = String(val);
      valueFrequency[key] = (valueFrequency[key] || 0) + 1;
    }
  });

  // Get most common values (up to 10)
  const topValues = Object.entries(valueFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([key]) => key);

  // Create example lookup entries
  topValues.forEach((key, idx) => {
    // Generate example values based on pattern
    if (patterns.hasMachineIdPattern) {
      lookupTable[key] = String((2.0 + idx * 0.5).toFixed(1)); // Scrap rates
    } else if (patterns.hasMaterialCodePattern) {
      lookupTable[key] = String((100.0 + idx * 25.0).toFixed(2)); // Material costs
    } else if (patterns.hasDepartmentPattern) {
      lookupTable[key] = String((30.0 + idx * 5.0).toFixed(2)); // Overhead rates
    } else {
      lookupTable[key] = ""; // Let user fill in
    }
  });

  let reason = `Found ${uniqueCount} unique values in "${sourceFieldName}"`;
  if (hasStructuredPattern) {
    if (patterns.hasMachineIdPattern) {
      reason += ". Detected machine ID pattern - suggest machine-specific rates.";
    } else if (patterns.hasMaterialCodePattern) {
      reason += ". Detected material code pattern - suggest material costs.";
    } else if (patterns.hasDepartmentPattern) {
      reason += ". Detected department codes - suggest department rates.";
    }
  } else {
    reason += ". Low cardinality makes this a good lookup candidate.";
  }

  const confidence = hasStructuredPattern ? 0.85 : 0.65;

  return {
    type: "lookup",
    confidence,
    reason,
    fieldAnalysis: reason,
    suggestedRule: {
      type: "lookup",
      config: {
        sourceField: sourceFieldName,
        lookupTable,
        defaultValue: "",
      } as LookupRuleConfig,
    },
  };
}

/**
 * Detect if field is a good candidate for conditional rules
 * Time patterns, numeric thresholds = good conditional candidate
 */
function detectConditionalPattern(
  fieldName: string,
  fieldAnalysis: FieldAnalysis,
  sampleData: Record<string, any>[]
): PatternSuggestion | null {
  const { patterns, dataType } = fieldAnalysis;

  // Time-based conditional (shift premium)
  if (patterns.hasTimePattern) {
    return {
      type: "conditional",
      confidence: 0.9,
      reason: `Detected time values in "${fieldName}". Suggest shift-based premium rates.`,
      fieldAnalysis: `Time field detected - good candidate for shift premiums or time-based multipliers`,
      suggestedRule: {
        type: "conditional",
        config: {
          conditions: [
            {
              field: fieldName,
              operator: "greaterThanOrEqual",
              value: "18:00",
              result: "1.5",
              label: "Night shift premium (6pm-6am)",
            },
            {
              field: fieldName,
              operator: "lessThan",
              value: "06:00",
              result: "1.5",
              label: "Night shift premium (6pm-6am)",
            },
          ],
          defaultValue: "1.0",
        } as ConditionalRuleConfig,
      },
    };
  }

  // Numeric threshold conditional (overtime, quantity breaks)
  if (patterns.hasNumericRange) {
    const numericValues = sampleData
      .map((row) => Number(row[fieldName]))
      .filter((v) => !isNaN(v));

    const max = Math.max(...numericValues);
    const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

    // Suggest threshold at average
    const threshold = Math.round(avg);

    return {
      type: "conditional",
      confidence: 0.7,
      reason: `Detected numeric range in "${fieldName}". Suggest threshold-based multiplier.`,
      fieldAnalysis: `Numeric field with values 0-${Math.round(max)} - good candidate for threshold rules`,
      suggestedRule: {
        type: "conditional",
        config: {
          conditions: [
            {
              field: fieldName,
              operator: "greaterThan",
              value: String(threshold),
              result: "1.5",
              label: `Premium rate (>${threshold})`,
            },
          ],
          defaultValue: "1.0",
        } as ConditionalRuleConfig,
      },
    };
  }

  return null;
}

/**
 * Analyze sample data and suggest business rules
 * Returns suggestions sorted by confidence
 */
export function suggestBusinessRules(
  targetFieldName: string,
  availableFields: string[],
  sampleData: Record<string, any>[]
): PatternSuggestion[] {
  if (!sampleData || sampleData.length === 0) {
    return [];
  }

  const suggestions: PatternSuggestion[] = [];

  // Analyze each available field for patterns
  availableFields.forEach((fieldName) => {
    const sampleValues = sampleData.map((row) => row[fieldName]);
    const analysis = analyzeField(fieldName, sampleValues);

    // Try to detect lookup pattern
    const lookupSuggestion = detectLookupPattern(
      fieldName,
      analysis,
      sampleData
    );
    if (lookupSuggestion) {
      suggestions.push(lookupSuggestion);
    }

    // Try to detect conditional pattern
    const conditionalSuggestion = detectConditionalPattern(
      fieldName,
      analysis,
      sampleData
    );
    if (conditionalSuggestion) {
      suggestions.push(conditionalSuggestion);
    }
  });

  // Sort by confidence (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get the best (highest confidence) suggestion
 */
export function getBestSuggestion(
  targetFieldName: string,
  availableFields: string[],
  sampleData: Record<string, any>[]
): PatternSuggestion | null {
  const suggestions = suggestBusinessRules(
    targetFieldName,
    availableFields,
    sampleData
  );
  return suggestions.length > 0 ? suggestions[0] : null;
}
