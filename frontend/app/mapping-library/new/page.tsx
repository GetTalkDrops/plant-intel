/**
 * New Mapping Template Page
 * Page for creating a new CSV mapping template
 */

import { CSVMapper } from "@/components/mapping";
import { MappingTemplate } from "@/types/mapping";
import Link from "next/link";

export default function NewMappingPage() {
  const handleSave = (template: MappingTemplate) => {
    // TODO: Connect to Supabase when backend is ready
    console.log("Template to save:", template);
    alert("Template saved! (Mock - no backend yet)");

    // Future: Save to database
    // const { data, error } = await supabase
    //   .from('mapping_templates')
    //   .insert(template)

    // Future: Redirect to library
    // router.push('/mapping-library')
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href="/mapping-library" className="hover:text-primary">
            Mapping Library
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New Template</span>
        </nav>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Create New Mapping Template
        </h1>
        <p className="text-gray-600 mt-2">
          Upload a CSV file and map its columns to the ontology schema
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <CSVMapper mode="builder" onSave={handleSave} />
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900">Quick Guide:</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>1. Upload your CSV file using drag-and-drop or file selector</li>
          <li>2. Map each CSV column to an ontology entity and property</li>
          <li>3. Configure variables for data processing</li>
          <li>4. Save the template for reuse with similar CSV files</li>
        </ul>
      </div>
    </div>
  );
}
