"use client";

const channels = [
  { icon: "💬", label: "Text / SMS" },
  { icon: "🟢", label: "WhatsApp" },
  { icon: "📧", label: "Email" },
  { icon: "📘", label: "Facebook" },
  { icon: "📞", label: "Phone Note" },
];

export default function PipelineBanner() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-5 mb-8">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">
        Automation Pipeline
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">

        {/* Input channels */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-2 flex-wrap justify-center">
            {channels.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600"
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">Customer Message</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 px-2">
          <svg className="w-6 h-6 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* AI processor */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 bg-green-600 text-white rounded-xl px-4 py-2 shadow-sm">
            <span className="text-lg">🌿</span>
            <div>
              <p className="text-xs font-bold leading-tight">DenCo AI</p>
              <p className="text-xs opacity-80 leading-tight">Intake Assistant</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Powered by Claude</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 px-2">
          <svg className="w-6 h-6 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Outputs */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {["Quote Prep", "Client Reply", "Crew Notes", "Follow-Up"].map((label) => (
              <div
                key={label}
                className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-lg text-center"
              >
                {label}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">Structured Output</p>
        </div>
      </div>
    </div>
  );
}
