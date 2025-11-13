// app/dashboard/mapping-library/page.tsx

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MappingLibraryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mapping Library</h2>
            <p className="text-muted-foreground">
              Manage your CSV mapping configurations
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/mapping-library/new">+ New Map</Link>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">
            No mapping templates yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first CSV mapping template to get started
          </p>
          <Button asChild>
            <Link href="/dashboard/mapping-library/new">Create First Map</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
