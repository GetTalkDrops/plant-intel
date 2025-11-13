/**
 * CSV Parsing and Data Type Detection Utilities
 */

import { CSVUpload } from "@/types/mapping";

/**
 * Parses CSV file and returns structured data
 */
export async function parseCSVFile(file: File): Promise<CSVUpload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim());

        // Parse data rows
        const rows: Record<string, any>[] = [];
        for (let i = 1; i < Math.min(lines.length, 101); i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          const row: Record<string, any> = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          rows.push(row);
        }

        resolve({
          filename: file.name,
          columns: headers,
          rowCount: lines.length - 1,
          sampleRows: rows.slice(0, 5),
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Detects data type from sample values
 */
export function detectDataType(
  values: any[]
): "string" | "number" | "boolean" | "date" {
  const nonEmptyValues = values.filter((v) => v !== null && v !== "");

  if (nonEmptyValues.length === 0) return "string";

  // Check if all values are numbers
  const allNumbers = nonEmptyValues.every((v) => !isNaN(Number(v)));
  if (allNumbers) return "number";

  // Check if all values are booleans
  const allBooleans = nonEmptyValues.every(
    (v) => v === "true" || v === "false" || v === true || v === false
  );
  if (allBooleans) return "boolean";

  // Check if all values are dates
  const allDates = nonEmptyValues.every((v) => !isNaN(Date.parse(v)));
  if (allDates) return "date";

  return "string";
}

/**
 * Gets sample data for a specific column
 */
export function getSampleData(
  csvUpload: CSVUpload,
  columnName: string,
  limit: number = 5
): string[] {
  return csvUpload.sampleRows
    .map((row) => String(row[columnName] || ""))
    .slice(0, limit);
}

/**
 * Formats sample data for display
 */
export function formatSampleData(samples: string[]): string {
  if (samples.length === 0) return "No data";
  return samples.slice(0, 3).join(", ") + (samples.length > 3 ? "..." : "");
}
