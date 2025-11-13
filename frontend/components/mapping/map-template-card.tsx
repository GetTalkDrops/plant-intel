"use client";

/**
 * Map Template Card Component
 * Displays a mapping template in card format (for library view)
 */

import { MappingTemplate } from "@/types/mapping";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MapTemplateCardProps {
  template: MappingTemplate;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MapTemplateCard({
  template,
  onSelect,
  onEdit,
  onDelete,
}: MapTemplateCardProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Mappings:</span>
            <span className="font-medium">{template.mappings.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Mapped:</span>
            <span className="font-medium">
              {template.mappings.filter((m) => m.status === "mapped").length}
            </span>
          </div>
          {template.createdAt && (
            <div className="flex justify-between">
              <span>Created:</span>
              <span className="font-medium">
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2 border-t">
          {onSelect && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSelect(template.id!)}
              className="flex-1"
            >
              Use Template
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(template.id!)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(template.id!)}
              className="text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
