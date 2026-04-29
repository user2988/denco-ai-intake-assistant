import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./dencoKnowledge";
import { IntakeOutput } from "./types";

const client = new Anthropic();

export interface ClaudeIntakeInput {
  inquiry: string;
  customerName?: string;
  city?: string;
  preferredTimeline?: string;
  subject?: string;
  source?: string;
}

export async function generateIntakeWithClaude(
  input: ClaudeIntakeInput
): Promise<IntakeOutput> {
  const userMessage = buildUserMessage(input);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude.");
  }

  const rawText = textBlock.text.trim();
  const jsonText = rawText.startsWith("```")
    ? rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    : rawText;

  let parsed: IntakeOutput;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Failed to parse Claude response as JSON.");
  }

  const validationError = validateIntakeOutput(parsed);
  if (validationError) {
    throw new Error(validationError);
  }

  return parsed;
}

function buildUserMessage(input: ClaudeIntakeInput): string {
  const parts: string[] = [];

  if (input.source) parts.push(`Source Channel: ${input.source}`);
  if (input.customerName) parts.push(`Customer Name: ${input.customerName}`);
  if (input.city) parts.push(`City: ${input.city}`);
  if (input.preferredTimeline) parts.push(`Preferred Timeline: ${input.preferredTimeline}`);
  if (input.subject) parts.push(`Subject: ${input.subject}`);

  parts.push(`\nCustomer Inquiry:\n${input.inquiry}`);

  return parts.join("\n");
}

export function validateIntakeOutput(data: unknown): string | null {
  if (!data || typeof data !== "object") return "Response is not an object.";
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.detectedServices)) return "Missing detectedServices array.";
  if (!["Low", "Medium", "High"].includes(d.urgencyLevel as string))
    return "Invalid urgencyLevel value.";
  if (typeof d.internalJobSummary !== "string") return "Missing internalJobSummary.";
  if (!Array.isArray(d.missingInformation)) return "Missing missingInformation array.";
  if (typeof d.clientReplyDraft !== "string") return "Missing clientReplyDraft.";
  if (typeof d.crewNotes !== "string") return "Missing crewNotes.";
  if (typeof d.followUpMessage !== "string") return "Missing followUpMessage.";
  if (typeof d.estimatedAdminTimeSavedMinutes !== "number")
    return "Missing estimatedAdminTimeSavedMinutes.";
  return null;
}
