"use client";

import { IntakeRecord } from "@/lib/types";

interface IntakeDashboardProps {
  records: IntakeRecord[];
  onClear: () => void;
  onLoad: (record: IntakeRecord) => void;
}

function getMostCommonService(records: IntakeRecord[]): string | null {
  if (records.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const record of records) {
    for (const service of record.output.detectedServices) {
      counts[service] = (counts[service] ?? 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const urgencyColors: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

export default function IntakeDashboard({ records, onClear, onLoad }: IntakeDashboardProps) {
  const totalMinutesSaved = records.reduce(
    (sum, r) => sum + r.output.estimatedAdminTimeSavedMinutes,
    0
  );
  const mostCommonService = getMostCommonService(records);
  const recent = [...records].reverse().slice(0, 5);

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Intake History</h2>
          <p className="text-sm text-gray-500 mt-0.5">Saved locally in your browser</p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Clear all saved intakes? This cannot be undone.")) {
                onClear();
              }
            }}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Total Intakes Saved
          </p>
          <p className="text-3xl font-bold text-gray-900">{records.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Admin Time Saved
          </p>
          <p className="text-3xl font-bold text-green-700">
            {totalMinutesSaved >= 60
              ? `${Math.floor(totalMinutesSaved / 60)}h ${totalMinutesSaved % 60}m`
              : `${totalMinutesSaved}m`}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Top Service
          </p>
          <p className="text-xl font-bold text-gray-900 leading-tight">
            {mostCommonService ?? (
              <span className="text-gray-400 font-normal text-sm">—</span>
            )}
          </p>
        </div>
      </div>

      {/* Recent intakes */}
      {records.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">No intakes saved yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Generate a summary and click "Save Intake" to track it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Recent Intakes
          </h3>
          {recent.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onLoad(record)}
              title="Click to reload this intake"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {record.customerName || "Unknown Customer"}
                    </span>
                    {record.city && (
                      <span className="text-xs text-gray-500">&bull; {record.city}</span>
                    )}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyColors[record.output.urgencyLevel] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {record.output.urgencyLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(record.createdAt)}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {record.output.detectedServices.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400">Saved</p>
                  <p className="text-sm font-semibold text-green-700">
                    {record.output.estimatedAdminTimeSavedMinutes}m
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
