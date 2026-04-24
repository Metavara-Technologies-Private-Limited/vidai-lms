export type AvatarTone = { bg: string; color: string };

const DOCTOR_AVATAR_COLORS: AvatarTone[] = [
  { bg: "#E7F1FF", color: "#1D4ED8" },
  { bg: "#F0FDF4", color: "#16A34A" },
  { bg: "#FFF7ED", color: "#C2410C" },
  { bg: "#F5F3FF", color: "#7C3AED" },
  { bg: "#FFF1F2", color: "#BE123C" },
  { bg: "#F0F9FF", color: "#0369A1" },
];

const PATIENT_AVATAR_COLORS: AvatarTone[] = [
  { bg: "#E7F1FF", color: "#1D4ED8" },
  { bg: "#F0FDF4", color: "#16A34A" },
  { bg: "#FFF7ED", color: "#C2410C" },
  { bg: "#F5F3FF", color: "#7C3AED" },
  { bg: "#FFF1F2", color: "#BE123C" },
  { bg: "#F0F9FF", color: "#0369A1" },
  { bg: "#FFFBEB", color: "#B45309" },
  { bg: "#F0FDFA", color: "#0F766E" },
];

export function getDoctorAvatarStyle(id: number) {
  return DOCTOR_AVATAR_COLORS[Math.abs(id) % DOCTOR_AVATAR_COLORS.length];
}

export function getPatientAvatarStyle(id: string) {
  const num = parseInt(id.replace(/\D/g, "").slice(-4) || "0", 10);
  return PATIENT_AVATAR_COLORS[num % PATIENT_AVATAR_COLORS.length];
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function buildMRN(id: string) {
  return `PCC-${id.replace(/\D/g, "").slice(-4).padStart(4, "0").toUpperCase()}`;
}
