// app/api/mapping/detect-granularity/route.ts

import { NextRequest, NextResponse } from "next/server";
import { detectDataGranularity } from "@/lib/ingestion/granularity-detector";

export async function POST(request: NextRequest) {
  try {
    const { columns, sampleData } = await request.json();

    const analysis = detectDataGranularity(columns, sampleData);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Granularity detection failed:", error);
    return NextResponse.json(
      { error: "Failed to detect data structure" },
      { status: 500 }
    );
  }
}
