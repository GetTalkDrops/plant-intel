/**
 * Type definitions for the PlantIntel Mapping System
 * All TypeScript interfaces and types for CSV mapping functionality
 */

// CSV Upload Data
export interface CSVUpload {
  filename: string;
  columns: string[];
  rowCount: number;
  sampleRows: Record<string, any>[];
}

// Mapping Row (one per CSV column)
export interface MappingRow {
  id: string;
  sourceType: "csv" | "fixed";
  sourceColumn?: string;
  fixedValue?: string;
  ontologyEntity: string;
  ontologyProperty: string;
  dataType: "string" | "number" | "boolean" | "date";
  sampleData?: string[];
  status: "unmapped" | "mapped" | "error";
  validationError?: string;
}

// Complete Mapping Template
export interface MappingTemplate {
  id?: string;
  name: string;
  description?: string;
  mappings: MappingRow[];
  configVariables: Record<string, any>;
  csvUpload?: CSVUpload;
  createdAt?: string;
  updatedAt?: string;
}

// Ontology Entity Definition
export interface OntologyEntity {
  name: string;
  description: string;
  properties: OntologyProperty[];
}

// Ontology Property Definition
export interface OntologyProperty {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  required: boolean;
  description?: string;
}

// Config Variable Definition
export interface ConfigVariable {
  key: string;
  label: string;
  type: "number" | "text" | "boolean";
  defaultValue: any;
  description: string;
  group: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Dropdown Option
export interface OntologyOption {
  value: string;
  label: string;
  entity?: string;
}
