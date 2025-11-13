// app/dashboard/reports/page.tsx

import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">
            Generate and view analysis reports
          </p>
        </div>
        <Button>+ New Report</Button>
      </div>
      <div className="rounded-lg border p-8">
        <p className="text-muted-foreground">Reports content coming soon...</p>
      </div>
    </div>
  );
}
