"use client";

import { useState } from "react";
import { SavedIntake, IntakeSource } from "@/lib/types";

interface AutomatedInboxProps {
  intakes: SavedIntake[];
  loading: boolean;
  onRefresh: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMostCommonService(intakes: SavedIntake[]): string | null {
  if (intakes.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const intake of intakes) {
    for (const svc of intake.detectedServices ?? []) {
      counts[svc] = (counts[svc] ?? 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function buildInternalHandoff(intake: SavedIntake): string {
  return [
    "═══════════════════════════════════════",
    "  DENCO AI INTAKE — " + (intake.source ?? "AUTOMATED").toUpperCase(),
    "═══════════════════════════════════════",
    "",
    `Customer:  ${intake.customerName ?? "—"}`,
    `Email:     ${intake.customerEmail ?? "—"}`,
    `Phone:     ${intake.phone ?? "—"}`,
    `City:      ${intake.city ?? "—"}`,
    `Timeline:  ${intake.preferredTimeline ?? "—"}`,
    `Subject:   ${intake.subject ?? "—"}`,
    "",
    "─── DETECTED SERVICES ───",
    (intake.detectedServices ?? []).join(", ") || "—",
    "",
    `─── URGENCY: ${intake.urgencyLevel} ───`,
    "",
    "─── INTERNAL JOB SUMMARY ───",
    intake.internalJobSummary,
    "",
    "─── MISSING INFORMATION ───",
    (intake.missingInformation ?? []).map((i) => `• ${i}`).join("\n") || "None",
    "",
    "─── CREW / JOB NOTES ───",
    intake.crewNotes,
    "",
    intake.recommendedNextAction
      ? `─── RECOMMENDED NEXT ACTION ───\n${intake.recommendedNextAction}\n`
      : "",
    `─── EST. ADMIN TIME SAVED: ${intake.estimatedAdminTimeSavedMinutes} minutes ───`,
    "",
    `Created: ${formatDate(intake.createdAt)}`,
    "═══════════════════════════════════════",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

// ── Sub-components ────────────────────────────────────────────────────────────

const sourceBadge: Record<
  IntakeSource,
  { label: string; classes: string }
> = {
  email:    { label: "Email",     classes: "bg-blue-100 text-blue-700 border-blue-200" },
  whatsapp: { label: "WhatsApp",  classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  sms:      { label: "SMS",       classes: "bg-violet-100 text-violet-700 border-violet-200" },
  website:  { label: "Website",   classes: "bg-orange-100 text-orange-700 border-orange-200" },
  facebook: { label: "Facebook",  classes: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  manual:   { label: "Manual",    classes: "bg-gray-100 text-gray-600 border-gray-200" },
  other:    { label: "Other",     classes: "bg-gray-100 text-gray-600 border-gray-200" },
};

const urgencyStyles: Record<string, { badge: string; dot: string }> = {
  High:   { badge: "bg-red-100 text-red-700 border-red-200",     dot: "bg-red-500" },
  Medium: { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Low:    { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
};

function CopyButton({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
        copied
          ? "bg-green-600 text-white border-green-600"
          : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
      }`}
    >
      <span>{copied ? "✓" : "📋"}</span>
      {copied ? copiedLabel : label}
    </button>
  );
}

function IntakeCard({ intake }: { intake: SavedIntake }) {
  const [expanded, setExpanded] = useState(false);

  const source =
    sourceBadge[intake.source as IntakeSource] ?? sourceBadge.other;
  const urgency = urgencyStyles[intake.urgencyLevel] ?? urgencyStyles.Low;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:border-green-200 hover:shadow-md transition-all">
      {/* Card header — always visible */}
      <div
        className="px-5 py-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Name + badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">
                {intake.customerName ?? "Unknown customer"}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${source.classes}`}
              >
                {source.label}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${urgency.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                {intake.urgencyLevel}
              </span>
            </div>

            {/* Email + timestamp */}
            <p className="text-xs text-gray-500 mt-0.5">
              {intake.customerEmail && (
                <span className="mr-2">{intake.customerEmail}</span>
              )}
              <span className="text-gray-400">{formatDate(intake.createdAt)}</span>
            </p>

            {/* Subject */}
            {intake.subject && (
              <p className="text-xs text-gray-600 mt-1 truncate">
                <span className="font-medium">Subject:</span> {intake.subject}
              </p>
            )}

            {/* Service pills */}
            {intake.detectedServices && intake.detectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {intake.detectedServices.map((svc) => (
                  <span
                    key={svc}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time saved + expand toggle */}
          <div className="shrink-0 text-right flex flex-col items-end gap-2">
            <div>
              <p className="text-xs text-gray-400">Time saved</p>
              <p className="text-sm font-bold text-green-700">
                {intake.estimatedAdminTimeSavedMinutes}m
              </p>
            </div>
            <span className="text-xs text-gray-400 select-none">
              {expanded ? "▲ collapse" : "▼ expand"}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 space-y-4">
          {/* Internal job summary */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Internal Job Summary
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {intake.internalJobSummary}
            </p>
          </div>

          {/* Missing information */}
          {intake.missingInformation && intake.missingInformation.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Missing Information
              </p>
              <ul className="space-y-1">
                {intake.missingInformation.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Client reply draft */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Client Reply Draft
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {intake.clientReplyDraft}
              </p>
            </div>
          </div>

          {/* Crew notes */}
          {intake.crewNotes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Crew / Job Notes
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {intake.crewNotes}
              </p>
            </div>
          )}

          {/* Recommended next action */}
          {intake.recommendedNextAction && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Recommended Next Action
              </p>
              <p className="text-sm text-gray-700">
                {intake.recommendedNextAction}
              </p>
            </div>
          )}

          {/* Original message (collapsed further) */}
          <details className="group">
            <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 transition-colors list-none">
              ▶ Original Message
            </summary>
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                {intake.originalMessage}
              </p>
            </div>
          </details>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <CopyButton
              text={intake.clientReplyDraft}
              label="Copy Client Reply"
              copiedLabel="Copied!"
            />
            <CopyButton
              text={buildInternalHandoff(intake)}
              label="Copy Internal Handoff"
              copiedLabel="Copied!"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AutomatedInbox({
  intakes,
  loading,
  onRefresh,
}: AutomatedInboxProps) {
  const totalMinutesSaved = intakes.reduce(
    (sum, i) => sum + (i.estimatedAdminTimeSavedMinutes ?? 0),
    0
  );
  const mostRecentSource = intakes[0]?.source ?? null;
  const mostCommonService = getMostCommonService(intakes);

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              Automated Intake Inbox
            </h2>
            {intakes.length > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                {intakes.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Intakes saved from Zapier, email, and manual generation
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
            loading
              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:text-green-700 shadow-sm"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Refreshing…
            </>
          ) : (
            <>
              <span>↻</span>
              Refresh Intakes
            </>
          )}
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Total Intakes
          </p>
          <p className="text-3xl font-bold text-gray-900">{intakes.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Admin Time Saved
          </p>
          <p className="text-2xl font-bold text-green-700">
            {totalMinutesSaved >= 60
              ? `${Math.floor(totalMinutesSaved / 60)}h ${totalMinutesSaved % 60}m`
              : `${totalMinutesSaved}m`}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Latest Source
          </p>
          <p className="text-lg font-bold text-gray-900 capitalize">
            {mostRecentSource ? (
              <span
                className={`inline-flex text-sm px-2.5 py-0.5 rounded-full border ${
                  (sourceBadge[mostRecentSource as IntakeSource] ?? sourceBadge.other).classes
                }`}
              >
                {(sourceBadge[mostRecentSource as IntakeSource] ?? sourceBadge.other).label}
              </span>
            ) : (
              <span className="text-gray-400 font-normal text-sm">—</span>
            )}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Top Service
          </p>
          <p className="text-lg font-bold text-gray-900 leading-tight">
            {mostCommonService ?? (
              <span className="text-gray-400 font-normal text-sm">—</span>
            )}
          </p>
        </div>
      </div>

      {/* Intake list */}
      {loading && intakes.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading intakes…
        </div>
      ) : intakes.length === 0 ? (
        <div className="text-center py-14 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-2xl mb-2">📬</p>
          <p className="text-gray-500 text-sm font-medium">No intakes yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Zapier-created intakes and manually saved intakes will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {intakes.map((intake) => (
            <IntakeCard key={intake.id} intake={intake} />
          ))}
        </div>
      )}
    </section>
  );
}
