"use client";

import { useState } from "react";

interface OutputCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  copyText?: string;
  accentColor?: "green" | "amber" | "red" | "blue" | "purple" | "teal";
}

const accentClasses = {
  green: {
    border: "border-green-200",
    header: "bg-green-50 border-green-200",
    iconBg: "bg-green-100 text-green-700",
    title: "text-green-800",
    button: "text-green-600 hover:bg-green-50 border-green-200 hover:border-green-300",
    copied: "bg-green-600 text-white border-green-600",
  },
  amber: {
    border: "border-amber-200",
    header: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
    title: "text-amber-800",
    button: "text-amber-600 hover:bg-amber-50 border-amber-200 hover:border-amber-300",
    copied: "bg-amber-600 text-white border-amber-600",
  },
  red: {
    border: "border-red-200",
    header: "bg-red-50 border-red-200",
    iconBg: "bg-red-100 text-red-700",
    title: "text-red-800",
    button: "text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300",
    copied: "bg-red-600 text-white border-red-600",
  },
  blue: {
    border: "border-blue-200",
    header: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100 text-blue-700",
    title: "text-blue-800",
    button: "text-blue-600 hover:bg-blue-50 border-blue-200 hover:border-blue-300",
    copied: "bg-blue-600 text-white border-blue-600",
  },
  purple: {
    border: "border-purple-200",
    header: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100 text-purple-700",
    title: "text-purple-800",
    button: "text-purple-600 hover:bg-purple-50 border-purple-200 hover:border-purple-300",
    copied: "bg-purple-600 text-white border-purple-600",
  },
  teal: {
    border: "border-teal-200",
    header: "bg-teal-50 border-teal-200",
    iconBg: "bg-teal-100 text-teal-700",
    title: "text-teal-800",
    button: "text-teal-600 hover:bg-teal-50 border-teal-200 hover:border-teal-300",
    copied: "bg-teal-600 text-white border-teal-600",
  },
};

export default function OutputCard({
  title,
  icon,
  children,
  copyText,
  accentColor = "green",
}: OutputCardProps) {
  const [copied, setCopied] = useState(false);
  const accent = accentClasses[accentColor];

  const handleCopy = async () => {
    if (!copyText) return;
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border ${accent.border} bg-white shadow-sm overflow-hidden`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${accent.header}`}>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm ${accent.iconBg}`}>
            {icon}
          </span>
          <h3 className={`font-semibold text-sm ${accent.title}`}>{title}</h3>
        </div>
        {copyText && (
          <button
            onClick={handleCopy}
            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-all duration-150 ${
              copied ? accent.copied : accent.button
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
