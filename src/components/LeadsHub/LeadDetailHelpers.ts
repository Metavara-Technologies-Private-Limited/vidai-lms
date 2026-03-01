import type { DocumentEntry } from "./LeadDetailTypes";

// ====================== Format Lead ID ======================
export const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) {
    return id.startsWith("#") ? id : `#${id}`;
  }
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

// ====================== Document helpers ======================
export const getDocColor = (name: string): string => {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  const map: Record<string, string> = {
    pdf: "#EF4444",
    doc: "#3B82F6",
    docx: "#3B82F6",
    jpg: "#10B981",
    jpeg: "#10B981",
    png: "#10B981",
    webp: "#10B981",
  };
  return map[ext] ?? "#6366F1";
};

export const normalizeDocument = (doc: DocumentEntry): { url: string; name: string } => {
  if (typeof doc === "string") {
    const url = doc;
    let name = "";
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split("/");
      name = parts[parts.length - 1].split("?")[0];
    } catch {
      name = url;
    }
    if (!name || name === url) name = "document";
    return { url, name };
  }
  const url =
    (typeof doc.url === "string" ? doc.url : "") ||
    (typeof doc.file === "string" ? doc.file : "") ||
    "";
  let name = typeof doc.name === "string" && doc.name ? doc.name : "";
  if (!name && url) {
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split("/");
      name = parts[parts.length - 1].split("?")[0];
    } catch {
      name = url;
    }
  }
  if (!name) name = "document";
  return { url, name };
};

// ====================== Status color helpers ======================
export const getCallStatusColor = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { bg: "#F0FDF4", color: "#16A34A" };
  if (s === "failed" || s === "busy" || s === "no-answer")
    return { bg: "#FEF2F2", color: "#EF4444" };
  if (s === "initiated" || s === "ringing" || s === "in-progress")
    return { bg: "#EFF6FF", color: "#3B82F6" };
  return { bg: "#F1F5F9", color: "#64748B" };
};

export const getSMSStatusColor = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return { bg: "#F0FDF4", color: "#16A34A" };
  if (s === "failed" || s === "undelivered") return { bg: "#FEF2F2", color: "#EF4444" };
  if (s === "sent" || s === "queued") return { bg: "#EFF6FF", color: "#3B82F6" };
  return { bg: "#F1F5F9", color: "#64748B" };
};

export const formatDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const formatNoteTime = (iso: string): string =>
  new Date(iso)
    .toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .toUpperCase();

export const getCurrentUserId = (): number | null => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1])) as Record<string, unknown>;
    const uid = payload.user_id ?? payload.id ?? payload.sub ?? null;
    return typeof uid === "number" ? uid : null;
  } catch {
    return null;
  }
};

export const getCleanLeadId = (leadId: string): string =>
  leadId.replace("#", "").replace("LN-", "").replace("LD-", "");