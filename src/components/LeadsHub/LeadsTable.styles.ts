// ====================== Status chip styles ======================
export const getStatusChipSx = (status: string) => {
  const lower = (status || "").toLowerCase();
  const map: Record<string, { bg: string; color: string }> = {
    converted:          { bg: "rgba(22,163,74,0.10)",   color: "#16A34A" },
    appointment:        { bg: "rgba(16,185,129,0.10)",  color: "#10B981" },
    "follow up":        { bg: "rgba(245,158,11,0.10)",  color: "#F59E0B" },
    new:                { bg: "rgba(59,130,246,0.10)",  color: "#3B82F6" },
    contacted:          { bg: "rgba(99,102,241,0.10)",  color: "#6366F1" },
    lost:               { bg: "rgba(239,68,68,0.10)",   color: "#EF4444" },
    "cycle conversion": { bg: "rgba(139,92,246,0.10)",  color: "#8B5CF6" },
  };
  const s = map[lower] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
  return {
    borderRadius: "999px",
    fontWeight: 500,
    fontSize: "11px",
    height: 22,
    border: "1.5px solid",
    borderColor: s.color,
    backgroundColor: s.bg,
    color: s.color,
    "& .MuiChip-label": { px: 1 },
  };
};

// ====================== Task status chip styles ======================
export const getTaskStatusChipSx = (status: string) => {
  const lower = (status || "").toLowerCase();
  if (lower === "done" || lower === "completed")
    return {
      borderRadius: "6px",
      fontWeight: 700,
      fontSize: "11px",
      height: 26,
      border: "2px solid #10B981",
      backgroundColor: "transparent",
      color: "#10B981",
      "& .MuiChip-label": { px: 1.5 },
    };
  if (lower === "to do" || lower === "todo" || lower === "pending")
    return {
      borderRadius: "6px",
      fontWeight: 700,
      fontSize: "11px",
      height: 26,
      border: "2px solid #3B82F6",
      backgroundColor: "transparent",
      color: "#3B82F6",
      "& .MuiChip-label": { px: 1.5 },
    };
  if (lower === "overdue")
    return {
      borderRadius: "6px",
      fontWeight: 700,
      fontSize: "11px",
      height: 26,
      border: "2px solid #EF4444",
      backgroundColor: "transparent",
      color: "#EF4444",
      "& .MuiChip-label": { px: 1.5 },
    };
  return {
    borderRadius: "6px",
    fontWeight: 600,
    fontSize: "11px",
    height: 26,
    border: "2px solid #94A3B8",
    backgroundColor: "transparent",
    color: "#64748B",
    "& .MuiChip-label": { px: 1.5 },
  };
};

// ====================== Use-case chip styles ======================
export const getUseCaseChipSx = (useCase: string | undefined) => {
  const lower = (useCase || "").toLowerCase();
  const map: Record<string, { color: string; bg: string }> = {
    appointment:    { color: "#16A34A", bg: "#F0FDF4" },
    reminder:       { color: "#D97706", bg: "#FFFBEB" },
    feedback:       { color: "#3B82F6", bg: "#EFF6FF" },
    "follow-up":    { color: "#8B5CF6", bg: "#F5F3FF" },
    "re-engagement":{ color: "#EC4899", bg: "#FDF2F8" },
    "no-show":      { color: "#EF4444", bg: "#FEF2F2" },
    general:        { color: "#6B7280", bg: "#F3F4F6" },
  };
  const s = map[lower] ?? { color: "#6B7280", bg: "#F3F4F6" };
  return {
    color: s.color,
    bgcolor: s.bg,
    fontWeight: 600,
    fontSize: "11px",
    height: 22,
    borderRadius: "4px",
    "& .MuiChip-label": { px: 1 },
  };
};

// ====================== Shared button styles ======================
export const outlineBtn = {
  height: 40,
  px: 3,
  textTransform: "none" as const,
  fontWeight: 500,
  borderRadius: "8px",
  border: "1px solid #D1D5DB",
  color: "#374151",
  bgcolor: "transparent",
  "&:hover": { bgcolor: "#F9FAFB" },
};

export const darkBtn = {
  height: 40,
  px: 3,
  textTransform: "none" as const,
  fontWeight: 600,
  borderRadius: "8px",
  bgcolor: "#1F2937",
  color: "white",
  "&:hover": { bgcolor: "#111827" },
  "&:disabled": { bgcolor: "#9CA3AF", color: "white" },
};