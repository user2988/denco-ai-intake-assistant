"use client";

import { useState, useEffect, useCallback } from "react";
import OutputCard from "@/components/OutputCard";
import IntakeDashboard from "@/components/IntakeDashboard";
import AutomatedInbox from "@/components/AutomatedInbox";
import PipelineBanner from "@/components/PipelineBanner";
import MessageBubble from "@/components/MessageBubble";
import {
  InputChannel,
  IntakeFormData,
  IntakeOutput,
  IntakeRecord,
  SavedIntake,
} from "@/lib/types";
import { SAMPLE_INQUIRIES } from "@/lib/dencoKnowledge";

const STORAGE_KEY = "denco_intakes";

const urgencyConfig: Record<string, { label: string; classes: string; dot: string }> = {
  High:   { label: "High",   classes: "bg-red-100 text-red-700 border-red-200",     dot: "bg-red-500" },
  Medium: { label: "Medium", classes: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Low:    { label: "Low",    classes: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
};

const channelOptions: { value: InputChannel; label: string; icon: string }[] = [
  { value: "sms",      label: "Text",        icon: "💬" },
  { value: "whatsapp", label: "WhatsApp",    icon: "🟢" },
  { value: "email",    label: "Email",       icon: "📧" },
  { value: "facebook", label: "Facebook",    icon: "📘" },
  { value: "phone",    label: "Phone Note",  icon: "📞" },
];

const channelLabels: Record<InputChannel, string> = {
  sms:      "Text Message",
  whatsapp: "WhatsApp",
  email:    "Email",
  facebook: "Facebook Messenger",
  phone:    "Phone Note",
};

function buildFullHandoff(form: IntakeFormData, output: IntakeOutput): string {
  return [
    "═══════════════════════════════════════",
    "  DENCO AI INTAKE SUMMARY",
    "═══════════════════════════════════════",
    "",
    `Customer: ${form.customerName || "—"}`,
    `City: ${form.city || "—"}`,
    `Channel: ${channelLabels[form.channel]}`,
    `Timeline: ${form.preferredTimeline || "—"}`,
    "",
    "─── DETECTED SERVICES ───",
    output.detectedServices.join(", "),
    "",
    `─── URGENCY: ${output.urgencyLevel} ───`,
    "",
    "─── INTERNAL JOB SUMMARY ───",
    output.internalJobSummary,
    "",
    "─── MISSING INFORMATION ───",
    output.missingInformation.map((item) => `• ${item}`).join("\n"),
    "",
    "─── CLIENT REPLY DRAFT ───",
    output.clientReplyDraft,
    "",
    "─── CREW / JOB NOTES ───",
    output.crewNotes,
    "",
    "─── FOLLOW-UP MESSAGE ───",
    output.followUpMessage,
    "",
    `─── EST. ADMIN TIME SAVED: ${output.estimatedAdminTimeSavedMinutes} minutes ───`,
    "",
    "═══════════════════════════════════════",
  ].join("\n");
}

export default function Home() {
  const [form, setForm] = useState<IntakeFormData>({
    customerName: "",
    city: "",
    inquiry: "",
    preferredTimeline: "",
    channel: "sms",
  });
  const [output, setOutput] = useState<IntakeOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // localStorage-backed records (fallback / legacy)
  const [savedRecords, setSavedRecords] = useState<IntakeRecord[]>([]);

  // DB-backed intakes
  const [dbIntakes, setDbIntakes] = useState<SavedIntake[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  const [justSaved, setJustSaved] = useState(false);
  const [fullHandoffCopied, setFullHandoffCopied] = useState(false);
  const [currentForm, setCurrentForm] = useState<IntakeFormData | null>(null);

  // Load localStorage records on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedRecords(JSON.parse(stored));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Fetch intakes from Neon via GET /api/intakes
  const fetchDbIntakes = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await fetch("/api/intakes");
      const data = await res.json();
      if (data.success && Array.isArray(data.intakes)) {
        setDbIntakes(data.intakes);
      }
    } catch {
      // silently fail — DB may not be configured in local dev
    } finally {
      setDbLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchDbIntakes();
  }, [fetchDbIntakes]);

  const persistRecords = useCallback((records: IntakeRecord[]) => {
    setSavedRecords(records);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.inquiry.trim()) return;

    setLoading(true);
    setError(null);
    setOutput(null);
    setJustSaved(false);
    setCurrentForm({ ...form });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setOutput(data.output);
      window.scrollTo({ top: document.getElementById("output-section")?.offsetTop ?? 0, behavior: "smooth" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSample = (index: number) => {
    const sample = SAMPLE_INQUIRIES[index];
    setForm((f) => ({
      customerName: sample.customerName ?? "",
      city: sample.city ?? "",
      inquiry: sample.inquiry,
      preferredTimeline: sample.preferredTimeline ?? "",
      channel: f.channel,
    }));
    setOutput(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveIntake = async () => {
    if (!output || !currentForm) return;

    const id = crypto.randomUUID();

    // Always save to localStorage as fallback
    const record: IntakeRecord = {
      id,
      createdAt: new Date().toISOString(),
      customerName: currentForm.customerName,
      city: currentForm.city,
      inquiry: currentForm.inquiry,
      preferredTimeline: currentForm.preferredTimeline,
      channel: currentForm.channel,
      output,
    };
    persistRecords([...savedRecords, record]);
    setJustSaved(true);

    // Also save to Neon (server-side; DATABASE_URL never leaves the server)
    try {
      await fetch("/api/save-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, form: currentForm, output }),
      });
      // Refresh the inbox so the new record appears immediately
      fetchDbIntakes();
    } catch {
      // Non-fatal — localStorage already captured it
    }
  };

  const handleClearAll = () => persistRecords([]);

  const handleLoadRecord = (record: IntakeRecord) => {
    const loaded: IntakeFormData = {
      customerName: record.customerName,
      city: record.city,
      inquiry: record.inquiry,
      preferredTimeline: record.preferredTimeline,
      channel: record.channel ?? "sms",
    };
    setForm(loaded);
    setOutput(record.output);
    setCurrentForm(loaded);
    setJustSaved(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyFullHandoff = async () => {
    if (!output || !currentForm) return;
    await navigator.clipboard.writeText(buildFullHandoff(currentForm, output));
    setFullHandoffCopied(true);
    setTimeout(() => setFullHandoffCopied(false), 2500);
  };

  const urgency = output ? urgencyConfig[output.urgencyLevel] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-lg">🌿</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              DenCo AI Intake Assistant
            </h1>
            <p className="text-xs text-gray-500 leading-tight hidden sm:block">
              Turn messy landscaping inquiries into quote prep, client replies, and crew handoffs.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Pipeline banner */}
        <PipelineBanner />

        <div className="lg:grid lg:grid-cols-[420px_1fr] lg:gap-8 xl:grid-cols-[460px_1fr]">

          {/* Left panel: Input */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-5">

            {/* Sample inquiries */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Try a sample inquiry
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_INQUIRIES.map((sample, i) => (
                  <button
                    key={sample.label}
                    onClick={() => handleSample(i)}
                    className="text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">New Intake</h2>
                <p className="text-xs text-gray-400 mt-0.5">Select the channel and paste the customer message</p>
              </div>

              <div className="px-5 py-4 space-y-4">

                {/* Channel selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Incoming Channel
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {channelOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, channel: opt.value }))}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          form.channel === opt.value
                            ? "bg-green-600 text-white border-green-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
                        }`}
                      >
                        <span>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Customer Name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      placeholder="e.g. Sarah M."
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      City <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Burlington"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Message preview or textarea */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Customer Message <span className="text-red-500">*</span>
                  </label>
                  {form.inquiry.trim() ? (
                    <div className="space-y-2">
                      <MessageBubble
                        channel={form.channel}
                        customerName={form.customerName}
                        inquiry={form.inquiry}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, inquiry: "" }))}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ✕ Clear message
                      </button>
                    </div>
                  ) : (
                    <textarea
                      value={form.inquiry}
                      onChange={(e) => setForm((f) => ({ ...f, inquiry: e.target.value }))}
                      placeholder={`Paste the customer's ${channelLabels[form.channel].toLowerCase()} here...`}
                      rows={7}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none leading-relaxed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preferred Timeline <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.preferredTimeline}
                    onChange={(e) => setForm((f) => ({ ...f, preferredTimeline: e.target.value }))}
                    placeholder="e.g. Before end of May, ASAP, No rush"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  type="submit"
                  disabled={loading || !form.inquiry.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Generating Intake…
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      Generate Intake Summary
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
              </div>
            </form>

            {/* DenCo info card */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800">
              <p className="font-semibold mb-1">DenCo Landscaping</p>
              <p>📍 Waterdown · Burlington · Oakville · Hamilton and surrounding areas</p>
              <p className="mt-1">📞 905-746-8053 · dencolandscaping@gmail.com</p>
            </div>
          </div>

          {/* Right panel: Output */}
          <div id="output-section" className="mt-8 lg:mt-0">
            {!output && !loading && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">🌱</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to process an inquiry</h3>
                <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                  Select a channel, paste a customer message, or pick a sample inquiry.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-500 font-medium">Processing inquiry with Claude…</p>
                <p className="text-xs text-gray-400 mt-1">Typically takes 5–10 seconds</p>
              </div>
            )}

            {output && currentForm && (
              <div className="space-y-4">
                {/* Output header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {currentForm.customerName ? `Intake — ${currentForm.customerName}` : "Intake Summary"}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {currentForm.city && (
                        <span className="text-sm text-gray-500">{currentForm.city}</span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                        via {channelLabels[currentForm.channel]}
                      </span>
                    </div>
                  </div>
                  {urgency && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${urgency.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                      {urgency.label} Urgency
                    </span>
                  )}
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <OutputCard
                    title="Detected Services"
                    icon="🔍"
                    accentColor="green"
                    copyText={output.detectedServices.join(", ")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {output.detectedServices.map((s) => (
                        <span key={s} className="bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </OutputCard>

                  <OutputCard
                    title="Urgency Level"
                    icon="🕐"
                    accentColor={output.urgencyLevel === "High" ? "red" : output.urgencyLevel === "Medium" ? "amber" : "green"}
                    copyText={output.urgencyLevel}
                  >
                    <div className="flex items-center gap-2">
                      {urgency && (
                        <>
                          <span className={`w-2.5 h-2.5 rounded-full ${urgency.dot}`} />
                          <span className="font-semibold">{output.urgencyLevel}</span>
                        </>
                      )}
                      {output.urgencyLevel === "High" && <span className="text-xs text-red-600 ml-1">— Client has a hard deadline</span>}
                      {output.urgencyLevel === "Medium" && <span className="text-xs text-amber-600 ml-1">— Has a preferred timeframe</span>}
                      {output.urgencyLevel === "Low" && <span className="text-xs text-green-600 ml-1">— No specific deadline</span>}
                    </div>
                  </OutputCard>

                  <OutputCard
                    title="Internal Job Summary"
                    icon="📋"
                    accentColor="blue"
                    copyText={output.internalJobSummary}
                  >
                    <p className="whitespace-pre-wrap">{output.internalJobSummary}</p>
                  </OutputCard>

                  <OutputCard
                    title="Missing Information"
                    icon="❓"
                    accentColor="amber"
                    copyText={output.missingInformation.map((i) => `• ${i}`).join("\n")}
                  >
                    {output.missingInformation.length === 0 ? (
                      <p className="text-gray-400 italic">No critical information missing.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {output.missingInformation.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-500 shrink-0">⚠</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </OutputCard>

                  <OutputCard
                    title="Client Reply Draft"
                    icon="✉️"
                    accentColor="teal"
                    copyText={output.clientReplyDraft}
                  >
                    <p className="whitespace-pre-wrap">{output.clientReplyDraft}</p>
                  </OutputCard>

                  <OutputCard
                    title="Crew / Job Notes"
                    icon="👷"
                    accentColor="purple"
                    copyText={output.crewNotes}
                  >
                    <p className="whitespace-pre-wrap">{output.crewNotes}</p>
                  </OutputCard>

                  <OutputCard
                    title="Follow-Up Message"
                    icon="💬"
                    accentColor="green"
                    copyText={output.followUpMessage}
                  >
                    <p className="whitespace-pre-wrap">{output.followUpMessage}</p>
                  </OutputCard>

                  <OutputCard
                    title="Estimated Admin Time Saved"
                    icon="⏱️"
                    accentColor="green"
                    copyText={`${output.estimatedAdminTimeSavedMinutes} minutes saved`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-green-700">
                        {output.estimatedAdminTimeSavedMinutes}
                      </span>
                      <span className="text-gray-500 text-sm">minutes of admin work automated</span>
                    </div>
                    <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((output.estimatedAdminTimeSavedMinutes / 45) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Based on typical manual intake time of 30–45 min</p>
                  </OutputCard>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <button
                    onClick={handleCopyFullHandoff}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
                      fullHandoffCopied
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:text-green-700"
                    }`}
                  >
                    <span>{fullHandoffCopied ? "✓" : "📄"}</span>
                    {fullHandoffCopied ? "Copied Full Handoff!" : "Copy Full Handoff"}
                  </button>

                  <button
                    onClick={handleSaveIntake}
                    disabled={justSaved}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
                      justSaved
                        ? "bg-green-50 text-green-700 border-green-300 cursor-default"
                        : "bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-sm"
                    }`}
                  >
                    <span>{justSaved ? "✓" : "💾"}</span>
                    {justSaved ? "Saved to Database" : "Save Intake"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Automated Intake Inbox (DB-backed) */}
        <AutomatedInbox
          intakes={dbIntakes}
          loading={dbLoading}
          onRefresh={fetchDbIntakes}
        />

        {/* Legacy localStorage history */}
        <IntakeDashboard
          records={savedRecords}
          onClear={handleClearAll}
          onLoad={handleLoadRecord}
        />
      </main>

      <footer className="border-t border-gray-200 mt-16 py-6 text-center text-xs text-gray-400">
        DenCo AI Intake Assistant · Built with Next.js & Claude · Not for public distribution
      </footer>
    </div>
  );
}
