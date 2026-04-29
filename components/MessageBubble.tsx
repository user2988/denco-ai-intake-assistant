"use client";

import { InputChannel } from "@/lib/types";

interface MessageBubbleProps {
  channel: InputChannel;
  customerName: string;
  inquiry: string;
  timestamp?: string;
}

const channelConfig: Record<InputChannel, {
  label: string;
  icon: string;
  headerBg: string;
  headerText: string;
  bubbleBg: string;
  bubbleText: string;
  avatarBg: string;
  statusBar?: string;
}> = {
  whatsapp: {
    label: "WhatsApp",
    icon: "🟢",
    headerBg: "bg-[#075E54]",
    headerText: "text-white",
    bubbleBg: "bg-[#DCF8C6]",
    bubbleText: "text-gray-800",
    avatarBg: "bg-[#25D366]",
    statusBar: "bg-[#128C7E]",
  },
  sms: {
    label: "Text Message",
    icon: "💬",
    headerBg: "bg-gray-800",
    headerText: "text-white",
    bubbleBg: "bg-[#3B82F6]",
    bubbleText: "text-white",
    avatarBg: "bg-gray-500",
  },
  email: {
    label: "Email",
    icon: "📧",
    headerBg: "bg-blue-700",
    headerText: "text-white",
    bubbleBg: "bg-white",
    bubbleText: "text-gray-800",
    avatarBg: "bg-blue-500",
  },
  facebook: {
    label: "Facebook Messenger",
    icon: "📘",
    headerBg: "bg-[#0866FF]",
    headerText: "text-white",
    bubbleBg: "bg-[#E4E6EB]",
    bubbleText: "text-gray-800",
    avatarBg: "bg-[#0866FF]",
  },
  phone: {
    label: "Phone Note",
    icon: "📞",
    headerBg: "bg-gray-700",
    headerText: "text-white",
    bubbleBg: "bg-yellow-50",
    bubbleText: "text-gray-800",
    avatarBg: "bg-gray-500",
  },
};

function getInitials(name: string): string {
  if (!name.trim()) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getNow(): string {
  return new Date().toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ channel, customerName, inquiry }: MessageBubbleProps) {
  const config = channelConfig[channel];
  const initials = getInitials(customerName || "Customer");
  const time = getNow();

  if (channel === "email") {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm text-sm">
        <div className={`${config.headerBg} ${config.headerText} px-4 py-2 flex items-center gap-2`}>
          <span>{config.icon}</span>
          <span className="font-semibold text-xs">New Email — {config.label}</span>
        </div>
        <div className="bg-white px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <div className={`w-8 h-8 rounded-full ${config.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-xs">{customerName || "Unknown Sender"}</p>
              <p className="text-gray-400 text-xs">Inquiry — just now</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xs">{inquiry}</p>
        </div>
      </div>
    );
  }

  if (channel === "phone") {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm text-sm">
        <div className={`${config.headerBg} ${config.headerText} px-4 py-2 flex items-center gap-2`}>
          <span>{config.icon}</span>
          <span className="font-semibold text-xs">Phone Call Note</span>
        </div>
        <div className="bg-yellow-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-xs">{customerName || "Unknown Caller"}</p>
              <p className="text-gray-400 text-xs">Called — just now</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xs italic border-l-2 border-yellow-300 pl-3">{inquiry}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm text-sm">
      {/* App-style header */}
      {config.statusBar && (
        <div className={`${config.statusBar} h-1`} />
      )}
      <div className={`${config.headerBg} ${config.headerText} px-3 py-2 flex items-center gap-2.5`}>
        <div className={`w-7 h-7 rounded-full ${config.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0 border-2 border-white/30`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs leading-tight truncate">{customerName || "Unknown"}</p>
          <p className="text-xs opacity-70 leading-tight">{config.label}</p>
        </div>
        <span className="text-xs opacity-60">{time}</span>
      </div>

      {/* Chat area */}
      <div className="bg-gray-100 px-3 py-3 min-h-[60px]">
        <div className="flex justify-start">
          <div className={`${config.bubbleBg} ${config.bubbleText} rounded-2xl rounded-tl-sm px-3 py-2 max-w-[90%] shadow-sm`}>
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{inquiry}</p>
            <p className={`text-right mt-1 text-xs ${channel === "sms" ? "text-blue-200" : "text-gray-400"}`}>
              {time} {channel === "whatsapp" && "✓✓"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
