"use client";

import * as React from "react";
import { IconClock, IconFileText, IconSettings } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapTemplateSummary } from "@/types/mapping";

interface MapTemplateCardProps {
  template: MapTemplateSummary;
  onSelect?: (templateId: string) => void;
  onEdit?: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
}

export function MapTemplateCard({
  template,
  onSelect,
  onEdit,
  onDelete,
}: MapTemplateCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <IconFileText className="h-4 w-4" />
            <span>{template.columnCount} columns</span>
          </div>
          <div className="flex items-center gap-1">
            <IconSettings className="h-4 w-4" />
            <span>{template.configCount} configs</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            <IconClock className="mr-1 h-3 w-3" />
            Created {formatDate(template.createdAt)}
          </Badge>
          {template.lastUsed && (
            <Badge variant="secondary" className="text-xs">
              Last used {formatDate(template.lastUsed)}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {onSelect && (
          <Button
            onClick={() => onSelect(template.id)}
            className="flex-1"
          >
            Use Template
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            onClick={() => onEdit(template.id)}
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => onDelete(template.id)}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
