# DenCo AI Intake Assistant

A polished internal web tool that transforms messy landscaping customer inquiries into structured admin-ready outputs: quote prep, client communication drafts, and crew handoff notes — powered by Claude AI.

Built to demonstrate practical AI workflow automation for a service business.

---

## What It Does

When a customer sends an email, text, or leaves a voicemail inquiry, a staff member pastes it into the tool. In seconds, Claude returns:

| Output | Description |
|---|---|
| **Detected Services** | Which DenCo services the customer is asking about |
| **Urgency Level** | High / Medium / Low based on timeline cues |
| **Internal Job Summary** | Clean, scannable summary for the office team |
| **Missing Information** | Checklist of what to ask the customer before quoting |
| **Client Reply Draft** | Ready-to-send professional response |
| **Crew / Job Notes** | Short operational notes for the field team |
| **Follow-Up Message** | SMS or email nudge if the client goes quiet |
| **Admin Time Saved** | Estimated minutes of manual work automated |

The mini dashboard tracks total intakes, cumulative admin time saved, and the most frequently requested service — turning a single AI tool into a lightweight process improvement report.

---

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Anthropic Claude API** (`claude-sonnet-4-6`)
- **Local Storage** (no database required)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/user2988/denco-ai-intake-assistant.git
cd denco-ai-intake-assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and add your Anthropic API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key at [console.anthropic.com](https://console.anthropic.com).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
denco-ai-intake-assistant/
├── app/
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts        # Manual web form → Claude (used by frontend)
│   │   └── intakes/
│   │       └── route.ts        # Automated pipeline endpoint (used by n8n)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main app UI
├── components/
│   ├── OutputCard.tsx          # Reusable output section card
│   ├── IntakeDashboard.tsx     # Intake history & metrics
│   ├── PipelineBanner.tsx      # Visual pipeline diagram
│   └── MessageBubble.tsx       # Channel-styled message preview
├── lib/
│   ├── generateIntake.ts       # Shared Claude call + validation helper
│   ├── dencoKnowledge.ts       # Business context, sample inquiries, system prompt
│   └── types.ts                # TypeScript interfaces
├── .env.example
└── README.md
```

---

## Automated Intake API for n8n

### What it is

`POST /api/intakes` lets n8n, Make, Zapier, or any automation tool send customer inquiries directly into the DenCo AI Intake Assistant. It accepts email, WhatsApp, SMS, website form, Facebook, or manual payloads and returns a fully structured intake ready for the next step in your workflow.

### Endpoint

```
POST https://YOUR-VERCEL-URL/api/intakes
Content-Type: application/json
```

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `source` | string | No | `email`, `whatsapp`, `sms`, `website`, `facebook`, `manual`, `other` |
| `message` | string | Yes* | The customer's message |
| `rawEmailText` | string | Yes* | Raw email body — used if `message` is absent |
| `customerName` | string | No | Customer's full name |
| `email` | string | No | Customer's email address |
| `phone` | string | No | Customer's phone number |
| `city` | string | No | City or service area |
| `preferredTimeline` | string | No | When they want the work done |
| `subject` | string | No | Email subject line or message title |
| `timestamp` | string | No | ISO 8601 timestamp of the original message |

\* At least one of `message` or `rawEmailText` is required.

### Example request — email via n8n

```json
{
  "source": "email",
  "customerName": "Sarah Johnson",
  "email": "sarah@example.com",
  "city": "Burlington",
  "subject": "Backyard cleanup and mulch quote",
  "message": "Hi, my backyard needs a cleanup. There are leaves everywhere, the garden beds are overgrown, and I might want mulch too. Can someone come this week?",
  "timestamp": "2026-04-29T14:30:00Z"
}
```

### Example response

```json
{
  "success": true,
  "intake": {
    "id": "uuid",
    "source": "email",
    "customerName": "Sarah Johnson",
    "email": "sarah@example.com",
    "city": "Burlington",
    "subject": "Backyard cleanup and mulch quote",
    "originalMessage": "Hi, my backyard needs a cleanup...",
    "createdAt": "2026-04-29T14:30:00Z",
    "detectedServices": ["Spring Cleanup", "Mulching", "Garden Edging Cleanup"],
    "urgencyLevel": "High",
    "internalJobSummary": "...",
    "missingInformation": ["..."],
    "clientReplyDraft": "...",
    "crewNotes": "...",
    "followUpMessage": "...",
    "estimatedAdminTimeSavedMinutes": 25,
    "recommendedNextAction": "Send client reply and request photos before scheduling a site visit."
  }
}
```

### Error response

```json
{
  "success": false,
  "error": "Request must include a non-empty 'message' or 'rawEmailText' field."
}
```

### n8n workflow setup

```
Gmail Trigger  (or IMAP Email Trigger)
       ↓
Set node  →  map sender name, email, subject, body, timestamp
       ↓
HTTP Request node
  Method: POST
  URL: https://YOUR-VERCEL-URL/api/intakes
  Body (JSON):
    source: "email"
    customerName: {{ $json.from.name }}
    email: {{ $json.from.email }}
    subject: {{ $json.subject }}
    message: {{ $json.text }}
    timestamp: {{ $json.date }}
       ↓
Receive structured intake JSON
       ↓
Optional: Google Sheets node to log the intake
Optional: Gmail node to send clientReplyDraft for human approval
Optional: Slack node to notify the team
```

### Example curl

```bash
curl -X POST https://YOUR-VERCEL-URL/api/intakes \
  -H "Content-Type: application/json" \
  -d '{
    "source": "email",
    "customerName": "Sarah Johnson",
    "email": "sarah@example.com",
    "city": "Burlington",
    "subject": "Backyard cleanup quote",
    "message": "Hi, I need a spring cleanup and possibly some mulching. Can you quote?"
  }'
```

### Adding authentication

The endpoint is currently open. To add API key protection, see the comment in `app/api/intakes/route.ts` — it shows exactly where to add header-based auth with an `INTAKE_API_KEY` environment variable.

---

## Security

The Anthropic API key is **never exposed to the browser**. All Claude calls are made server-side via `app/api/generate/route.ts`. The client only calls `/api/generate`, which is a Next.js API route running on the server.

---

## Deploy to Vercel

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. In the Vercel project settings, add the environment variable:
   - `ANTHROPIC_API_KEY` = your API key
4. Deploy — Vercel handles the rest

---

## What This Demonstrates

This project was built to show three things:

1. **Business bottleneck identification** — Customer intake at a landscaping company is repetitive, inconsistent, and time-consuming. Every inquiry requires reading, classifying, drafting a reply, and creating notes — the same mental effort, every time.

2. **Practical AI automation** — Using Claude as a structured reasoning engine (not a chatbot), the tool eliminates the manual work while improving consistency and completeness.

3. **Usability for non-technical staff** — The UI is designed for an office manager or field coordinator, not a developer. Inputs are simple, outputs are clearly labeled, copy buttons reduce friction, and saved history gives the team a lightweight reporting view.

---

## DenCo Landscaping

📍 Serving Waterdown, Burlington, Oakville, Hamilton, Carlisle, Freelton, Milton, Aurora, Richmond Hill, and Newmarket.

📞 905-746-8053 · dencolandscaping@gmail.com
