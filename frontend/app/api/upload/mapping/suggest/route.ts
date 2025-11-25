// app/api/mapping/suggest/route.ts

import { NextRequest, NextResponse } from "next/server";
import { suggestMappings } from "@/lib/mapping/auto-suggestor";

export async function POST(request: NextRequest) {
  try {
    const { columns, sampleData, level } = await request.json();

    const headerMappings = suggestMappings(columns, sampleData, "header");

    const detailMappings =
      level === "detail"
        ? suggestMappings(columns, sampleData, "detail")
        : null;

    return NextResponse.json({
      headerMappings,
      detailMappings,
    });
  } catch (error) {
    console.error("Suggestion failed:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
