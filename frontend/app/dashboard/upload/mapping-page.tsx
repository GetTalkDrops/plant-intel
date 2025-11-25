// app/(dashboard)/upload/mapping/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GranularitySelector } from "@/components/upload/granularity-selector";
import { MappingTable } from "@/components/upload/mapping-table";
import { ValidationWarnings } from "@/components/upload/validation-warnings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import {
  GranularityAnalysis,
  AggregationStrategy,
  FieldMapping,
  MappingValidationIssue,
} from "@/types/mapping";

export default function MappingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, any>[]>([]);
  const [granularityAnalysis, setGranularityAnalysis] =
    useState<GranularityAnalysis | null>(null);
  const [selectedStrategy, setSelectedStrategy] =
    useState<AggregationStrategy | null>(null);
  const [headerMappings, setHeaderMappings] = useState<
    Record<string, FieldMapping>
  >({});
  const [detailMappings, setDetailMappings] = useState<Record<
    string,
    FieldMapping
  > | null>(null);
  const [validationIssues, setValidationIssues] = useState<
    MappingValidationIssue[]
  >([]);
  const [qualityScore, setQualityScore] = useState(100);

  // Load CSV and detect granularity
  useEffect(() => {
    if (!fileId) {
      router.push("/upload");
      return;
    }

    loadCSVData();
  }, [fileId]);

  async function loadCSVData() {
    try {
      // Load CSV from storage and parse
      const response = await fetch(`/api/upload/parse?fileId=${fileId}`);
      const data = await response.json();

      setCsvColumns(data.columns);
      setSampleData(data.sample);

      // Detect granularity
      const granularityRes = await fetch("/api/mapping/detect-granularity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: data.columns,
          sampleData: data.sample,
        }),
      });

      const granularity = await granularityRes.json();
      setGranularityAnalysis(granularity);

      // If header-level, auto-set strategy
      if (!granularity.hasMultipleRowsPerWO) {
        setSelectedStrategy(null); // No choice needed
        await generateAutoSuggestions("header", data.columns, data.sample);
      }
    } catch (error) {
      console.error("Failed to load CSV:", error);
      alert("Failed to load CSV data. Please try uploading again.");
      router.push("/upload");
    } finally {
      setLoading(false);
    }
  }

  // When strategy is selected, generate suggestions
  useEffect(() => {
    if (selectedStrategy && csvColumns.length > 0) {
      generateAutoSuggestions(
        selectedStrategy === "keep_detail" ? "detail" : "header",
        csvColumns,
        sampleData
      );
    }
  }, [selectedStrategy]);

  async function generateAutoSuggestions(
    level: "header" | "detail",
    columns: string[],
    sample: Record<string, any>[]
  ) {
    try {
      const response = await fetch("/api/mapping/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns,
          sampleData: sample,
          level,
        }),
      });

      const suggestions = await response.json();

      setHeaderMappings(suggestions.headerMappings);

      if (level === "detail" || selectedStrategy === "keep_detail") {
        setDetailMappings(suggestions.detailMappings);
      }

      // Validate initial suggestions
      await validateMappings(
        suggestions.headerMappings,
        suggestions.detailMappings
      );
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    }
  }

  function handleMappingChange(
    field: string,
    column: string | null,
    level: "header" | "detail"
  ) {
    if (level === "header") {
      setHeaderMappings((prev) => {
        const updated = { ...prev };
        updated[field] = {
          ...updated[field],
          sourceColumn: column,
          isMapped: column !== null,
          sampleValues: column
            ? sampleData.slice(0, 3).map((row) => row[column])
            : [],
        };
        return updated;
      });
    } else {
      setDetailMappings((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated[field] = {
          ...updated[field],
          sourceColumn: column,
          isMapped: column !== null,
          sampleValues: column
            ? sampleData.slice(0, 3).map((row) => row[column])
            : [],
        };
        return updated;
      });
    }

    // Re-validate after change
    const newHeader =
      level === "header"
        ? {
            ...headerMappings,
            [field]: {
              ...headerMappings[field],
              sourceColumn: column,
              isMapped: column !== null,
            },
          }
        : headerMappings;

    const newDetail =
      level === "detail" && detailMappings
        ? {
            ...detailMappings,
            [field]: {
              ...detailMappings[field],
              sourceColumn: column,
              isMapped: column !== null,
            },
          }
        : detailMappings;

    validateMappings(newHeader, newDetail);
  }

  async function validateMappings(
    header: Record<string, FieldMapping>,
    detail: Record<string, FieldMapping> | null
  ) {
    try {
      const response = await fetch("/api/mapping/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headerMappings: header,
          detailMappings: detail,
          csvData: sampleData,
        }),
      });

      const validation = await response.json();
      setValidationIssues(validation.issues);
      setQualityScore(validation.qualityScore);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  }

  async function handleProceed() {
    // Check for errors
    const hasErrors = validationIssues.some((i) => i.severity === "error");

    if (hasErrors) {
      alert("Please fix all errors before proceeding.");
      return;
    }

    // Check required fields
    const unmappedRequired = Object.values(headerMappings).filter(
      (m) => m.isRequired && !m.isMapped
    );

    if (unmappedRequired.length > 0) {
      alert(
        `Please map required fields: ${unmappedRequired
          .map((m) => m.ontologyField)
          .join(", ")}`
      );
      return;
    }

    setProcessing(true);

    try {
      // Transform and load data
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          mappingProfile: {
            dataGranularity: granularityAnalysis?.granularity || "header",
            aggregationStrategy: selectedStrategy,
            headerMappings,
            detailMappings,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to analysis page
        router.push(`/analytics/${result.batchId}?new=true`);
      } else {
        alert(`Failed to transform data: ${result.error}`);
      }
    } catch (error) {
      console.error("Transform failed:", error);
      alert("Failed to transform data. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  const hasErrors = validationIssues.some((i) => i.severity === "error");
  const canProceed =
    !hasErrors &&
    (!granularityAnalysis?.hasMultipleRowsPerWO || selectedStrategy !== null) &&
    Object.values(headerMappings).every((m) => !m.isRequired || m.isMapped);

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/upload")}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Upload
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Map Your Data</h1>
            <p className="text-gray-600 mt-2">
              Connect your CSV columns to Plant Intel's data model
            </p>
          </div>

          <Card className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{qualityScore}%</div>
              <div className="text-sm text-gray-600">Mapping Quality</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Granularity Selector */}
      {granularityAnalysis && (
        <GranularitySelector
          analysis={granularityAnalysis}
          selectedStrategy={selectedStrategy}
          onSelect={setSelectedStrategy}
        />
      )}

      {/* Show mapping only after strategy is selected (or if header-level) */}
      {(!granularityAnalysis?.hasMultipleRowsPerWO || selectedStrategy) && (
        <>
          {/* Validation Issues */}
          {validationIssues.length > 0 && (
            <div className="mb-6">
              <ValidationWarnings issues={validationIssues} />
            </div>
          )}

          {/* Mapping Table */}
          <div className="mb-8">
            <MappingTable
              headerMappings={headerMappings}
              detailMappings={detailMappings}
              csvColumns={csvColumns}
              onMappingChange={handleMappingChange}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded">
            <div className="text-sm text-gray-600">
              {Object.values(headerMappings).filter((m) => m.isMapped).length}{" "}
              of {Object.values(headerMappings).length} fields mapped
              {hasErrors && (
                <span className="ml-4 text-red-600 font-medium">
                  •{" "}
                  {
                    validationIssues.filter((i) => i.severity === "error")
                      .length
                  }{" "}
                  errors to fix
                </span>
              )}
            </div>

            <div className="flex gap-4">
              <Button variant="outline">Save as Profile</Button>

              <Button
                onClick={handleProceed}
                disabled={!canProceed || processing}
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Transforming Data...
                  </>
                ) : (
                  <>
                    <Check className="mr-2" size={16} />
                    Proceed to Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
