import { NextRequest, NextResponse } from "next/server";
import { generateIntakeWithClaude } from "@/lib/generateIntake";
import { AutomatedIntakeRequest, IntakeSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Authentication placeholder
// To add API key protection, uncomment and set INTAKE_API_KEY in your env:
//
// const VALID_API_KEY = process.env.INTAKE_API_KEY;
//
// function isAuthorized(request: NextRequest): boolean {
//   const key = request.headers.get("x-api-key");
//   return !!VALID_API_KEY && key === VALID_API_KEY;
// }
// ---------------------------------------------------------------------------

const VALID_SOURCES: IntakeSource[] = [
  "email",
  "whatsapp",
  "sms",
  "website",
  "facebook",
  "manual",
  "other",
];

export async function POST(request: NextRequest) {
  try {
    // -- Auth placeholder: check isAuthorized(request) here when ready --

    let body: Partial<AutomatedIntakeRequest>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    // Resolve the inquiry text — prefer message, fall back to rawEmailText
    const inquiry = (body.message || body.rawEmailText || "").trim();
    if (!inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: "Request must include a non-empty 'message' or 'rawEmailText' field.",
        },
        { status: 400 }
      );
    }

    // Normalize source
    const source: IntakeSource =
      body.source && VALID_SOURCES.includes(body.source) ? body.source : "other";

    const output = await generateIntakeWithClaude({
      inquiry,
      customerName: body.customerName,
      city: body.city,
      preferredTimeline: body.preferredTimeline,
      subject: body.subject,
      source,
    });

    const intake = {
      id: crypto.randomUUID(),
      source,
      customerName: body.customerName ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      city: body.city ?? null,
      preferredTimeline: body.preferredTimeline ?? null,
      subject: body.subject ?? null,
      originalMessage: inquiry,
      createdAt: body.timestamp ?? new Date().toISOString(),
      ...output,
    };

    return NextResponse.json({ success: true, intake });
  } catch (error: unknown) {
    console.error("Intakes API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
