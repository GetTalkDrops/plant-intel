// components/mapping/profile-selector-card.tsx

import * as React from "react";
import { IconSettings, IconCheck, IconClock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MappingProfile } from "@/types/mapping";

interface ProfileSelectorCardProps {
  profile: MappingProfile;
  isSelected: boolean;
  onSelect: (profileId: string) => void;
  onViewDetails: (profileId: string) => void;
  lastUsed?: Date;
  mappingCoverage?: number; // Percentage of fields mapped
}

export function ProfileSelectorCard({
  profile,
  isSelected,
  onSelect,
  onViewDetails,
  lastUsed,
  mappingCoverage,
}: ProfileSelectorCardProps) {
  const formatLastUsed = (date?: Date) => {
    if (!date) return "Never used";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 transition-all hover:shadow-md cursor-pointer",
        isSelected && "border-primary ring-2 ring-primary ring-offset-2"
      )}
      onClick={() => onSelect(profile.id)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <IconCheck className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div className="space-y-3">
        {/* Header with title and gear icon */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{profile.name}</h3>
            {profile.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {profile.description}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(profile.id);
            }}
          >
            <IconSettings className="h-4 w-4" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {/* Granularity level */}
          <Badge variant="secondary">
            {profile.dataGranularity === "header" ? "Header Level" : "Detail Level"}
          </Badge>

          {/* Mapping coverage if available */}
          {mappingCoverage !== undefined && (
            <Badge variant={mappingCoverage >= 80 ? "default" : "outline"}>
              {mappingCoverage}% Mapped
            </Badge>
          )}

          {/* Field count */}
          <Badge variant="outline">
            {profile.mappings.length} Fields
          </Badge>
        </div>

        {/* Last used timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconClock className="h-3.5 w-3.5" />
          <span>Last used: {formatLastUsed(lastUsed)}</span>
        </div>
      </div>
    </div>
  );
}
