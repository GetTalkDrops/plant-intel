// =============================================================================
// UNIFIED MAPPING TYPE SYSTEM
// =============================================================================
// This file contains all types for the CSV mapping system.
// It combines profile management, ontology mapping, validation, and granularity detection.

// =============================================================================
// BASIC TYPES
// =============================================================================

export type DataType = "string" | "number" | "date" | "boolean";
export type SourceType = "csv" | "fixed" | "derived";
export type MappingConfidence = "high" | "medium" | "low";
export type DataGranularity = "header" | "operation" | "line_item";
export type AggregationStrategy = "keep_detail" | "aggregate";

// =============================================================================
// CSV UPLOAD
// =============================================================================
// Represents a CSV file that has been uploaded and parsed

export interface CSVUpload {
  filename: string;
  columns: string[];
  rowCount: number;
  sampleRows: Record<string, any>[];
  uploadedAt: string;
}

// =============================================================================
// GRANULARITY DETECTION
// =============================================================================
// Determines if data is at work order level, operation level, or line-item level

export interface GranularityAnalysis {
  granularity: DataGranularity;
  confidence: number;
  reasoning: string;
  hasMultipleRowsPerWO: boolean;
  rowsPerWO: number;
  groupingFields: string[];
  aggregationNeeded: boolean;
  exampleWorkOrder?: {
    number: string;
    rowCount: number;
    operations?: string[];
    materials?: string[];
  };
}

// =============================================================================
// ONTOLOGY STRUCTURE
// =============================================================================
// Defines the manufacturing data model (entities and their properties)

export interface OntologyEntity {
  name: string;
  properties: OntologyProperty[];
}

export interface OntologyProperty {
  key: string;
  displayName: string;
  dataType: DataType;
  required: boolean;
  description?: string;
}

// =============================================================================
// FIELD-LEVEL TRANSFORMATIONS
// =============================================================================
// Data transformations applied to individual CSV columns during parsing
// NOTE: These are separate from global analyzer config variables

export interface FieldTransformation {
  type: TransformationType;
  config?: Record<string, any>;  // Type-specific configuration
}

export type TransformationType =
  | "trim"                       // Remove whitespace
  | "uppercase"                  // Convert to uppercase
  | "lowercase"                  // Convert to lowercase
  | "parseDate"                  // Parse date with format
  | "parseNumber"                // Parse number, remove non-numeric chars
  | "removeUnits"                // Strip unit suffixes (e.g., "100 lbs" → "100")
  | "replaceText"                // Find and replace text
  | "defaultValue";              // Use default if empty

// Common transformation configs
export interface DateFormatConfig {
  inputFormat: string;           // e.g., "MM/DD/YYYY", "DD-MM-YYYY"
  outputFormat?: string;         // Optional, defaults to ISO
}

export interface RemoveUnitsConfig {
  units: string[];               // e.g., ["lbs", "kg", "hrs"]
}

export interface ReplaceTextConfig {
  find: string | RegExp;
  replace: string;
}

export interface DefaultValueConfig {
  defaultValue: any;
}

// =============================================================================
// BUSINESS RULES (Context-Aware Value Derivation)
// =============================================================================
// These encode domain knowledge and allow conditional/contextual value assignment
// This is the "moat" - accumulated ERP/manufacturing knowledge as configuration

export type BusinessRuleType = "lookup" | "conditional" | "formula";

export interface BusinessRule {
  type: BusinessRuleType;
  config: LookupRuleConfig | ConditionalRuleConfig | FormulaRuleConfig;
}

// Lookup Table Rule - map one field's value to another value
// Example: machineId "MACHINE-A" -> scrapRate 2.0
export interface LookupRuleConfig {
  sourceField: string;           // Which CSV column to use as lookup key
  lookupTable: Record<string, any>; // Key-value pairs
  defaultValue?: any;            // Fallback if key not found
}

// Conditional Override Rule - apply different values based on conditions
// Example: if shiftStart >= 18:00, laborRate = 65, else 45
export interface ConditionalRuleConfig {
  conditions: ConditionalRule[];
  defaultValue?: any;            // Fallback if no condition matches
}

export interface ConditionalRule {
  field: string;                 // Which field to evaluate
  operator: ComparisonOperator;
  value: any;                    // Value to compare against
  result: any;                   // Value to use if condition is true
  label?: string;                // Human-readable description
}

export type ComparisonOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "contains"
  | "startsWith"
  | "endsWith";

// Formula Rule - calculate value from other fields
// Example: totalCost = laborHours * laborRate + materialCost
export interface FormulaRuleConfig {
  formula: string;               // Expression string (e.g., "field1 * field2")
  requiredFields: string[];      // Fields needed for calculation
}

// =============================================================================
// PROPERTY MAPPING
// =============================================================================
// Maps a single ontology property to a data source (CSV column, fixed value, etc.)

export interface PropertyMapping {
  // What we're mapping TO (ontology)
  ontologyEntity: string;        // e.g., "WorkOrder", "Material", "Machine"
  ontologyProperty: string;      // e.g., "workOrderNumber", "materialCode"
  displayName: string;           // Human-readable name for UI
  dataType: DataType;
  required: boolean;

  // What we're mapping FROM (source)
  sourceType: SourceType;
  csvColumn?: string;            // If sourceType is "csv"
  fixedValue?: any;              // If sourceType is "fixed"
  derivationLogic?: string;      // If sourceType is "derived"

  // Mapping quality
  confidence?: MappingConfidence;
  isMapped: boolean;

  // Field-level data transformations (applied during CSV parsing)
  transformations?: FieldTransformation[];

  // Business rules for context-aware value derivation
  businessRule?: BusinessRule;

  // For validation and debugging
  sampleValues?: any[];
  validationMessage?: string;
}

// =============================================================================
// FIELD MAPPING (Legacy - used by old upload flow)
// =============================================================================
// NOTE: This is the old structure used by components/upload and will be
// deprecated once we fully migrate to PropertyMapping

export interface FieldMapping {
  ontologyField: string;
  sourceColumn: string | null;
  confidence: MappingConfidence;
  transformations: string[];
  isRequired: boolean;
  isMapped: boolean;
  dataType: DataType;
  sampleValues: any[];
}

// =============================================================================
// VALIDATION
// =============================================================================
// Tracks issues found during mapping validation

export interface MappingValidationIssue {
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
  affectedRows?: number;
  suggestion?: string;
}

// =============================================================================
// CONFIG VARIABLES
// =============================================================================
// The 10 core variables that control analyzer behavior

export interface ConfigVariable {
  key: string;
  displayName: string;
  value: string | number | boolean;
  unit?: string;
  dataType: DataType;
  description?: string;
}

// =============================================================================
// MAPPING PROFILE (THE CORE REUSABLE TEMPLATE)
// =============================================================================
// This is what gets saved and reused across customers
// It encodes your accumulated knowledge about different ERP systems

export interface MappingProfile {
  // Identity
  id: string;
  name: string;                  // e.g., "NetSuite Standard Export"
  description?: string;
  erpSystem?: string;            // e.g., "NetSuite", "SAP", "Epicor"

  // The actual mappings
  mappings: PropertyMapping[];

  // Granularity handling
  dataGranularity: DataGranularity;
  aggregationStrategy: AggregationStrategy | null;
  granularityHints?: {
    groupingFields: string[];    // Columns that identify work orders
    detailFields: string[];      // Columns that vary by operation
  };

  // Analysis configuration
  configVariables: ConfigVariable[];

  // Data cleaning rules
  cleaningRules?: {
    dateFormats?: Record<string, string>;
    unitConversions?: Record<string, {
      from: string;
      to: string;
      factor: number;
    }>;
  };

  // Metadata (tracking the moat)
  createdAt: string;
  updatedAt: string;
  userId: string;
  isActive: boolean;
  usageCount?: number;
  lastUsed?: string;
  successRate?: number;          // % of times auto-mapping worked

  // Phase 3.3: Profile Versioning (prepared for future backend integration)
  version?: number;              // Version number (1, 2, 3, ...)
  parentVersionId?: string;      // ID of the version this was cloned from
  versionNotes?: string;         // What changed in this version
}

// =============================================================================
// PROFILE SUMMARY (for list views)
// =============================================================================

export interface ProfileSummary {
  id: string;
  name: string;
  description?: string;
  erpSystem?: string;
  mappingCount: number;
  configCount: number;
  usageCount: number;
  successRate?: number;
  lastUsed?: string;
  createdAt: string;
}

// =============================================================================
// WORKING STATE (during mapping session)
// =============================================================================
// Represents the state while a user is actively creating/editing a profile

export interface MappingWorkingState {
  // CSV being worked with
  csvData: CSVUpload | null;

  // Granularity detection results
  granularityAnalysis: GranularityAnalysis | null;
  selectedStrategy: AggregationStrategy | null;

  // Current mappings being edited
  mappings: PropertyMapping[];

  // Validation results
  validationIssues: MappingValidationIssue[];
  qualityScore: number;

  // Config being edited
  configVariables: ConfigVariable[];

  // Profile being edited (if any)
  profileId?: string;
  profileName: string;
  profileDescription?: string;
  erpSystem?: string;
}
