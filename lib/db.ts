import { neon } from "@neondatabase/serverless";
import { SavedIntake, IntakeSource, UrgencyLevel } from "./types";

// ---------------------------------------------------------------------------
// Table DDL — run once in your Neon SQL editor to create the intakes table:
//
// CREATE TABLE IF NOT EXISTS intakes (
//   id                              text PRIMARY KEY,
//   source                          text,
//   customer_name                   text,
//   customer_email                  text,
//   phone                           text,
//   city                            text,
//   preferred_timeline              text,
//   subject                         text,
//   original_message                text,
//   detected_services               jsonb,
//   urgency_level                   text,
//   internal_job_summary            text,
//   missing_information             jsonb,
//   client_reply_draft              text,
//   crew_notes                      text,
//   follow_up_message               text,
//   recommended_next_action         text,
//   estimated_admin_time_saved_minutes integer,
//   created_at                      timestamptz DEFAULT now()
// );
// ---------------------------------------------------------------------------

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set.");
  return neon(url);
}

export async function saveIntake(
  intake: Omit<SavedIntake, "createdAt">
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO intakes (
      id,
      source,
      customer_name,
      customer_email,
      phone,
      city,
      preferred_timeline,
      subject,
      original_message,
      detected_services,
      urgency_level,
      internal_job_summary,
      missing_information,
      client_reply_draft,
      crew_notes,
      follow_up_message,
      recommended_next_action,
      estimated_admin_time_saved_minutes
    ) VALUES (
      ${intake.id},
      ${intake.source},
      ${intake.customerName ?? null},
      ${intake.customerEmail ?? null},
      ${intake.phone ?? null},
      ${intake.city ?? null},
      ${intake.preferredTimeline ?? null},
      ${intake.subject ?? null},
      ${intake.originalMessage},
      ${JSON.stringify(intake.detectedServices)}::jsonb,
      ${intake.urgencyLevel},
      ${intake.internalJobSummary},
      ${JSON.stringify(intake.missingInformation)}::jsonb,
      ${intake.clientReplyDraft},
      ${intake.crewNotes},
      ${intake.followUpMessage},
      ${intake.recommendedNextAction ?? null},
      ${intake.estimatedAdminTimeSavedMinutes}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSavedIntake(row: any): SavedIntake {
  return {
    id: row.id,
    source: row.source as IntakeSource,
    customerName: row.customer_name ?? null,
    customerEmail: row.customer_email ?? null,
    phone: row.phone ?? null,
    city: row.city ?? null,
    preferredTimeline: row.preferred_timeline ?? null,
    subject: row.subject ?? null,
    originalMessage: row.original_message ?? "",
    detectedServices: Array.isArray(row.detected_services)
      ? row.detected_services
      : [],
    urgencyLevel: row.urgency_level as UrgencyLevel,
    internalJobSummary: row.internal_job_summary ?? "",
    missingInformation: Array.isArray(row.missing_information)
      ? row.missing_information
      : [],
    clientReplyDraft: row.client_reply_draft ?? "",
    crewNotes: row.crew_notes ?? "",
    followUpMessage: row.follow_up_message ?? "",
    recommendedNextAction: row.recommended_next_action ?? null,
    estimatedAdminTimeSavedMinutes:
      row.estimated_admin_time_saved_minutes ?? 0,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function getRecentIntakes(limit = 50): Promise<SavedIntake[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM intakes ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(rowToSavedIntake);
}
