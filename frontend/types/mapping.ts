// Core types for the CSV mapping system

export type SourceType = "csv" | "fixed";

export type DataType = "string" | "number" | "date" | "boolean";

// Ontology entity structure
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

// CSV mapping row - represents one line in the mapping table
export interface MappingRow {
  id: string;
  sourceType: SourceType;

  // For CSV source type
  csvColumn?: string;
  csvDataType?: DataType;
  sampleData?: string[];

  // For fixed source type
  fixedValue?: string;

  // Ontology mapping
  ontologyEntity: string;  // e.g., "Machine", "Material"
  ontologyProperty: string; // e.g., "id", "laborRate"

  // Status
  status: "mapped" | "unmapped" | "error";
  validationMessage?: string;
}

// Complete mapping template
export interface MappingTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  mappings: MappingRow[];
  configVariables: ConfigVariable[];
  userId: string;
  isActive: boolean;
}

// Config variables (the 10 core user-facing variables)
export interface ConfigVariable {
  key: string;
  displayName: string;
  value: string | number | boolean;
  unit?: string;
  dataType: DataType;
  description?: string;
}

// CSV upload metadata
export interface CSVUpload {
  filename: string;
  columns: string[];
  rowCount: number;
  sampleRows: Record<string, any>[];
  uploadedAt: string;
}

// For the analysis selection view
export interface MapTemplateSummary {
  id: string;
  name: string;
  description?: string;
  columnCount: number;
  configCount: number;
  lastUsed?: string;
  createdAt: string;
}
