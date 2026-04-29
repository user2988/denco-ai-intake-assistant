export type UrgencyLevel = "Low" | "Medium" | "High";

export interface IntakeOutput {
  detectedServices: string[];
  urgencyLevel: UrgencyLevel;
  internalJobSummary: string;
  missingInformation: string[];
  clientReplyDraft: string;
  crewNotes: string;
  followUpMessage: string;
  estimatedAdminTimeSavedMinutes: number;
}

export interface IntakeRecord {
  id: string;
  createdAt: string;
  customerName: string;
  city: string;
  inquiry: string;
  preferredTimeline: string;
  output: IntakeOutput;
}

export interface IntakeFormData {
  customerName: string;
  city: string;
  inquiry: string;
  preferredTimeline: string;
}

export interface SampleInquiry {
  label: string;
  inquiry: string;
  customerName?: string;
  city?: string;
  preferredTimeline?: string;
}
