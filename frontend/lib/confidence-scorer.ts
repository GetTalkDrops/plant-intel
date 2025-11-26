/**
 * Confidence Scoring System
 *
 * Calculates mapping quality metrics to help users understand
 * the completeness and reliability of their mapping profiles.
 */

import { PropertyMapping, MappingProfile, BusinessRule } from "@/types/mapping";

export interface ConfidenceScore {
  overall: number; // 0-100
  breakdown: {
    mappingCompleteness: number; // % of required fields mapped
    businessRulesCoverage: number; // % of mapped fields with business rules
    sampleDataCoverage: number; // % of sample data with valid values
    validationHealth: number; // Based on warnings/errors
  };
  metrics: {
    totalFields: number;
    mappedFields: number;
    requiredFields: number;
    requiredFieldsMapped: number;
    fieldsWithRules: number;
    totalWarnings: number;
    totalErrors: number;
  };
  warnings: ConfidenceWarning[];
  recommendations: string[];
}

export interface ConfidenceWarning {
  severity: "error" | "warning" | "info";
  field?: string;
  message: string;
  category: "mapping" | "rules" | "data" | "validation";
}

/**
 * Calculate comprehensive confidence score for a mapping profile
 */
export function calculateConfidenceScore(
  mappings: PropertyMapping[],
  sampleData?: Record<string, any>[]
): ConfidenceScore {
  const metrics = calculateMetrics(mappings);
  const warnings = detectWarnings(mappings, sampleData);
  const breakdown = calculateBreakdown(mappings, metrics, warnings, sampleData);
  const overall = calculateOverallScore(breakdown);
  const recommendations = generateRecommendations(breakdown, warnings);

  return {
    overall,
    breakdown,
    metrics,
    warnings,
    recommendations,
  };
}

/**
 * Calculate raw metrics from mappings
 */
function calculateMetrics(mappings: PropertyMapping[]) {
  const totalFields = mappings.length;
  const mappedFields = mappings.filter((m) => m.isMapped).length;
  const requiredFields = mappings.filter((m) => m.required).length;
  const requiredFieldsMapped = mappings.filter(
    (m) => m.required && m.isMapped
  ).length;
  const fieldsWithRules = mappings.filter(
    (m) => m.isMapped && m.businessRule
  ).length;

  return {
    totalFields,
    mappedFields,
    requiredFields,
    requiredFieldsMapped,
    fieldsWithRules,
    totalWarnings: 0, // Calculated from warnings
    totalErrors: 0, // Calculated from warnings
  };
}

/**
 * Detect issues and generate warnings
 */
function detectWarnings(
  mappings: PropertyMapping[],
  sampleData?: Record<string, any>[]
): ConfidenceWarning[] {
  const warnings: ConfidenceWarning[] = [];

  // Check for unmapped required fields
  mappings.forEach((mapping) => {
    if (mapping.required && !mapping.isMapped) {
      warnings.push({
        severity: "error",
        field: `${mapping.ontologyEntity}.${mapping.ontologyProperty}`,
        message: "Required field is not mapped",
        category: "mapping",
      });
    }
  });

  // Check for mapped fields without source
  mappings.forEach((mapping) => {
    if (
      mapping.ontologyEntity &&
      mapping.ontologyProperty &&
      !mapping.csvColumn &&
      !mapping.fixedValue
    ) {
      warnings.push({
        severity: "warning",
        field: `${mapping.ontologyEntity}.${mapping.ontologyProperty}`,
        message: "Field mapping is incomplete (no source selected)",
        category: "mapping",
      });
    }
  });

  // Check for duplicate mappings
  const csvColumnUsage = new Map<string, string[]>();
  mappings.forEach((mapping) => {
    if (mapping.csvColumn && mapping.isMapped) {
      const key = mapping.csvColumn;
      const field = `${mapping.ontologyEntity}.${mapping.ontologyProperty}`;
      if (!csvColumnUsage.has(key)) {
        csvColumnUsage.set(key, []);
      }
      csvColumnUsage.get(key)!.push(field);
    }
  });

  csvColumnUsage.forEach((fields, csvColumn) => {
    if (fields.length > 1) {
      warnings.push({
        severity: "info",
        message: `CSV column "${csvColumn}" is mapped to ${fields.length} fields: ${fields.join(", ")}`,
        category: "mapping",
      });
    }
  });

  // Check for empty sample data
  if (sampleData && sampleData.length === 0) {
    warnings.push({
      severity: "warning",
      message: "No sample data available to validate mappings",
      category: "data",
    });
  }

  // Check for fields that could benefit from business rules
  if (sampleData && sampleData.length > 0) {
    mappings.forEach((mapping) => {
      if (
        mapping.isMapped &&
        mapping.sourceType === "csv" &&
        mapping.csvColumn &&
        !mapping.businessRule
      ) {
        const values = sampleData
          .map((row) => row[mapping.csvColumn!])
          .filter((v) => v != null);
        const uniqueValues = new Set(values);

        // Suggest rule if there are 2-20 unique values (likely lookup pattern)
        if (uniqueValues.size >= 2 && uniqueValues.size <= 20) {
          warnings.push({
            severity: "info",
            field: `${mapping.ontologyEntity}.${mapping.ontologyProperty}`,
            message: `Field has ${uniqueValues.size} unique values - consider adding a business rule`,
            category: "rules",
          });
        }
      }
    });
  }

  return warnings;
}

/**
 * Calculate breakdown scores (0-100)
 */
function calculateBreakdown(
  mappings: PropertyMapping[],
  metrics: ReturnType<typeof calculateMetrics>,
  warnings: ConfidenceWarning[],
  sampleData?: Record<string, any>[]
) {
  // Mapping completeness: % of required fields mapped
  const mappingCompleteness =
    metrics.requiredFields > 0
      ? (metrics.requiredFieldsMapped / metrics.requiredFields) * 100
      : 100;

  // Business rules coverage: % of mapped fields with business rules
  const businessRulesCoverage =
    metrics.mappedFields > 0
      ? (metrics.fieldsWithRules / metrics.mappedFields) * 100
      : 0;

  // Sample data coverage: % of mapped fields with valid sample data
  let sampleDataCoverage = 100;
  if (sampleData && sampleData.length > 0) {
    const mappedWithData = mappings.filter((m) => {
      if (!m.isMapped || m.sourceType !== "csv" || !m.csvColumn) return false;
      const values = sampleData
        .map((row) => row[m.csvColumn!])
        .filter((v) => v != null && v !== "");
      return values.length > 0;
    }).length;
    sampleDataCoverage =
      metrics.mappedFields > 0 ? (mappedWithData / metrics.mappedFields) * 100 : 0;
  }

  // Validation health: Based on warnings/errors
  const errors = warnings.filter((w) => w.severity === "error").length;
  const warningsCount = warnings.filter((w) => w.severity === "warning").length;

  let validationHealth = 100;
  validationHealth -= errors * 20; // Each error costs 20 points
  validationHealth -= warningsCount * 5; // Each warning costs 5 points
  validationHealth = Math.max(0, validationHealth);

  // Update metrics with warning counts
  metrics.totalErrors = errors;
  metrics.totalWarnings = warningsCount;

  return {
    mappingCompleteness,
    businessRulesCoverage,
    sampleDataCoverage,
    validationHealth,
  };
}

/**
 * Calculate overall score (weighted average)
 */
function calculateOverallScore(breakdown: ReturnType<typeof calculateBreakdown>) {
  // Weighted formula:
  // - Mapping completeness: 40% (most important - must have required fields)
  // - Validation health: 30% (no errors/warnings)
  // - Sample data coverage: 20% (data quality)
  // - Business rules coverage: 10% (nice to have, not required)

  const overall =
    breakdown.mappingCompleteness * 0.4 +
    breakdown.validationHealth * 0.3 +
    breakdown.sampleDataCoverage * 0.2 +
    breakdown.businessRulesCoverage * 0.1;

  return Math.round(overall);
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  breakdown: ReturnType<typeof calculateBreakdown>,
  warnings: ConfidenceWarning[]
): string[] {
  const recommendations: string[] = [];

  // Mapping completeness
  if (breakdown.mappingCompleteness < 100) {
    const errors = warnings.filter(
      (w) => w.severity === "error" && w.category === "mapping"
    ).length;
    recommendations.push(`Map ${errors} required field${errors !== 1 ? "s" : ""} to improve confidence`);
  }

  // Validation health
  const errors = warnings.filter((w) => w.severity === "error").length;
  const warningsCount = warnings.filter((w) => w.severity === "warning").length;
  if (errors > 0) {
    recommendations.push(`Fix ${errors} error${errors !== 1 ? "s" : ""} before saving`);
  }
  if (warningsCount > 0) {
    recommendations.push(`Review ${warningsCount} warning${warningsCount !== 1 ? "s" : ""} to improve quality`);
  }

  // Business rules
  if (breakdown.businessRulesCoverage < 30) {
    const ruleOpportunities = warnings.filter(
      (w) => w.category === "rules" && w.severity === "info"
    ).length;
    if (ruleOpportunities > 0) {
      recommendations.push(
        `Add business rules to ${ruleOpportunities} field${ruleOpportunities !== 1 ? "s" : ""} with structured values`
      );
    }
  }

  // Sample data
  if (breakdown.sampleDataCoverage < 80) {
    recommendations.push("Some mapped fields have missing or empty sample data");
  }

  // If everything is good
  if (recommendations.length === 0 && breakdown.mappingCompleteness === 100) {
    recommendations.push("Mapping profile looks great! Ready to save.");
  }

  return recommendations;
}

/**
 * Get color class for confidence score
 */
export function getConfidenceColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}
