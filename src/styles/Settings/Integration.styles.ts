import React from "react";
import { Facebook } from "lucide-react";

export const INTEGRATION_STYLES = {
  content: {
    grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  },

  card: {
    base: "bg-white rounded-xl border border-slate-200 overflow-hidden",
  },

  cardHeader: {
    wrapper: "flex items-center gap-3 px-5 py-4",
    iconWrapper:
      "w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center",
    platformName: "font-semibold text-slate-900 text-sm",
    description: "text-xs text-slate-500",
  },

  divider: "border-t border-slate-100",

  cardBody: {
    wrapper: "flex flex-col items-center text-center px-6 py-8",
    statusIconWrapper:
      "w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4",
    statusIcon: {
      connected: "w-7 h-7 text-green-500",
      disconnected: "w-7 h-7 text-slate-300",
    },
    statusText: "font-semibold text-sm text-slate-900 mb-1",
    message: "text-xs text-slate-400 mb-6 max-w-[220px]",
  },

  button:
    "flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200",

  infoSection: {
    wrapper:
      "mt-12 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl",
    title: "font-semibold text-blue-900 mb-1",
    description: "text-sm text-blue-700/80",
  },
} as const;

export interface Platform {
  key: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export const PLATFORMS: Platform[] = [
  {
    key: "facebook",
    name: "Facebook",
    icon: React.createElement(Facebook, { size: 16 }),
    description: "For run campaign, publish posts",
  },
];

export const getStatusMessage = (
  isConnected: boolean,
  platformName: string
): string =>
  isConnected
    ? `Awesome! Your ${platformName} account is all set up & connected.`
    : `Connect your ${platformName} account to get started.`;
