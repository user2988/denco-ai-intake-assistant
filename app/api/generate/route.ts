import { NextRequest, NextResponse } from "next/server";
import { generateIntakeWithClaude } from "@/lib/generateIntake";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, city, inquiry, preferredTimeline, channel } = body;

    if (!inquiry || typeof inquiry !== "string" || inquiry.trim().length === 0) {
      return NextResponse.json(
        { error: "Customer inquiry is required." },
        { status: 400 }
      );
    }

    const output = await generateIntakeWithClaude({
      inquiry: inquiry.trim(),
      customerName,
      city,
      preferredTimeline,
      source: channel,
    });

    return NextResponse.json({ output });
  } catch (error: unknown) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
