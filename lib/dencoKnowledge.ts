import { SampleInquiry } from "./types";

export const DENCO_SERVICES = [
  "Sod Installation",
  "Deck Staining",
  "Deck Cleaning",
  "Painting",
  "Garden Edging Cleanup",
  "Mulching",
  "Pressure Washing",
  "Spring Cleanup",
  "Fall Leaf Cleanup",
];

export const DENCO_SERVICE_AREAS = [
  "Waterdown",
  "Burlington",
  "Oakville",
  "Hamilton",
  "Carlisle",
  "Freelton",
  "Milton",
  "Aurora",
  "Richmond Hill",
  "Newmarket",
];

export const DENCO_CONTACT = {
  phone: "905-746-8053",
  email: "dencolandscaping@gmail.com",
};

export const SAMPLE_INQUIRIES: SampleInquiry[] = [
  {
    label: "Spring Cleanup",
    customerName: "Sarah M.",
    city: "Burlington",
    preferredTimeline: "Early May",
    inquiry:
      "Hi! We need a spring cleanup done before we have a family event in May. The backyard is a mess after winter — there's dead leaves piled up everywhere, some broken branches, and the garden beds need a good cleanup. We have a medium-sized backyard, probably around 40x50 feet. We also have a front yard that could use some tidying. Can you give us a quote?",
  },
  {
    label: "Sod Installation",
    customerName: "James K.",
    city: "Oakville",
    preferredTimeline: "June",
    inquiry:
      "Hey, we recently had a pool removed and now we have a big patchy dirt area where it used to be. We're hoping to get sod put down so it looks normal again. Not sure of the exact measurements but it's probably like 20x25 feet give or take. Would DenCo handle removing the old debris or do we need to do that first? Also wondering if you supply the sod or if we need to order it ourselves.",
  },
  {
    label: "Pressure Washing",
    customerName: "Linda T.",
    city: "Hamilton",
    inquiry:
      "Hello! I saw you guys on Facebook and wanted to get a quote for pressure washing. The front walkway and driveway are really dirty after winter and the back patio is covered in green algae. The driveway is a double wide and probably 40 feet long. The back patio is maybe 15x20 feet or so. How much would something like this run?",
  },
  {
    label: "Deck Staining",
    customerName: "Mike R.",
    city: "Waterdown",
    preferredTimeline: "Before end of July",
    inquiry:
      "We have a deck that was built about 4 years ago and has never been stained. It's starting to look grey and weathered. The deck is 16x20 feet. We're not sure if it needs cleaning first before staining or if you handle all that. We also have a pergola attached to the deck, maybe 10x10. Do you do both? Looking to get it done before the end of July.",
  },
  {
    label: "Mulching / Garden Edging",
    customerName: "Carol B.",
    city: "Milton",
    inquiry:
      "Hi there, looking to get my garden beds mulched and the edges cleaned up. We have a few beds along the front of the house and one big one in the backyard along the fence. I'd estimate maybe 6-7 garden beds total, some small some bigger. Do you supply the mulch or do I need to buy it? Also I have a gate on the side of the house so crew access should be easy.",
  },
  {
    label: "Fall Leaf Cleanup",
    customerName: "David H.",
    city: "Carlisle",
    preferredTimeline: "Late October / November",
    inquiry:
      "We have a large property with a LOT of trees and leaf cleanup every fall is just brutal. We used to do it ourselves but it takes us two full weekends. Looking to hire someone this year. The property is about 1/3 of an acre. We have a trampoline and a playset in the backyard so the crew would have to work around those. Leaves need to be bagged or hauled away, not just blown into a pile.",
  },
];

export const SYSTEM_PROMPT = `You are an AI intake assistant for DenCo, a landscaping and exterior home services business. Your job is to turn messy customer inquiries into clear admin-ready outputs for quote preparation, client communication, and crew handoff.

DenCo services: sod installation, deck staining, deck cleaning, painting, garden edging cleanup, mulching, pressure washing, spring cleanups, fall leaf cleanup.

DenCo service areas: Waterdown, Burlington, Oakville, Hamilton, Carlisle, Freelton, Milton, Aurora, Richmond Hill, Newmarket.

DenCo contact: 905-746-8053 | dencolandscaping@gmail.com

You must always return a single valid JSON object. No markdown, no explanation, no code blocks — only the raw JSON.

The JSON must match this exact schema:
{
  "detectedServices": ["string"],
  "urgencyLevel": "Low | Medium | High",
  "internalJobSummary": "string",
  "missingInformation": ["string"],
  "clientReplyDraft": "string",
  "crewNotes": "string",
  "followUpMessage": "string",
  "estimatedAdminTimeSavedMinutes": number,
  "recommendedNextAction": "string"
}

Rules:
- Be practical and concise.
- Do not invent prices or quote amounts.
- Do not promise availability or specific dates.
- Ask for photos when scope is unclear or when the job size/condition is hard to assess remotely.
- Ask for address or city if it is missing.
- Ask for measurements (sq ft, linear ft, etc.) when relevant to quoting.
- Ask about gate/access instructions when relevant.
- Ask whether materials (sod, mulch, stain, etc.) are supplied by DenCo or the customer when relevant.
- Keep the client reply friendly, natural, professional, and concise — write it as if a real office manager is responding.
- Keep crew notes short, operational, and bullet-pointed where helpful.
- The followUpMessage should be a short, friendly SMS or email-style nudge if the client hasn't responded in a few days.
- estimatedAdminTimeSavedMinutes should reflect how long a human would realistically take to write all these outputs manually (typically 15-35 minutes for a complete intake).
- recommendedNextAction should be one clear sentence telling the office team what to do next (e.g. "Send client reply and request photos before scheduling a site visit.").
- If the inquiry is very brief or unclear, still produce all fields and use missingInformation to flag what is needed.
- Urgency: High = client has a hard deadline or event soon; Medium = prefers a timeframe but flexible; Low = no timeline mentioned.`;
