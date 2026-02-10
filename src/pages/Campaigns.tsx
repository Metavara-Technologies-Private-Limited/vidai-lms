import { useMemo, useState } from "react";
import "../styles/Campaign/campaigns.css";

/* ===== ICONS ===== */
import searchIcon from "../components/Layout/Campaign/Icons/search.png";

/* ===== COMPONENTS ===== */
import CampaignHeader from "../components/Layout/Campaign/CampaignHeader";
import CampaignCard from "../components/Layout/Campaign/CampaignCard";
import AddNewCampaign from "../components/Layout/Campaign/AddNewCampaign";
import SocialCampaignModal from "../components/Layout/Campaign/SocialCampaignModal";
import CampaignDashboard from "../components/Layout/Campaign/CampaignDashboard";
// import EmailCampaignModal from "../components/Layout/Campaign/EmailCampaignModal";

/* ===== TYPES ===== */
type CampaignStatus =
  | "Live"
  | "Draft"
  | "Schedule"
  | "Paused"
  | "Stopped"
  | "Completed"
  | "Failed";

type CampaignType = "social" | "email";
type Tab = "all" | "social" | "email";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  start: string;
  end: string;
  platforms: ("facebook" | "instagram" | "linkedin" | "gmail")[];
  leads: number;
  scheduledAt?: string;

  /* ===== DASHBOARD FIELDS (OPTIONAL) ===== */
  totalBudget?: number;
  totalImpressions?: number;
  totalClicks?: number;
  conversions?: number;
  totalSpend?: number;
  ctr?: number;
  conversionRate?: number;
  cpc?: number;
  cpa?: number;
  createdBy?: string;
  createdDate?: string;
  campaignMode?: string;
  objective?: string;
}

/* ===== INITIAL DATA ===== */
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "IVF Awareness – December",
    type: "social",
    status: "Live",
    start: "01/12/2025",
    end: "07/12/2025",
    platforms: ["facebook", "instagram", "linkedin"],
    leads: 14,
    objective: "Leads Generation",
    totalImpressions: 2000,
    totalClicks: 500,
    totalSpend: 400,
    ctr: 4,
    conversionRate: 6.7,
  },
  {
    id: "2",
    name: "Your Fertility Consultation – Next Steps",
    type: "email",
    status: "Failed",
    start: "01/12/2025",
    end: "07/12/2025",
    platforms: ["gmail"],
    leads: 0,
    objective: "Email Engagement",
  },
  {
    id: "3",
    name: "IVF Awareness – December",
    type: "social",
    status: "Schedule",
    start: "01/12/2025",
    end: "07/12/2025",
    platforms: ["facebook", "instagram"],
    leads: 0,
    scheduledAt: "01 Dec at 10:00 AM",
  },
  {
    id: "4",
    name: "IVF Consultation Follow-up",
    type: "email",
    status: "Draft",
    start: "02/12/2025",
    end: "08/12/2025",
    platforms: ["gmail"],
    leads: 3,
  },
  {
    id: "5",
    name: "IVF Awareness – December",
    type: "email",
    status: "Live",
    start: "01/12/2025",
    end: "07/12/2025",
    platforms: ["gmail"],
    leads: 14,
    objective: "Leads Generation",
    totalImpressions: 2000,
    totalClicks: 500,
    totalSpend: 400,
    ctr: 4,
    conversionRate: 6.7,
  }
];

export default function CampaignsScreen() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);

  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const handleCreateCampaign = (newCampaign: Campaign) => {
    setCampaigns((prev) => [newCampaign, ...prev]);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const tabOk = tab === "all" || c.type === tab;
      const searchOk = c.name.toLowerCase().includes(search.toLowerCase());
      const statusOk = status === "all" || c.status === status;
      return tabOk && searchOk && statusOk;
    });
  }, [campaigns, tab, search, status]);

  /* ===== DASHBOARD VIEW ===== */
  if (selectedCampaign) {
    return (
      <CampaignDashboard
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  /* ===== LIST VIEW ===== */
  return (
    <div className="campaigns-page">
      <CampaignHeader onAddNew={() => setShowAddCampaign(true)} />

      <div className="filters-row">
        <div className="tabs">
          {(["all", "social", "email"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "all"
                ? "All Campaigns"
                : t === "social"
                ? "Social Media Campaigns"
                : "Email Campaigns"}
            </button>
          ))}
        </div>

        <div className="right-filters">
          <div className="search-input">
            <img src={searchIcon} alt="Search" className="search-icon" />
            <input
              placeholder="Search by Campaign name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as CampaignStatus | "all")
            }
          >
            <option value="all">All Status</option>
            <option value="Live">Live</option>
            <option value="Draft">Draft</option>
            <option value="Schedule">Schedule</option>
            <option value="Paused">Paused</option>
            <option value="Stopped">Stopped</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="campaign-grid">
        {filteredCampaigns.length === 0 ? (
          <div className="empty-state">No campaigns found</div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onViewDetail={setSelectedCampaign} // ✅ ONLY ADDITION
            />
          ))
        )}
      </div>

      {showAddCampaign && (
        <AddNewCampaign
          onClose={() => setShowAddCampaign(false)}
          onSocialSelect={() => {
            setShowAddCampaign(false);
            setShowSocialModal(true);
          }}
          onEmailSelect={() => {
            setShowAddCampaign(false);
            setShowEmailModal(true);
          }}
        />
      )}

      {showSocialModal && (
        <SocialCampaignModal
          onClose={() => setShowSocialModal(false)}
          onSave={(newCampaign: Campaign) => {
            handleCreateCampaign(newCampaign);
            setShowSocialModal(false);
          }}
        />
      )}

      {showEmailModal && (
        <EmailCampaignModal
          onClose={() => setShowEmailModal(false)}
          onSave={(newCampaign: Campaign) => {
            handleCreateCampaign(newCampaign);
            setShowEmailModal(false);
          }}
        />
      )}
    </div>
  );
}
