import { NextRequest, NextResponse } from "next/server";
import { generateIntakeWithClaude } from "@/lib/generateIntake";
import { saveIntake, getRecentIntakes } from "@/lib/db";
import { AutomatedIntakeRequest, IntakeSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Optional Zapier / automation secret — protects this endpoint from
// unauthenticated callers.  Set AUTOMATION_API_KEY in your Vercel environment
// variables, then configure Zapier to send:
//   Header: X-Automation-Key: <your-value>
// If the variable is not set the check is skipped (safe for local dev).
// ---------------------------------------------------------------------------
function isAuthorized(request: NextRequest): boolean {
  const requiredKey = process.env.AUTOMATION_API_KEY;
  if (!requiredKey) return true; // not enforced when key is absent
  const provided = request.headers.get("x-automation-key");
  return provided === requiredKey;
}

const VALID_SOURCES: IntakeSource[] = [
  "email", "whatsapp", "sms", "website", "facebook", "manual", "other",
];

// Zapier sends empty strings for unmapped fields — treat them as absent
function clean(val: unknown): string | undefined {
  if (typeof val === "string" && val.trim()) return val.trim();
  return undefined;
}

// ---------------------------------------------------------------------------
// GET /api/intakes — return recent intakes for the dashboard
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const intakes = await getRecentIntakes(50);
    return NextResponse.json({ success: true, intakes });
  } catch (error: unknown) {
    console.error("GET /api/intakes error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/intakes — called by Zapier; generates intake and saves to DB
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

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
      customerEmail: clean(body.email) ?? null,
      phone: clean(body.phone) ?? null,
      city: clean(body.city) ?? null,
      preferredTimeline: clean(body.preferredTimeline) ?? null,
      subject: clean(body.subject) ?? null,
      originalMessage: inquiry,
      ...output,
      recommendedNextAction: output.recommendedNextAction ?? null,
    };

    // Persist to Neon — non-fatal if DB is unavailable so Zapier still gets a response
    try {
      await saveIntake(intake);
    } catch (dbErr) {
      console.error("DB save failed (intake still returned to Zapier):", dbErr);
    }

    return NextResponse.json({ success: true, intake });
  } catch (error: unknown) {
    console.error("POST /api/intakes error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
