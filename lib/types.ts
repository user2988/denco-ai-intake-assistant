export type UrgencyLevel = "Low" | "Medium" | "High";

export type InputChannel = "whatsapp" | "sms" | "email" | "facebook" | "phone";

export interface IntakeOutput {
  detectedServices: string[];
  urgencyLevel: UrgencyLevel;
  internalJobSummary: string;
  missingInformation: string[];
  clientReplyDraft: string;
  crewNotes: string;
  followUpMessage: string;
  estimatedAdminTimeSavedMinutes: number;
  recommendedNextAction?: string;
}

export type IntakeSource = "email" | "whatsapp" | "sms" | "website" | "facebook" | "manual" | "other";

export interface AutomatedIntakeRequest {
  source: IntakeSource;
  customerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  preferredTimeline?: string;
  subject?: string;
  message?: string;
  rawEmailText?: string;
  timestamp?: string;
}

export interface IntakeRecord {
  id: string;
  createdAt: string;
  customerName: string;
  city: string;
  inquiry: string;
  preferredTimeline: string;
  channel: InputChannel;
  output: IntakeOutput;
}

export interface IntakeFormData {
  customerName: string;
  city: string;
  inquiry: string;
  preferredTimeline: string;
  channel: InputChannel;
}

export interface SampleInquiry {
  label: string;
  inquiry: string;
  customerName?: string;
  city?: string;
  preferredTimeline?: string;
}

/** A full intake record as stored in and returned from Neon. */
export interface SavedIntake {
  id: string;
  source: IntakeSource;
  customerName: string | null;
  customerEmail: string | null;
  phone: string | null;
  city: string | null;
  preferredTimeline: string | null;
  subject: string | null;
  originalMessage: string;
  detectedServices: string[];
  urgencyLevel: UrgencyLevel;
  internalJobSummary: string;
  missingInformation: string[];
  clientReplyDraft: string;
  crewNotes: string;
  followUpMessage: string;
  recommendedNextAction: string | null;
  estimatedAdminTimeSavedMinutes: number;
  createdAt: string;
}
