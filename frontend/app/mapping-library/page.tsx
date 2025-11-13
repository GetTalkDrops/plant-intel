/**
 * Mapping Library Page
 * Lists all saved mapping templates
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MappingLibraryPage() {
  // TODO: Fetch templates from Supabase when backend is ready
  const templates: any[] = [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mapping Library</h1>
          <p className="text-gray-600 mt-2">
            Manage your CSV mapping templates
          </p>
        </div>
        <Button asChild>
          <Link href="/mapping-library/new">Create New Template</Link>
        </Button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No templates yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first mapping template to get started
          </p>
          <Button asChild>
            <Link href="/mapping-library/new">Create Template</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Template cards will go here */}
        </div>
      )}
    </div>
  );
}
