/**
 * Core Configuration Variables
 * 10 user-facing config variables
 */

import { ConfigVariable } from "@/types/mapping";

// TODO: Add your 10 core config variables
export const CORE_CONFIG_VARIABLES: ConfigVariable[] = [
  {
    key: "batchSize",
    label: "Batch Size",
    type: "number",
    defaultValue: 100,
    description: "Number of records to process at once",
    group: "Processing",
    validation: { min: 1, max: 1000 },
  },
  {
    key: "enableValidation",
    label: "Enable Validation",
    type: "boolean",
    defaultValue: true,
    description: "Validate data before processing",
    group: "Quality",
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "text",
    defaultValue: "json",
    description: "Format for exported data",
    group: "Output",
  },
  // TODO: Add remaining 7 config variables
];

/**
 * Returns default config values as an object
 */
export function getDefaultConfigValues(): Record<string, any> {
  const defaults: Record<string, any> = {};

  CORE_CONFIG_VARIABLES.forEach((variable) => {
    defaults[variable.key] = variable.defaultValue;
  });

  return defaults;
}

/**
 * Validates a single config value
 */
export function validateConfigVariable(
  key: string,
  value: any
): { valid: boolean; error?: string } {
  const variable = CORE_CONFIG_VARIABLES.find((v) => v.key === key);

  if (!variable) {
    return { valid: false, error: "Unknown config variable" };
  }

  // Type validation
  if (variable.type === "number" && typeof value !== "number") {
    return { valid: false, error: "Must be a number" };
  }

  if (variable.type === "boolean" && typeof value !== "boolean") {
    return { valid: false, error: "Must be a boolean" };
  }

  // Range validation
  if (variable.validation) {
    if (variable.validation.min !== undefined && value < variable.validation.min) {
      return { valid: false, error: `Must be at least ${variable.validation.min}` };
    }
    if (variable.validation.max !== undefined && value > variable.validation.max) {
      return { valid: false, error: `Must be at most ${variable.validation.max}` };
    }
  }

  return { valid: true };
}

/**
 * Gets config variables grouped by category
 */
export function getConfigVariablesByGroup(): Record<string, ConfigVariable[]> {
  const grouped: Record<string, ConfigVariable[]> = {};

  CORE_CONFIG_VARIABLES.forEach((variable) => {
    if (!grouped[variable.group]) {
      grouped[variable.group] = [];
    }
    grouped[variable.group].push(variable);
  });

  return grouped;
}
