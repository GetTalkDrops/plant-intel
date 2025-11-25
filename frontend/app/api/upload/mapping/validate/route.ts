// app/api/mapping/validate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { validateMappings } from "@/lib/mapping/mapping-validator";

export async function POST(request: NextRequest) {
  try {
    const { headerMappings, detailMappings, csvData } = await request.json();

    // Combine all mappings for validation
    const allMappings = {
      ...headerMappings,
      ...(detailMappings || {}),
    };

    const issues = validateMappings(allMappings, csvData);

    // Calculate quality score
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    let qualityScore = 100;
    qualityScore -= errorCount * 20; // -20 per error
    qualityScore -= warningCount * 5; // -5 per warning
    qualityScore = Math.max(0, qualityScore);

    return NextResponse.json({
      issues,
      qualityScore,
    });
  } catch (error) {
    console.error("Validation failed:", error);
    return NextResponse.json(
      { error: "Failed to validate mappings" },
      { status: 500 }
    );
  }
}
