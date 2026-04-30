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
- **Neon Postgres** (persistent intake storage via `@neondatabase/serverless`)
- **localStorage** (client-side fallback for manual intakes)

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
DATABASE_URL=your_neon_database_url_here
AUTOMATION_API_KEY=your_secret_key_here   # optional — leave blank to skip auth locally
```

- **ANTHROPIC_API_KEY** — from [console.anthropic.com](https://console.anthropic.com)
- **DATABASE_URL** — Neon connection string from [console.neon.tech](https://console.neon.tech) (format: `postgresql://user:password@host/dbname?sslmode=require`)
- **AUTOMATION_API_KEY** — optional secret that protects `POST /api/intakes` from unauthenticated callers

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
│   │   ├── intakes/
│   │   │   └── route.ts        # POST: Zapier/email pipeline → Claude → Neon
│   │   │                       # GET:  Returns recent intakes for the dashboard
│   │   └── save-intake/
│   │       └── route.ts        # Saves a manually generated intake to Neon
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main app UI
├── components/
│   ├── AutomatedInbox.tsx      # DB-backed intake inbox with metrics + copy buttons
│   ├── OutputCard.tsx          # Reusable output section card
│   ├── IntakeDashboard.tsx     # localStorage fallback history
│   ├── PipelineBanner.tsx      # Visual pipeline diagram
│   └── MessageBubble.tsx       # Channel-styled message preview
├── lib/
│   ├── db.ts                   # Neon client, saveIntake(), getRecentIntakes()
│   ├── generateIntake.ts       # Shared Claude call + validation helper
│   ├── dencoKnowledge.ts       # Business context, sample inquiries, system prompt
│   └── types.ts                # TypeScript interfaces (incl. SavedIntake)
├── .env.example
└── README.md
```

---

## Zapier Email Automation Demo

### What it is

`POST /api/intakes` accepts customer inquiries from Zapier (or any HTTP tool) and returns a fully structured AI intake. In the live demo, a customer email triggers Zapier → Zapier calls this endpoint → Claude processes the inquiry and returns quote prep, a client reply draft, crew notes, and more.

### Endpoint

```
POST https://YOUR-VERCEL-APP.vercel.app/api/intakes
Content-Type: application/json
```

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `source` | string | No | `email`, `whatsapp`, `sms`, `website`, `facebook`, `manual`, `other` |
| `message` | string | Yes* | The customer's message |
| `rawEmailText` | string | Yes* | Alias — used if `message` is absent |
| `body_plain` | string | Yes* | Alias — Zapier's default email body field |
| `body` | string | Yes* | Alias — fallback |
| `customerName` | string | No | Customer's full name |
| `email` | string | No | Customer's email address |
| `phone` | string | No | Customer's phone number |
| `city` | string | No | City or service area |
| `preferredTimeline` | string | No | When they want the work done |
| `subject` | string | No | Email subject line |
| `timestamp` | string | No | ISO 8601 timestamp of the original message |

\* At least one message field is required. Empty strings are treated as absent (Zapier-safe).

### Zapier setup

**Step 1 — Trigger: Gmail**
- App: Gmail
- Event: **New Email Matching Search** (or New Email)
- Search filter:
  ```
  to:dencolandscaping@gmail.com subject:(quote OR estimate OR cleanup OR landscaping)
  ```

**Step 2 — Action: Webhooks by Zapier**
- App: Webhooks by Zapier
- Event: **Custom Request**
- Method: `POST`
- URL: `https://YOUR-VERCEL-APP.vercel.app/api/intakes`
- Data Pass-Through: `false`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
    "source": "email",
    "customerName": "{{From Name}}",
    "email": "{{From Email}}",
    "subject": "{{Subject}}",
    "message": "{{Body Plain}}",
    "timestamp": "{{Date}}"
  }
  ```

**Step 3 — Optional next steps**
- **Google Sheets** — log each intake row automatically
- **Gmail** — create a draft reply using `clientReplyDraft` for owner approval
- **Email / Slack** — notify the DenCo team of a new high-urgency lead
- **CRM** — create a new contact or deal record

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
  "error": "Request must include a non-empty 'message', 'rawEmailText', 'body_plain', or 'body' field."
}
```

### Example curl

```bash
curl -X POST https://YOUR-VERCEL-APP.vercel.app/api/intakes \
  -H "Content-Type: application/json" \
  -d '{
    "source": "email",
    "customerName": "Sarah Johnson",
    "email": "sarah@example.com",
    "city": "Burlington",
    "subject": "Backyard cleanup and mulch quote",
    "message": "Hi, my backyard needs a cleanup. There are leaves everywhere, the garden beds are overgrown, and I might want mulch too. Can someone come this week?"
  }'
```

### Automated Intake Inbox (dashboard)

Every intake created via `POST /api/intakes` is saved to Neon and automatically appears in the **Automated Intake Inbox** section of the web dashboard. The dashboard fetches `GET /api/intakes` on load and can be refreshed at any time with the **Refresh Intakes** button.

Manually generated intakes (via the web form) are also saved to the same database when the user clicks **Save Intake**, so all intakes are visible in one place.

Zapier can still use `clientReplyDraft` from the API response to create a Gmail draft — the dashboard display and the Zapier draft flow are fully independent.

### Authentication

If `AUTOMATION_API_KEY` is set as an environment variable, `POST /api/intakes` requires every request to include:

```
X-Automation-Key: <your-value>
```

In Zapier, add this as a custom header in the Webhooks action. If the variable is not set, the check is skipped (safe for local development).

---

## Security

The Anthropic API key is **never exposed to the browser**. All Claude calls are made server-side via `app/api/generate/route.ts`. The client only calls `/api/generate`, which is a Next.js API route running on the server.

---

## Deploy to Vercel

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. In the Vercel project settings, add these environment variables:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `DATABASE_URL` — your Neon Postgres connection string
   - `AUTOMATION_API_KEY` — (optional) secret header value for Zapier protection
4. Deploy — Vercel handles the rest

### Create the Neon table

Before deploying, run the following SQL once in your [Neon SQL editor](https://console.neon.tech):

```sql
CREATE TABLE IF NOT EXISTS intakes (
  id                                text PRIMARY KEY,
  source                            text,
  customer_name                     text,
  customer_email                    text,
  phone                             text,
  city                              text,
  preferred_timeline                text,
  subject                           text,
  original_message                  text,
  detected_services                 jsonb,
  urgency_level                     text,
  internal_job_summary              text,
  missing_information               jsonb,
  client_reply_draft                text,
  crew_notes                        text,
  follow_up_message                 text,
  recommended_next_action           text,
  estimated_admin_time_saved_minutes integer,
  created_at                        timestamptz DEFAULT now()
);
```

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
