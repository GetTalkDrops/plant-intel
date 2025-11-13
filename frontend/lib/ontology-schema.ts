import { OntologyEntity } from "@/types/mapping";

// Manufacturing ontology schema for PlantIntel
// Based on the forensic manufacturing relationship diagram

export const ONTOLOGY_SCHEMA: OntologyEntity[] = [
  {
    name: "Machine",
    properties: [
      {
        key: "id",
        displayName: "Machine ID",
        dataType: "string",
        required: true,
        description: "Unique identifier for the machine"
      },
      {
        key: "name",
        displayName: "Machine Name",
        dataType: "string",
        required: false,
        description: "Human-readable machine name"
      },
      {
        key: "type",
        displayName: "Machine Type",
        dataType: "string",
        required: false,
        description: "Category or type of machine (e.g., CNC, Press)"
      },
      {
        key: "location",
        displayName: "Location",
        dataType: "string",
        required: false,
        description: "Physical location or zone"
      }
    ]
  },
  {
    name: "Material",
    properties: [
      {
        key: "id",
        displayName: "Material ID",
        dataType: "string",
        required: true,
        description: "Unique identifier for the material"
      },
      {
        key: "name",
        displayName: "Material Name",
        dataType: "string",
        required: false,
        description: "Material description or name"
      },
      {
        key: "cost",
        displayName: "Material Cost",
        dataType: "number",
        required: false,
        description: "Cost per unit of material"
      },
      {
        key: "unit",
        displayName: "Unit of Measure",
        dataType: "string",
        required: false,
        description: "Unit (e.g., kg, lbs, units)"
      }
    ]
  },
  {
    name: "WorkOrder",
    properties: [
      {
        key: "id",
        displayName: "Work Order ID",
        dataType: "string",
        required: true,
        description: "Unique work order identifier"
      },
      {
        key: "type",
        displayName: "Order Type",
        dataType: "string",
        required: false,
        description: "Type or category of work order"
      },
      {
        key: "startDate",
        displayName: "Start Date",
        dataType: "date",
        required: false,
        description: "When the order began"
      },
      {
        key: "endDate",
        displayName: "End Date",
        dataType: "date",
        required: false,
        description: "When the order completed"
      },
      {
        key: "quantity",
        displayName: "Quantity",
        dataType: "number",
        required: false,
        description: "Number of units ordered"
      },
      {
        key: "machineId",
        displayName: "Machine ID (FK)",
        dataType: "string",
        required: false,
        description: "Foreign key to Machine"
      }
    ]
  },
  {
    name: "Operation",
    properties: [
      {
        key: "id",
        displayName: "Operation ID",
        dataType: "string",
        required: true,
        description: "Unique operation identifier"
      },
      {
        key: "workOrderId",
        displayName: "Work Order ID (FK)",
        dataType: "string",
        required: false,
        description: "Foreign key to Work Order"
      },
      {
        key: "machineId",
        displayName: "Machine ID (FK)",
        dataType: "string",
        required: false,
        description: "Foreign key to Machine"
      },
      {
        key: "laborHours",
        displayName: "Labor Hours",
        dataType: "number",
        required: false,
        description: "Total labor hours spent"
      },
      {
        key: "laborRate",
        displayName: "Labor Rate",
        dataType: "number",
        required: false,
        description: "Hourly labor rate ($/hr)"
      },
      {
        key: "scrapQuantity",
        displayName: "Scrap Quantity",
        dataType: "number",
        required: false,
        description: "Number of scrapped units"
      },
      {
        key: "scrapRate",
        displayName: "Scrap Rate",
        dataType: "number",
        required: false,
        description: "Scrap rate as percentage"
      },
      {
        key: "duration",
        displayName: "Duration (minutes)",
        dataType: "number",
        required: false,
        description: "Operation duration in minutes"
      }
    ]
  },
  {
    name: "Supplier",
    properties: [
      {
        key: "id",
        displayName: "Supplier ID",
        dataType: "string",
        required: true,
        description: "Unique supplier identifier"
      },
      {
        key: "name",
        displayName: "Supplier Name",
        dataType: "string",
        required: false,
        description: "Supplier company name"
      },
      {
        key: "materialId",
        displayName: "Material ID (FK)",
        dataType: "string",
        required: false,
        description: "Foreign key to Material"
      }
    ]
  },
  {
    name: "Quality",
    properties: [
      {
        key: "id",
        displayName: "Quality Record ID",
        dataType: "string",
        required: true,
        description: "Unique quality record identifier"
      },
      {
        key: "workOrderId",
        displayName: "Work Order ID (FK)",
        dataType: "string",
        required: false,
        description: "Foreign key to Work Order"
      },
      {
        key: "issueType",
        displayName: "Issue Type",
        dataType: "string",
        required: false,
        description: "Type of quality issue"
      },
      {
        key: "issueRate",
        displayName: "Issue Rate",
        dataType: "number",
        required: false,
        description: "Quality issue rate as percentage"
      },
      {
        key: "defectCount",
        displayName: "Defect Count",
        dataType: "number",
        required: false,
        description: "Number of defects found"
      }
    ]
  },
  {
    name: "Cost",
    properties: [
      {
        key: "id",
        displayName: "Cost Record ID",
        dataType: "string",
        required: true,
        description: "Unique cost record identifier"
      },
      {
        key: "workOrderId",
        displayName: "Work Order ID (FK)",
        dataType: "string",
        required: false,
        description: "Foreign key to Work Order"
      },
      {
        key: "laborCost",
        displayName: "Labor Cost",
        dataType: "number",
        required: false,
        description: "Total labor cost"
      },
      {
        key: "materialCost",
        displayName: "Material Cost",
        dataType: "number",
        required: false,
        description: "Total material cost"
      },
      {
        key: "totalCost",
        displayName: "Total Cost",
        dataType: "number",
        required: false,
        description: "Total operation cost"
      },
      {
        key: "variance",
        displayName: "Cost Variance",
        dataType: "number",
        required: false,
        description: "Variance from expected cost"
      }
    ]
  }
];

// Helper function to get all ontology properties in flat format for dropdowns
export function getFlatOntologyOptions(): Array<{
  value: string;
  label: string;
  entity: string;
  property: string;
}> {
  const options: Array<{
    value: string;
    label: string;
    entity: string;
    property: string;
  }> = [];

  ONTOLOGY_SCHEMA.forEach((entity) => {
    entity.properties.forEach((prop) => {
      options.push({
        value: `${entity.name}.${prop.key}`,
        label: `${entity.name}.${prop.displayName}`,
        entity: entity.name,
        property: prop.key,
      });
    });
  });

  return options;
}

// Helper to get properties for a specific entity
export function getEntityProperties(entityName: string) {
  const entity = ONTOLOGY_SCHEMA.find((e) => e.name === entityName);
  return entity?.properties || [];
}

// Helper to get all entity names
export function getEntityNames(): string[] {
  return ONTOLOGY_SCHEMA.map((e) => e.name);
}
