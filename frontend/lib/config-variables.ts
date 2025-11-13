import { ConfigVariable } from "@/types/mapping";

// The 10 core user-facing configuration variables
// These are exposed in the UI, the other 29 variables are handled in onboarding

export const CORE_CONFIG_VARIABLES: ConfigVariable[] = [
  {
    key: "labor_rate_hourly",
    displayName: "Labor Rate (Hourly)",
    value: 200,
    unit: "$/hour",
    dataType: "number",
    description: "Standard hourly labor rate for cost calculations"
  },
  {
    key: "scrap_cost_per_unit",
    displayName: "Scrap Cost Per Unit",
    value: 75,
    unit: "$/unit",
    dataType: "number",
    description: "Cost per scrapped unit for quality impact calculations"
  },
  {
    key: "variance_threshold_pct",
    displayName: "Variance Threshold",
    value: 15,
    unit: "%",
    dataType: "number",
    description: "Percentage threshold for detecting significant cost variances"
  },
  {
    key: "min_variance_amount",
    displayName: "Minimum Variance Amount",
    value: 1000,
    unit: "$",
    dataType: "number",
    description: "Minimum dollar amount to flag a variance as significant"
  },
  {
    key: "confidence_threshold_pct",
    displayName: "Confidence Threshold",
    value: 65,
    unit: "%",
    dataType: "number",
    description: "Minimum confidence level required for surfacing insights"
  },
  {
    key: "quality_min_issue_rate_pct",
    displayName: "Quality Issue Rate Threshold",
    value: 10,
    unit: "%",
    dataType: "number",
    description: "Minimum quality issue rate to flag a material or process"
  },
  {
    key: "pattern_min_orders",
    displayName: "Minimum Orders for Pattern",
    value: 3,
    unit: "orders",
    dataType: "number",
    description: "Minimum number of orders required to identify a pattern"
  },
  {
    key: "focus_material_costs",
    displayName: "Focus: Material Costs",
    value: true,
    dataType: "boolean",
    description: "Enable material cost analysis"
  },
  {
    key: "focus_labor_efficiency",
    displayName: "Focus: Labor Efficiency",
    value: true,
    dataType: "boolean",
    description: "Enable labor efficiency analysis"
  },
  {
    key: "focus_quality_issues",
    displayName: "Focus: Quality Issues",
    value: true,
    dataType: "boolean",
    description: "Enable quality issue analysis"
  }
];

// Helper to get default config values
export function getDefaultConfigValues(): Record<string, any> {
  const config: Record<string, any> = {};
  CORE_CONFIG_VARIABLES.forEach((variable) => {
    config[variable.key] = variable.value;
  });
  return config;
}

// Helper to validate config values
export function validateConfigVariable(
  key: string,
  value: any
): { valid: boolean; error?: string } {
  const variable = CORE_CONFIG_VARIABLES.find((v) => v.key === key);

  if (!variable) {
    return { valid: false, error: "Unknown configuration variable" };
  }

  // Type checking
  if (variable.dataType === "number" && typeof value !== "number") {
    return { valid: false, error: "Value must be a number" };
  }

  if (variable.dataType === "boolean" && typeof value !== "boolean") {
    return { valid: false, error: "Value must be true or false" };
  }

  // Range validation for percentages
  if (variable.unit === "%" && (value < 0 || value > 100)) {
    return { valid: false, error: "Percentage must be between 0 and 100" };
  }

  // Positive number validation for costs
  if (variable.unit?.includes("$") && value < 0) {
    return { valid: false, error: "Cost must be positive" };
  }

  return { valid: true };
}
