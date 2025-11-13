import { DataType, CSVUpload } from "@/types/mapping";

/**
 * Parse CSV file and extract columns and sample data
 */
export async function parseCSVFile(file: File): Promise<CSVUpload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error("CSV file must have at least a header and one data row"));
          return;
        }

        // Parse header
        const headers = parseCSVLine(lines[0]);

        // Parse sample rows (first 10 data rows)
        const sampleRows: Record<string, any>[] = [];
        const rowCount = lines.length - 1;

        for (let i = 1; i < Math.min(11, lines.length); i++) {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, any> = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          sampleRows.push(row);
        }

        resolve({
          filename: file.name,
          columns: headers,
          rowCount,
          sampleRows,
          uploadedAt: new Date().toISOString(),
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
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Detect data type from sample values
 */
export function detectDataType(values: string[]): DataType {
  const nonEmptyValues = values.filter((v) => v && v.trim() !== "");

  if (nonEmptyValues.length === 0) {
    return "string";
  }

  // Check if all values are booleans
  const booleanValues = nonEmptyValues.filter((v) =>
    ["true", "false", "yes", "no", "1", "0"].includes(v.toLowerCase())
  );
  if (booleanValues.length === nonEmptyValues.length) {
    return "boolean";
  }

  // Check if all values are numbers
  const numberValues = nonEmptyValues.filter((v) => !isNaN(Number(v)));
  if (numberValues.length === nonEmptyValues.length) {
    return "number";
  }

  // Check if all values are dates
  const dateValues = nonEmptyValues.filter((v) => !isNaN(Date.parse(v)));
  if (dateValues.length === nonEmptyValues.length) {
    return "date";
  }

  return "string";
}

/**
 * Get sample data for a specific column
 */
export function getSampleData(
  csvUpload: CSVUpload,
  columnName: string,
  limit: number = 3
): string[] {
  return csvUpload.sampleRows
    .slice(0, limit)
    .map((row) => String(row[columnName] || ""));
}

/**
 * Format sample data for display
 */
export function formatSampleData(samples: string[]): string {
  if (samples.length === 0) return "(empty)";
  const displaySamples = samples.slice(0, 3);
  return displaySamples.map((s) => `"${s}"`).join(", ");
}
