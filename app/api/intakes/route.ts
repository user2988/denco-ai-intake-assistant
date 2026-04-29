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
  "email", "whatsapp", "sms", "website", "facebook", "manual", "other",
];

// Zapier sends empty strings for unmapped fields — treat them as absent
function clean(val: unknown): string | undefined {
  if (typeof val === "string" && val.trim()) return val.trim();
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    // -- Auth placeholder: check isAuthorized(request) here when ready --

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let raw: any;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const body = raw as Partial<AutomatedIntakeRequest> & {
      body_plain?: string;
      body?: string;
    };

    // Zapier may send the email body under several field names
    const inquiry =
      clean(body.message) ??
      clean(body.rawEmailText) ??
      clean(body.body_plain) ??
      clean(body.body);

    if (!inquiry) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Request must include a non-empty 'message', 'rawEmailText', 'body_plain', or 'body' field.",
        },
        { status: 400 }
      );
    }

    const source: IntakeSource =
      body.source && VALID_SOURCES.includes(body.source) ? body.source : "other";

    const output = await generateIntakeWithClaude({
      inquiry,
      customerName: clean(body.customerName),
      city: clean(body.city),
      preferredTimeline: clean(body.preferredTimeline),
      subject: clean(body.subject),
      source,
    });

    const intake = {
      id: crypto.randomUUID(),
      source,
      customerName: clean(body.customerName) ?? null,
      phone: clean(body.phone) ?? null,
      email: clean(body.email) ?? null,
      city: clean(body.city) ?? null,
      preferredTimeline: clean(body.preferredTimeline) ?? null,
      subject: clean(body.subject) ?? null,
      originalMessage: inquiry,
      createdAt: clean(body.timestamp) ?? new Date().toISOString(),
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
