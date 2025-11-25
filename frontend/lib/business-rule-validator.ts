// Business Rule Validation and Preview
// Evaluates rules against sample data to show users what will happen

import {
  BusinessRule,
  LookupRuleConfig,
  ConditionalRuleConfig,
  ConditionalRule,
  ComparisonOperator,
} from "@/types/mapping";

export interface RulePreviewResult {
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
  defaultRows: number;
  matches: RuleMatch[];
  warnings: RuleWarning[];
  errors: RuleError[];
}

export interface RuleMatch {
  rowIndex: number;
  sourceValue: any;
  resultValue: any;
  matchReason: string;
}

export interface RuleWarning {
  type: "no_matches" | "missing_field" | "partial_coverage" | "missing_default";
  message: string;
  severity: "warning" | "info";
}

export interface RuleError {
  type: "invalid_field" | "invalid_operator" | "type_mismatch";
  message: string;
}

/**
 * Preview a business rule against sample data
 */
export function previewBusinessRule(
  rule: BusinessRule,
  sampleData: Record<string, any>[],
  availableFields: string[]
): RulePreviewResult {
  if (!sampleData || sampleData.length === 0) {
    return {
      totalRows: 0,
      matchedRows: 0,
      unmatchedRows: 0,
      defaultRows: 0,
      matches: [],
      warnings: [
        {
          type: "no_matches",
          message: "No sample data available for preview",
          severity: "info",
        },
      ],
      errors: [],
    };
  }

  if (rule.type === "lookup") {
    return previewLookupRule(rule.config as LookupRuleConfig, sampleData, availableFields);
  } else if (rule.type === "conditional") {
    return previewConditionalRule(rule.config as ConditionalRuleConfig, sampleData, availableFields);
  } else {
    return {
      totalRows: sampleData.length,
      matchedRows: 0,
      unmatchedRows: 0,
      defaultRows: 0,
      matches: [],
      warnings: [],
      errors: [
        {
          type: "invalid_operator",
          message: "Formula rules are not yet supported",
        },
      ],
    };
  }
}

function previewLookupRule(
  config: LookupRuleConfig,
  sampleData: Record<string, any>[],
  availableFields: string[]
): RulePreviewResult {
  const result: RulePreviewResult = {
    totalRows: sampleData.length,
    matchedRows: 0,
    unmatchedRows: 0,
    defaultRows: 0,
    matches: [],
    warnings: [],
    errors: [],
  };

  // Validate source field exists
  if (!config.sourceField) {
    result.errors.push({
      type: "invalid_field",
      message: "No source field selected for lookup",
    });
    return result;
  }

  if (!availableFields.includes(config.sourceField)) {
    result.errors.push({
      type: "invalid_field",
      message: `Source field "${config.sourceField}" not found in available fields`,
    });
    return result;
  }

  // Check if lookup table is empty
  if (Object.keys(config.lookupTable).length === 0) {
    result.warnings.push({
      type: "no_matches",
      message: "Lookup table is empty. Add key-value pairs to enable lookups.",
      severity: "warning",
    });
  }

  // Evaluate each row
  sampleData.forEach((row, index) => {
    const sourceValue = row[config.sourceField];
    const lookupKey = String(sourceValue).trim();
    const lookupValue = config.lookupTable[lookupKey];

    if (lookupValue !== undefined) {
      result.matchedRows++;
      result.matches.push({
        rowIndex: index,
        sourceValue: sourceValue,
        resultValue: lookupValue,
        matchReason: `Lookup: "${lookupKey}" → ${lookupValue}`,
      });
    } else if (config.defaultValue !== undefined && config.defaultValue !== "") {
      result.defaultRows++;
      result.matches.push({
        rowIndex: index,
        sourceValue: sourceValue,
        resultValue: config.defaultValue,
        matchReason: `Default value (key "${lookupKey}" not found)`,
      });
    } else {
      result.unmatchedRows++;
    }
  });

  // Add warnings
  if (result.matchedRows === 0 && Object.keys(config.lookupTable).length > 0) {
    result.warnings.push({
      type: "no_matches",
      message: "No sample rows match any lookup table keys. Check your key values.",
      severity: "warning",
    });
  }

  if (result.unmatchedRows > 0 && !config.defaultValue) {
    result.warnings.push({
      type: "missing_default",
      message: `${result.unmatchedRows} rows have no match and no default value set`,
      severity: "warning",
    });
  }

  return result;
}

function previewConditionalRule(
  config: ConditionalRuleConfig,
  sampleData: Record<string, any>[],
  availableFields: string[]
): RulePreviewResult {
  const result: RulePreviewResult = {
    totalRows: sampleData.length,
    matchedRows: 0,
    unmatchedRows: 0,
    defaultRows: 0,
    matches: [],
    warnings: [],
    errors: [],
  };

  // Validate conditions
  if (config.conditions.length === 0) {
    result.warnings.push({
      type: "no_matches",
      message: "No conditions defined. Add at least one condition.",
      severity: "warning",
    });
    return result;
  }

  // Check for invalid fields
  for (const condition of config.conditions) {
    if (!condition.field) {
      result.errors.push({
        type: "invalid_field",
        message: "One or more conditions have no field selected",
      });
      return result;
    }

    if (!availableFields.includes(condition.field)) {
      result.errors.push({
        type: "invalid_field",
        message: `Field "${condition.field}" not found in available fields`,
      });
      return result;
    }
  }

  // Evaluate each row
  sampleData.forEach((row, index) => {
    let matched = false;

    for (const condition of config.conditions) {
      if (evaluateCondition(condition, row)) {
        result.matchedRows++;
        result.matches.push({
          rowIndex: index,
          sourceValue: row[condition.field],
          resultValue: condition.result,
          matchReason: condition.label || `${condition.field} ${condition.operator} ${condition.value}`,
        });
        matched = true;
        break; // First match wins
      }
    }

    if (!matched) {
      if (config.defaultValue !== undefined && config.defaultValue !== "") {
        result.defaultRows++;
        result.matches.push({
          rowIndex: index,
          sourceValue: null,
          resultValue: config.defaultValue,
          matchReason: "Default value (no conditions matched)",
        });
      } else {
        result.unmatchedRows++;
      }
    }
  });

  // Add warnings
  if (result.matchedRows === 0) {
    result.warnings.push({
      type: "no_matches",
      message: "No sample rows match any conditions. Check your condition values.",
      severity: "warning",
    });
  }

  if (result.unmatchedRows > 0 && !config.defaultValue) {
    result.warnings.push({
      type: "missing_default",
      message: `${result.unmatchedRows} rows don't match any condition and have no default value`,
      severity: "warning",
    });
  }

  if (result.matchedRows > 0 && result.unmatchedRows === 0 && result.defaultRows === 0) {
    result.warnings.push({
      type: "partial_coverage",
      message: "All sample rows matched! This looks good.",
      severity: "info",
    });
  }

  return result;
}

function evaluateCondition(condition: ConditionalRule, row: Record<string, any>): boolean {
  const fieldValue = row[condition.field];
  const compareValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return String(fieldValue).trim() === String(compareValue).trim();

    case "notEquals":
      return String(fieldValue).trim() !== String(compareValue).trim();

    case "greaterThan":
      return parseFloat(fieldValue) > parseFloat(compareValue);

    case "lessThan":
      return parseFloat(fieldValue) < parseFloat(compareValue);

    case "greaterThanOrEqual":
      return parseFloat(fieldValue) >= parseFloat(compareValue);

    case "lessThanOrEqual":
      return parseFloat(fieldValue) <= parseFloat(compareValue);

    case "contains":
      return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());

    case "startsWith":
      return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());

    case "endsWith":
      return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());

    default:
      return false;
  }
}
