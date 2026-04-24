import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Mail,
  Building2,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  BadgeCheck,
  Hash,
} from "lucide-react";
import { clearAuth, selectUser } from "../store/authSlice";
import type { AppDispatch } from "../store";

interface ProfileData {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  designation_label: string;
  tenant: string;
  tenant_id: number;
  is_staff: boolean;
  is_superuser: boolean;
  language_id: number;
  language_code: string;
  language_name: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector(selectUser);

  const p = authUser as unknown as ProfileData;

  if (!p) {
    return (
      <div style={styles.loadingWrap}>
        <p style={{ color: "#f87171" }}>Could not load profile.</p>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

  const fullName =
    `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.username;

  return (
    <div style={styles.page}>
      {/* ── Hero Card ── */}
      <div style={styles.heroCard}>
        <div style={styles.avatarRing}>
          <div style={styles.avatar}>
            {getInitials(p.first_name, p.last_name)}
          </div>
        </div>

        <div style={styles.heroInfo}>
          <div style={styles.nameRow}>
            <h1 style={styles.name}>{fullName}</h1>

            {p.is_superuser && (
              <span style={styles.superBadge}>
                <BadgeCheck size={13} style={{ marginRight: 4 }} />
                Superuser
              </span>
            )}

            {p.is_staff && !p.is_superuser && (
              <span
                style={{
                  ...styles.superBadge,
                  background: "rgba(16,185,129,0.18)",
                  color: "#10b981",
                }}
              >
                <BadgeCheck size={13} style={{ marginRight: 4 }} />
                Staff
              </span>
            )}
          </div>

          <p style={styles.designation}>
            {p.designation_label || p.designation}
          </p>

          <p style={styles.tenant}>{p.tenant}</p>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} style={{ marginRight: 6 }} />
          Logout
        </button>
      </div>

      {/* ── Details Grid ── */}
      <div style={styles.grid}>
        <InfoCard
          icon={<User size={18} color="#6366f1" />}
          label="Username"
          value={p.username}
        />
        <InfoCard
          icon={<Mail size={18} color="#6366f1" />}
          label="Email"
          value={p.email || "—"}
        />
        <InfoCard
          icon={<Building2 size={18} color="#6366f1" />}
          label="Organisation"
          value={`${p.tenant} (ID: ${p.tenant_id})`}
        />
        <InfoCard
          icon={<Shield size={18} color="#6366f1" />}
          label="Role"
          value={p.designation_label || p.designation || "—"}
        />
        <InfoCard
          icon={<Globe size={18} color="#6366f1" />}
          label="Language"
          value={`${p.language_name} (${(p.language_code ?? "").toUpperCase()})`}
        />
        <InfoCard
          icon={<Hash size={18} color="#6366f1" />}
          label="User ID"
          value={`#${p.user_id}`}
        />
      </div>

      {/* ── Bottom logout row ── */}
      <button style={styles.logoutRow} onClick={handleLogout}>
        <div style={styles.logoutRowLeft}>
          <LogOut size={18} color="#f87171" />
          <span style={{ color: "#f87171", fontWeight: 500 }}>
            Sign out of account
          </span>
        </div>
        <ChevronRight size={18} color="#f87171" />
      </button>
    </div>
  );
}

// ── InfoCard ────────────────────────────────────────────────────────────────
function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div style={cardStyles.card}>
      <div style={cardStyles.iconWrap}>{icon}</div>
      <div>
        <p style={cardStyles.label}>{label}</p>
        <p style={cardStyles.value}>{value}</p>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  heroCard: {
    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
    borderRadius: 20,
    padding: "28px 24px",
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 24,
    boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
    flexWrap: "wrap",
  },
  avatarRing: {
    padding: 3,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.3)",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "white",
    color: "#6366f1",
    fontSize: 26,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: {
    flex: 1,
    minWidth: 180,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  name: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "white",
  },
  superBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
  },
  designation: {
    margin: "4px 0 2px",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: 500,
  },
  tenant: {
    margin: 0,
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "white",
    padding: "10px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  logoutRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 14,
    padding: "16px 20px",
    cursor: "pointer",
  },
  logoutRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
};

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    gap: 14,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "rgba(99,102,241,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    margin: "0 0 2px",
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  value: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
  },
};
