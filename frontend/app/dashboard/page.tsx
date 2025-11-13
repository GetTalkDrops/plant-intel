// app/dashboard/page.tsx

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";

// Sample data for recent analyses
const analysisData = [
  {
    id: 1,
    header: "Q4 Production Analysis",
    type: "Production Data",
    status: "Done",
    target: "150",
    limit: "200",
    reviewer: "Eddie Lake",
  },
  {
    id: 2,
    header: "November Manufacturing Report",
    type: "Manufacturing",
    status: "In Process",
    target: "120",
    limit: "180",
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: 3,
    header: "Quality Control October",
    type: "Quality Metrics",
    status: "Done",
    target: "100",
    limit: "150",
    reviewer: "Eddie Lake",
  },
  {
    id: 4,
    header: "ERP Data Integration",
    type: "ERP Import",
    status: "In Process",
    target: "80",
    limit: "120",
    reviewer: "Assign reviewer",
  },
  {
    id: 5,
    header: "MES Weekly Summary",
    type: "MES Data",
    status: "Done",
    target: "60",
    limit: "90",
    reviewer: "Jamik Tashpulatov",
  },
];

export default function StartNewAnalysisPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Upload Section */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Start New Analysis</h2>
            <p className="text-muted-foreground">
              Upload your data file to begin analysis
            </p>
          </div>
          <Button>Upload File</Button>
        </div>

        {/* Upload Modal/Section */}
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Upload Data File</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag CSV file here or browse
          </p>
          <Button variant="outline">Browse Files</Button>
        </div>
      </div>

      {/* Recent Analyses Table */}
      <DataTable data={analysisData} />
    </div>
  );
}
