// components/upload/granularity-selector.tsx

"use client";

import { GranularityAnalysis, AggregationStrategy } from "@/types/mapping";
import { Card } from "@/components/ui/card";
import { AlertCircle, Check } from "lucide-react";

interface Props {
  analysis: GranularityAnalysis;
  selectedStrategy: AggregationStrategy | null;
  onSelect: (strategy: AggregationStrategy) => void;
}

export function GranularitySelector({
  analysis,
  selectedStrategy,
  onSelect,
}: Props) {
  if (!analysis.hasMultipleRowsPerWO) {
    return (
      <Card className="bg-green-50 border-green-200 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Check className="text-green-600 mt-1" size={20} />
          <div>
            <div className="font-semibold text-green-800">
              Header-Level Data Detected
            </div>
            <div className="text-sm text-green-700 mt-1">
              {analysis.reasoning} - No aggregation needed.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200 p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="text-blue-600 mt-1" size={24} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900">
            {analysis.granularity === "operation"
              ? "Operation-Level"
              : "Line-Item Level"}{" "}
            Data Detected
          </h3>
          <p className="text-sm text-blue-700 mt-1">{analysis.reasoning}</p>
        </div>
      </div>

      {analysis.exampleWorkOrder && (
        <div className="bg-white rounded p-4 mb-4 text-sm">
          <div className="font-semibold mb-2">Example from your data:</div>
          <div className="font-mono text-xs space-y-1">
            <div>
              <strong>Work Order:</strong> {analysis.exampleWorkOrder.number}
            </div>
            <div>
              <strong>Rows:</strong> {analysis.exampleWorkOrder.rowCount}
            </div>
            {analysis.exampleWorkOrder.operations && (
              <div>
                <strong>Operations:</strong>{" "}
                {analysis.exampleWorkOrder.operations.join(", ")}
              </div>
            )}
            {analysis.exampleWorkOrder.materials && (
              <div>
                <strong>Materials:</strong>{" "}
                {analysis.exampleWorkOrder.materials.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="font-semibold text-blue-900">
          How would you like to load this data?
        </div>

        <label
          className={`flex items-start gap-3 p-4 border-2 rounded cursor-pointer transition-colors ${
            selectedStrategy === "keep_detail"
              ? "border-blue-600 bg-blue-100"
              : "border-gray-300 hover:border-blue-300 bg-white"
          }`}
        >
          <input
            type="radio"
            name="granularity_choice"
            value="keep_detail"
            checked={selectedStrategy === "keep_detail"}
            onChange={() => onSelect("keep_detail")}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-2">
              Keep Detail (Recommended)
              {selectedStrategy === "keep_detail" && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                  SELECTED
                </span>
              )}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              Preserve all operations/materials separately. Enables detailed
              analysis by operation, material, and machine.
            </div>
            <div className="text-sm text-green-600 mt-2 space-y-1">
              <div>✓ Analyze cost/scrap by specific operations</div>
              <div>✓ Track material usage patterns</div>
              <div>✓ Identify which machines cause issues</div>
              <div>✓ Compare efficiency across operations</div>
            </div>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-4 border-2 rounded cursor-pointer transition-colors ${
            selectedStrategy === "aggregate"
              ? "border-blue-600 bg-blue-100"
              : "border-gray-300 hover:border-blue-300 bg-white"
          }`}
        >
          <input
            type="radio"
            name="granularity_choice"
            value="aggregate"
            checked={selectedStrategy === "aggregate"}
            onChange={() => onSelect("aggregate")}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-2">
              Aggregate to Work Order Level
              {selectedStrategy === "aggregate" && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                  SELECTED
                </span>
              )}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              Sum costs/hours across all operations into work order totals.
              Simpler but loses operation-level detail.
            </div>
            <div className="text-sm text-yellow-600 mt-2 space-y-1">
              <div>⚠️ Cannot analyze by operation</div>
              <div>⚠️ Cannot identify which machine caused issues</div>
              <div>⚠️ Limited material-level insights</div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Use this if you only care about work order-level totals
            </div>
          </div>
        </label>
      </div>

      {!selectedStrategy && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Please select how you want to load this data before proceeding to
          mapping.
        </div>
      )}
    </Card>
  );
}
