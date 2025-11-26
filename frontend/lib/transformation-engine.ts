/**
 * Data Transformation Engine
 *
 * Applies field-level transformations to clean and normalize data.
 * These transformations are applied BEFORE business rules.
 */

import {
  FieldTransformation,
  DateFormatConfig,
  RemoveUnitsConfig,
  ReplaceTextConfig,
} from "@/types/mapping";

/**
 * Apply a single transformation to a value
 */
export function applyTransformation(
  value: any,
  transformation: FieldTransformation
): any {
  // Handle null/undefined
  if (value == null) {
    if (transformation.type === "defaultValue" && transformation.config?.value) {
      return transformation.config.value;
    }
    return value;
  }

  const str = String(value);

  switch (transformation.type) {
    case "trim":
      return str.trim();

    case "uppercase":
      return str.toUpperCase();

    case "lowercase":
      return str.toLowerCase();

    case "parseDate":
      return parseDateTransformation(str, transformation.config as DateFormatConfig);

    case "parseNumber":
      return parseNumberTransformation(str);

    case "removeUnits":
      return removeUnitsTransformation(str, transformation.config as RemoveUnitsConfig);

    case "replaceText":
      return replaceTextTransformation(str, transformation.config as ReplaceTextConfig);

    case "defaultValue":
      // Return value as-is if it's not empty, otherwise use default
      if (str.trim() === "") {
        return transformation.config?.value || value;
      }
      return value;

    default:
      return value;
  }
}

/**
 * Apply multiple transformations in sequence
 */
export function applyTransformations(
  value: any,
  transformations: FieldTransformation[]
): any {
  let result = value;
  for (const transformation of transformations) {
    result = applyTransformation(result, transformation);
  }
  return result;
}

/**
 * Parse date with specified format
 */
function parseDateTransformation(
  value: string,
  config?: DateFormatConfig
): string | null {
  if (!value || value.trim() === "") return null;

  try {
    // If no format specified, try standard JavaScript date parsing
    if (!config?.inputFormat) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }

    // Parse according to input format
    const date = parseDateWithFormat(value, config.inputFormat);
    if (!date) return null;

    // Return in output format or ISO
    if (config.outputFormat) {
      return formatDate(date, config.outputFormat);
    }
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Parse date according to a format string
 * Supports: MM, DD, YYYY, HH, mm, ss
 */
function parseDateWithFormat(value: string, format: string): Date | null {
  try {
    // Simple parser for common formats
    // Format: "MM/DD/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", etc.
    const formatRegex = format
      .replace(/YYYY/g, "(\\d{4})")
      .replace(/MM/g, "(\\d{1,2})")
      .replace(/DD/g, "(\\d{1,2})")
      .replace(/HH/g, "(\\d{1,2})")
      .replace(/mm/g, "(\\d{1,2})")
      .replace(/ss/g, "(\\d{1,2})");

    const match = value.match(new RegExp(formatRegex));
    if (!match) return null;

    const formatParts = format.match(/YYYY|MM|DD|HH|mm|ss/g);
    if (!formatParts) return null;

    const parts: Record<string, number> = {};
    formatParts.forEach((part, index) => {
      parts[part] = parseInt(match[index + 1], 10);
    });

    const year = parts["YYYY"] || new Date().getFullYear();
    const month = (parts["MM"] || 1) - 1; // JavaScript months are 0-indexed
    const day = parts["DD"] || 1;
    const hour = parts["HH"] || 0;
    const minute = parts["mm"] || 0;
    const second = parts["ss"] || 0;

    const date = new Date(year, month, day, hour, minute, second);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

/**
 * Format date according to format string
 */
function formatDate(date: Date, format: string): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");

  return format
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/DD/g, pad(date.getDate()))
    .replace(/HH/g, pad(date.getHours()))
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/ss/g, pad(date.getSeconds()));
}

/**
 * Parse number, removing non-numeric characters
 */
function parseNumberTransformation(value: string): number | null {
  if (!value || value.trim() === "") return null;

  // Remove common formatting: commas, spaces, currency symbols
  const cleaned = value.replace(/[$,\s]/g, "");

  // Handle negative numbers and decimals
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Remove unit suffixes
 */
function removeUnitsTransformation(
  value: string,
  config?: RemoveUnitsConfig
): string {
  if (!value || value.trim() === "") return value;
  if (!config?.units || config.units.length === 0) return value;

  let result = value;
  for (const unit of config.units) {
    // Remove unit at end of string (case-insensitive)
    const regex = new RegExp(`\\s*${unit}\\s*$`, "i");
    result = result.replace(regex, "");
  }

  return result.trim();
}

/**
 * Find and replace text
 */
function replaceTextTransformation(
  value: string,
  config?: ReplaceTextConfig
): string {
  if (!value || value.trim() === "") return value;
  if (!config?.find) return value;

  const replacement = config.replace || "";

  if (config.useRegex) {
    try {
      const flags = config.caseSensitive ? "g" : "gi";
      const regex = new RegExp(config.find, flags);
      return value.replace(regex, replacement);
    } catch (error) {
      // Invalid regex, fall back to string replacement
      return value.replace(config.find, replacement);
    }
  }

  // Simple string replacement
  if (config.caseSensitive) {
    return value.split(config.find).join(replacement);
  } else {
    const regex = new RegExp(config.find, "gi");
    return value.replace(regex, replacement);
  }
}

/**
 * Validate transformation configuration
 */
export function validateTransformation(
  transformation: FieldTransformation
): { valid: boolean; error?: string } {
  switch (transformation.type) {
    case "parseDate":
      if (transformation.config?.inputFormat) {
        const format = transformation.config.inputFormat as string;
        const validParts = /^[MDYHms\-\/\s:,\.]+$/.test(format);
        if (!validParts) {
          return {
            valid: false,
            error: "Invalid date format. Use YYYY, MM, DD, HH, mm, ss",
          };
        }
      }
      return { valid: true };

    case "removeUnits":
      if (
        !transformation.config?.units ||
        !Array.isArray(transformation.config.units) ||
        transformation.config.units.length === 0
      ) {
        return { valid: false, error: "At least one unit must be specified" };
      }
      return { valid: true };

    case "replaceText":
      if (!transformation.config?.find) {
        return { valid: false, error: "Find text is required" };
      }
      if (transformation.config.useRegex) {
        try {
          new RegExp(transformation.config.find);
        } catch (error) {
          return { valid: false, error: "Invalid regular expression" };
        }
      }
      return { valid: true };

    case "defaultValue":
      if (
        transformation.config?.value === undefined ||
        transformation.config?.value === ""
      ) {
        return { valid: false, error: "Default value is required" };
      }
      return { valid: true };

    case "trim":
    case "uppercase":
    case "lowercase":
    case "parseNumber":
      // These don't require config
      return { valid: true };

    default:
      return { valid: false, error: "Unknown transformation type" };
  }
}

/**
 * Get preview of transformation applied to sample values
 */
export function previewTransformation(
  sampleValues: any[],
  transformation: FieldTransformation
): Array<{ original: any; transformed: any }> {
  return sampleValues.slice(0, 5).map((value) => ({
    original: value,
    transformed: applyTransformation(value, transformation),
  }));
}
