/**
 * Ontology Schema Definition
 * 7 manufacturing entities, 36 properties
 */

import { OntologyEntity, OntologyOption } from "@/types/mapping";

// TODO: Add your 7 manufacturing entities here
export const ONTOLOGY_SCHEMA: OntologyEntity[] = [
  {
    name: "Machine",
    description: "Manufacturing machine or equipment",
    properties: [
      { name: "id", type: "string", required: true, description: "Unique identifier" },
      { name: "name", type: "string", required: true, description: "Machine name" },
      { name: "type", type: "string", required: false, description: "Machine type" },
      { name: "status", type: "string", required: false, description: "Operational status" },
      // TODO: Add more properties
    ],
  },
  {
    name: "Material",
    description: "Raw materials or components",
    properties: [
      { name: "id", type: "string", required: true, description: "Unique identifier" },
      { name: "name", type: "string", required: true, description: "Material name" },
      { name: "quantity", type: "number", required: false, description: "Quantity available" },
      // TODO: Add more properties
    ],
  },
  // TODO: Add remaining 5 entities
];

/**
 * Returns all ontology paths as flat dropdown options
 * Format: "Entity.property"
 */
export function getFlatOntologyOptions(): OntologyOption[] {
  const options: OntologyOption[] = [];

  ONTOLOGY_SCHEMA.forEach((entity) => {
    entity.properties.forEach((property) => {
      options.push({
        value: `${entity.name}.${property.name}`,
        label: `${entity.name}.${property.name}`,
        entity: entity.name,
      });
    });
  });

  return options;
}

/**
 * Gets properties for a specific entity
 */
export function getEntityProperties(entityName: string) {
  const entity = ONTOLOGY_SCHEMA.find((e) => e.name === entityName);
  return entity?.properties || [];
}

/**
 * Returns list of all entity names
 */
export function getEntityNames(): string[] {
  return ONTOLOGY_SCHEMA.map((e) => e.name);
}
