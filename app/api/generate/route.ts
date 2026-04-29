import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/dencoKnowledge";
import { IntakeOutput } from "@/lib/types";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, city, inquiry, preferredTimeline } = body;

    if (!inquiry || typeof inquiry !== "string" || inquiry.trim().length === 0) {
      return NextResponse.json(
        { error: "Customer inquiry is required." },
        { status: 400 }
      );
    }

    const userMessage = buildUserMessage({
      customerName,
      city,
      inquiry,
      preferredTimeline,
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude." },
        { status: 500 }
      );
    }

    let parsed: IntakeOutput;
    try {
      const rawText = textBlock.text.trim();
      const jsonText = rawText.startsWith("```")
        ? rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
        : rawText;
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse Claude response as JSON." },
        { status: 500 }
      );
    }

    return NextResponse.json({ output: parsed });
  } catch (error: unknown) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildUserMessage({
  customerName,
  city,
  inquiry,
  preferredTimeline,
}: {
  customerName?: string;
  city?: string;
  inquiry: string;
  preferredTimeline?: string;
}) {
  const parts: string[] = [];

  if (customerName) parts.push(`Customer Name: ${customerName}`);
  if (city) parts.push(`City: ${city}`);
  if (preferredTimeline) parts.push(`Preferred Timeline: ${preferredTimeline}`);

  parts.push(`\nCustomer Inquiry:\n${inquiry}`);

  return parts.join("\n");
}
