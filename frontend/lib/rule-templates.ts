// Pre-built rule templates for common manufacturing scenarios
// Users can quickly apply these templates instead of building rules from scratch

import {
  BusinessRule,
  LookupRuleConfig,
  ConditionalRuleConfig,
} from "@/types/mapping";

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: "labor" | "material" | "machine" | "time" | "other";
  ruleType: "lookup" | "conditional";
  // Template will be filled in with actual field names
  createRule: (params: TemplateParams) => BusinessRule;
}

export interface TemplateParams {
  sourceField?: string; // For lookup templates
  conditionField?: string; // For conditional templates
  defaultValue?: string;
}

// Shift Premium Template - Apply different labor rates based on shift time
const shiftPremiumTemplate: RuleTemplate = {
  id: "shift-premium",
  name: "Shift Premium",
  description:
    "Apply different labor rates for day shift vs night shift based on time",
  category: "labor",
  ruleType: "conditional",
  createRule: (params) => ({
    type: "conditional",
    config: {
      conditions: [
        {
          field: params.conditionField || "",
          operator: "greaterThanOrEqual",
          value: "18:00",
          result: "1.5",
          label: "Night shift premium (6pm-6am)",
        },
        {
          field: params.conditionField || "",
          operator: "lessThan",
          value: "06:00",
          result: "1.5",
          label: "Night shift premium (6pm-6am)",
        },
        {
          field: params.conditionField || "",
          operator: "greaterThanOrEqual",
          value: "06:00",
          result: "1.0",
          label: "Day shift rate (6am-6pm)",
        },
      ],
      defaultValue: params.defaultValue || "1.0",
    } as ConditionalRuleConfig,
  }),
};

// Weekend Premium Template - Apply overtime multiplier on weekends
const weekendPremiumTemplate: RuleTemplate = {
  id: "weekend-premium",
  name: "Weekend Premium",
  description: "Apply overtime multiplier for weekend work",
  category: "labor",
  ruleType: "conditional",
  createRule: (params) => ({
    type: "conditional",
    config: {
      conditions: [
        {
          field: params.conditionField || "",
          operator: "equals",
          value: "Saturday",
          result: "1.5",
          label: "Saturday overtime rate",
        },
        {
          field: params.conditionField || "",
          operator: "equals",
          value: "Sunday",
          result: "2.0",
          label: "Sunday overtime rate",
        },
      ],
      defaultValue: params.defaultValue || "1.0",
    } as ConditionalRuleConfig,
  }),
};

// Machine Rates Template - Look up scrap rate or efficiency by machine ID
const machineRatesTemplate: RuleTemplate = {
  id: "machine-rates",
  name: "Machine Rates",
  description: "Look up machine-specific rates (scrap, efficiency, etc.)",
  category: "machine",
  ruleType: "lookup",
  createRule: (params) => ({
    type: "lookup",
    config: {
      sourceField: params.sourceField || "",
      lookupTable: {
        "MACHINE-A": "2.5",
        "MACHINE-B": "3.0",
        "MACHINE-C": "2.0",
      },
      defaultValue: params.defaultValue || "2.5",
    } as LookupRuleConfig,
  }),
};

// Material Grade Template - Look up material cost by material code
const materialGradeTemplate: RuleTemplate = {
  id: "material-grade",
  name: "Material Grade Pricing",
  description: "Look up material cost based on grade or material code",
  category: "material",
  ruleType: "lookup",
  createRule: (params) => ({
    type: "lookup",
    config: {
      sourceField: params.sourceField || "",
      lookupTable: {
        "PREM-A": "150.00",
        "PREM-B": "125.00",
        STD: "100.00",
        ECON: "75.00",
      },
      defaultValue: params.defaultValue || "100.00",
    } as LookupRuleConfig,
  }),
};

// Premium Material Template - Conditional based on material code prefix
const premiumMaterialTemplate: RuleTemplate = {
  id: "premium-material",
  name: "Premium Material Pricing",
  description: "Apply premium pricing when material code starts with specific prefix",
  category: "material",
  ruleType: "conditional",
  createRule: (params) => ({
    type: "conditional",
    config: {
      conditions: [
        {
          field: params.conditionField || "",
          operator: "startsWith",
          value: "PREM",
          result: "150.00",
          label: "Premium material rate",
        },
        {
          field: params.conditionField || "",
          operator: "startsWith",
          value: "STD",
          result: "100.00",
          label: "Standard material rate",
        },
      ],
      defaultValue: params.defaultValue || "100.00",
    } as ConditionalRuleConfig,
  }),
};

// Overtime Threshold Template - Apply multiplier when hours exceed threshold
const overtimeThresholdTemplate: RuleTemplate = {
  id: "overtime-threshold",
  name: "Overtime Threshold",
  description: "Apply overtime multiplier when hours exceed threshold",
  category: "labor",
  ruleType: "conditional",
  createRule: (params) => ({
    type: "conditional",
    config: {
      conditions: [
        {
          field: params.conditionField || "",
          operator: "greaterThan",
          value: "40",
          result: "1.5",
          label: "Overtime rate (>40 hours)",
        },
        {
          field: params.conditionField || "",
          operator: "lessThanOrEqual",
          value: "40",
          result: "1.0",
          label: "Regular time rate",
        },
      ],
      defaultValue: params.defaultValue || "1.0",
    } as ConditionalRuleConfig,
  }),
};

// Department Rates Template - Look up department-specific overhead rates
const departmentRatesTemplate: RuleTemplate = {
  id: "department-rates",
  name: "Department Overhead Rates",
  description: "Look up overhead rates by department code",
  category: "other",
  ruleType: "lookup",
  createRule: (params) => ({
    type: "lookup",
    config: {
      sourceField: params.sourceField || "",
      lookupTable: {
        PROD: "45.00",
        ASSY: "35.00",
        QC: "50.00",
        SHIP: "25.00",
      },
      defaultValue: params.defaultValue || "40.00",
    } as LookupRuleConfig,
  }),
};

// Export all templates
export const RULE_TEMPLATES: RuleTemplate[] = [
  shiftPremiumTemplate,
  weekendPremiumTemplate,
  machineRatesTemplate,
  materialGradeTemplate,
  premiumMaterialTemplate,
  overtimeThresholdTemplate,
  departmentRatesTemplate,
];

// Helper to get templates by category
export function getTemplatesByCategory(
  category: RuleTemplate["category"]
): RuleTemplate[] {
  return RULE_TEMPLATES.filter((t) => t.category === category);
}

// Helper to get template by ID
export function getTemplateById(id: string): RuleTemplate | undefined {
  return RULE_TEMPLATES.find((t) => t.id === id);
}

// Helper to get templates by rule type
export function getTemplatesByType(
  ruleType: "lookup" | "conditional"
): RuleTemplate[] {
  return RULE_TEMPLATES.filter((t) => t.ruleType === ruleType);
}
