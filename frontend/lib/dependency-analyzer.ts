/**
 * Dependency Analyzer
 *
 * Analyzes field dependencies to detect:
 * - Which fields use business rules that reference other fields
 * - Circular dependencies (A depends on B, B depends on A)
 * - Dependency chains (A → B → C)
 * - Orphaned fields (no dependencies)
 */

import { PropertyMapping, BusinessRule } from "@/types/mapping";

export interface FieldDependency {
  fieldId: string; // "${entity}.${property}"
  fieldName: string;
  dependsOn: string[]; // Array of field IDs this field depends on
  dependedOnBy: string[]; // Array of field IDs that depend on this field
  hasBusinessRule: boolean;
  csvColumn?: string;
}

export interface DependencyGraph {
  fields: Map<string, FieldDependency>;
  circularDependencies: CircularDependency[];
  dependencyChains: DependencyChain[];
  orphanedFields: string[]; // Fields with no dependencies either way
}

export interface CircularDependency {
  cycle: string[]; // Array of field IDs forming a circle
  severity: "error"; // Circular dependencies are always errors
}

export interface DependencyChain {
  chain: string[]; // Array of field IDs in dependency order
  depth: number; // Length of chain
}

/**
 * Build dependency graph from mappings
 */
export function buildDependencyGraph(
  mappings: PropertyMapping[]
): DependencyGraph {
  const fields = new Map<string, FieldDependency>();

  // First pass: Create nodes for all fields
  mappings.forEach((mapping) => {
    if (!mapping.ontologyEntity || !mapping.ontologyProperty) return;

    const fieldId = `${mapping.ontologyEntity}.${mapping.ontologyProperty}`;
    fields.set(fieldId, {
      fieldId,
      fieldName: mapping.displayName || fieldId,
      dependsOn: [],
      dependedOnBy: [],
      hasBusinessRule: !!mapping.businessRule,
      csvColumn: mapping.csvColumn,
    });
  });

  // Second pass: Extract dependencies from business rules
  mappings.forEach((mapping) => {
    if (!mapping.ontologyEntity || !mapping.ontologyProperty) return;
    if (!mapping.businessRule) return;

    const fieldId = `${mapping.ontologyEntity}.${mapping.ontologyProperty}`;
    const dependencies = extractBusinessRuleDependencies(
      mapping.businessRule,
      mappings
    );

    const field = fields.get(fieldId);
    if (field) {
      field.dependsOn = dependencies;

      // Update reverse dependencies
      dependencies.forEach((depId) => {
        const depField = fields.get(depId);
        if (depField && !depField.dependedOnBy.includes(fieldId)) {
          depField.dependedOnBy.push(fieldId);
        }
      });
    }
  });

  // Analyze for circular dependencies
  const circularDependencies = detectCircularDependencies(fields);

  // Find dependency chains
  const dependencyChains = findDependencyChains(fields);

  // Find orphaned fields (no business rule, not used by any other field)
  const orphanedFields = Array.from(fields.values())
    .filter(
      (field) =>
        !field.hasBusinessRule &&
        field.dependsOn.length === 0 &&
        field.dependedOnBy.length === 0
    )
    .map((field) => field.fieldId);

  return {
    fields,
    circularDependencies,
    dependencyChains,
    orphanedFields,
  };
}

/**
 * Extract field dependencies from a business rule
 */
function extractBusinessRuleDependencies(
  rule: BusinessRule,
  allMappings: PropertyMapping[]
): string[] {
  const dependencies: string[] = [];

  if (rule.type === "lookup" && rule.config) {
    // Lookup rule depends on the source field
    const lookupConfig = rule.config as any; // Type assertion for lookup config
    const sourceField = lookupConfig.sourceField;
    if (sourceField) {
      const mapping = allMappings.find((m) => m.csvColumn === sourceField);
      if (mapping && mapping.ontologyEntity && mapping.ontologyProperty) {
        dependencies.push(
          `${mapping.ontologyEntity}.${mapping.ontologyProperty}`
        );
      }
    }
  } else if (rule.type === "conditional" && rule.config) {
    // Conditional rule depends on fields in conditions
    const conditionalConfig = rule.config as any; // Type assertion for conditional config
    conditionalConfig.conditions?.forEach((condition: any) => {
      const field = condition.field;
      if (field) {
        const mapping = allMappings.find((m) => m.csvColumn === field);
        if (mapping && mapping.ontologyEntity && mapping.ontologyProperty) {
          const depId = `${mapping.ontologyEntity}.${mapping.ontologyProperty}`;
          if (!dependencies.includes(depId)) {
            dependencies.push(depId);
          }
        }
      }
    });
  }

  return dependencies;
}

/**
 * Detect circular dependencies using depth-first search
 */
function detectCircularDependencies(
  fields: Map<string, FieldDependency>
): CircularDependency[] {
  const cycles: CircularDependency[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(fieldId: string, path: string[]): void {
    visited.add(fieldId);
    recursionStack.add(fieldId);
    path.push(fieldId);

    const field = fields.get(fieldId);
    if (!field) {
      recursionStack.delete(fieldId);
      return;
    }

    for (const depId of field.dependsOn) {
      if (!visited.has(depId)) {
        dfs(depId, [...path]);
      } else if (recursionStack.has(depId)) {
        // Found a cycle!
        const cycleStart = path.indexOf(depId);
        const cycle = path.slice(cycleStart);
        cycle.push(depId); // Complete the circle

        // Check if this cycle is already recorded
        const cycleStr = cycle.sort().join(",");
        const exists = cycles.some(
          (c) => c.cycle.sort().join(",") === cycleStr
        );

        if (!exists) {
          cycles.push({ cycle, severity: "error" });
        }
      }
    }

    recursionStack.delete(fieldId);
  }

  // Check each field
  for (const fieldId of fields.keys()) {
    if (!visited.has(fieldId)) {
      dfs(fieldId, []);
    }
  }

  return cycles;
}

/**
 * Find interesting dependency chains (depth >= 2)
 */
function findDependencyChains(
  fields: Map<string, FieldDependency>
): DependencyChain[] {
  const chains: DependencyChain[] = [];

  function buildChain(fieldId: string, visited: Set<string>): string[] {
    if (visited.has(fieldId)) return [];

    const field = fields.get(fieldId);
    if (!field || field.dependsOn.length === 0) {
      return [fieldId];
    }

    visited.add(fieldId);

    // Follow the longest dependency path
    let longestPath: string[] = [];
    for (const depId of field.dependsOn) {
      const path = buildChain(depId, new Set(visited));
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }

    visited.delete(fieldId);
    return [...longestPath, fieldId];
  }

  // Find chains starting from fields that aren't depended on by others
  for (const field of fields.values()) {
    if (field.dependedOnBy.length === 0 && field.dependsOn.length > 0) {
      const chain = buildChain(field.fieldId, new Set());
      if (chain.length >= 2) {
        chains.push({
          chain,
          depth: chain.length,
        });
      }
    }
  }

  // Sort by depth (longest first)
  return chains.sort((a, b) => b.depth - a.depth);
}

/**
 * Get all fields that would be affected by changing a given field
 */
export function getImpactedFields(
  fieldId: string,
  graph: DependencyGraph
): string[] {
  const impacted = new Set<string>();
  const field = graph.fields.get(fieldId);

  if (!field) return [];

  function traverse(id: string) {
    const f = graph.fields.get(id);
    if (!f) return;

    for (const depBy of f.dependedOnBy) {
      if (!impacted.has(depBy)) {
        impacted.add(depBy);
        traverse(depBy); // Recursively find dependent fields
      }
    }
  }

  traverse(fieldId);
  return Array.from(impacted);
}

/**
 * Check if a mapping profile has dependency issues
 */
export function validateDependencies(
  mappings: PropertyMapping[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const graph = buildDependencyGraph(mappings);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for circular dependencies
  if (graph.circularDependencies.length > 0) {
    graph.circularDependencies.forEach((cycle) => {
      errors.push(
        `Circular dependency detected: ${cycle.cycle.join(" → ")}`
      );
    });
  }

  // Warn about deep dependency chains
  const deepChains = graph.dependencyChains.filter((chain) => chain.depth >= 4);
  if (deepChains.length > 0) {
    deepChains.forEach((chain) => {
      warnings.push(
        `Deep dependency chain (${chain.depth} levels): ${chain.chain.join(" → ")}`
      );
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
