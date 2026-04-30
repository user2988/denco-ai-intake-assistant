import { NextRequest, NextResponse } from "next/server";
import { saveIntake } from "@/lib/db";
import { IntakeFormData, IntakeOutput, IntakeSource } from "@/lib/types";

// Called by the frontend "Save Intake" button to persist a manually generated intake to Neon.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      id: string;
      form: IntakeFormData;
      output: IntakeOutput;
    };

    if (!body.id || !body.form || !body.output) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, form, output." },
        { status: 400 }
      );
    }

    await saveIntake({
      id: body.id,
      source: (body.form.channel as unknown as IntakeSource) ?? "manual",
      customerName: body.form.customerName || null,
      customerEmail: null,
      phone: null,
      city: body.form.city || null,
      preferredTimeline: body.form.preferredTimeline || null,
      subject: null,
      originalMessage: body.form.inquiry,
      detectedServices: body.output.detectedServices,
      urgencyLevel: body.output.urgencyLevel,
      internalJobSummary: body.output.internalJobSummary,
      missingInformation: body.output.missingInformation,
      clientReplyDraft: body.output.clientReplyDraft,
      crewNotes: body.output.crewNotes,
      followUpMessage: body.output.followUpMessage,
      recommendedNextAction: body.output.recommendedNextAction ?? null,
      estimatedAdminTimeSavedMinutes: body.output.estimatedAdminTimeSavedMinutes,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST /api/save-intake error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save intake.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
