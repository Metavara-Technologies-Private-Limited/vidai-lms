import { useMemo, useState, useEffect } from "react";
import { CampaignAPI } from "../services/campaign.api";

import "../styles/Campaign/campaigns.css";

/* ===== ICONS ===== */
import searchIcon from "../components/Layout/Campaign/Icons/search.png";

/* ===== COMPONENTS ===== */
import CampaignHeader from "../components/Layout/Campaign/CampaignHeader";
import CampaignCard from "../components/Layout/Campaign/CampaignCard";
import AddNewCampaign from "../components/Layout/Campaign/AddNewCampaign";
import SocialCampaignModal from "../components/Layout/Campaign/SocialCampaignModal";
import CampaignDashboard from "../components/Layout/Campaign/CampaignDashboard";
import EmailCampaignModal from "../components/Layout/Campaign/EmailCampaignModal";

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
  objective?: string;
}

export default function CampaignsScreen() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openStatus, setOpenStatus] = useState(false);

  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await CampaignAPI.list();

      const mapped = res.data.map((api: any) => ({
        id: api.id,
        name: api.campaign_name,
        type: api.campaign_mode === 1 ? "social" : "email",
        status: api.is_active ? "Live" : "Draft",
        start: api.start_date,
        end: api.end_date,
        platforms:
          api.campaign_mode === 1
            ? api.social_media?.map((s: any) => s.platform_name) || []
            : ["gmail"],
        leads: 0,
        scheduledAt: api.selected_start,
        objective: api.campaign_objective,
      }));

      setCampaigns(mapped);
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
    }
  };

  /* ================= STATUS CHANGE (NEW) ================= */
  const handleStatusChange = (id: string, newStatus: CampaignStatus) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: newStatus } : c
      )
    );

    // 🔔 Toast
    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.innerText = `Campaign ${newStatus}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  /* ================= FILTERS ================= */
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const tabOk = tab === "all" || c.type === tab;
      const searchOk =
        (c.name ?? "").toLowerCase().includes(search.toLowerCase());
      const statusOk = status === "all" || c.status === status;
      return tabOk && searchOk && statusOk;
    });
  }, [campaigns, tab, search, status]);

  const allCount = campaigns.length;
  const socialCount = campaigns.filter((c) => c.type === "social").length;
  const emailCount = campaigns.filter((c) => c.type === "email").length;

  /* ================= DASHBOARD ================= */
  if (selectedCampaign) {
    return (
      <CampaignDashboard
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  /* ================= LIST VIEW ================= */
  return (
    <div className="campaigns-page">
      <CampaignHeader onAddNew={() => setShowAddCampaign(true)} />

      <div className="filters-row">
        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab-btn ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            All Campaigns ({allCount})
          </button>

          <button
            className={`tab-btn ${tab === "social" ? "active" : ""}`}
            onClick={() => setTab("social")}
          >
            Social Media Campaigns ({socialCount})
          </button>

          <button
            className={`tab-btn ${tab === "email" ? "active" : ""}`}
            onClick={() => setTab("email")}
          >
            Email Campaigns ({emailCount})
          </button>
        </div>

        {/* SEARCH + STATUS (UNCHANGED) */}
        <div className="right-filters">
          <div className="search-input">
            <img src={searchIcon} alt="Search" className="search-icon" />
            <input
              placeholder="Search by Campaign name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="status-dropdown">
            <div
              className={`status-btn ${openStatus ? "active" : ""}`}
              onClick={() => setOpenStatus((prev) => !prev)}
            >
              {status === "all" ? "All Status" : status}
            </div>

            {openStatus && (
              <div className="status-menu">
                {[
                  { label: "All Status", value: "all" },
                  { label: "Live", value: "Live" },
                  { label: "Draft", value: "Draft" },
                  { label: "Schedule", value: "Schedule" },
                  { label: "Paused", value: "Paused" },
                  { label: "Stopped", value: "Stopped" },
                  { label: "Completed", value: "Completed" },
                  { label: "Failed", value: "Failed" },
                ].map((item) => (
                  <div
                    key={item.value}
                    className={`status-item ${
                      status === item.value ? "selected" : ""
                    }`}
                    onClick={() => {
                      setStatus(item.value as CampaignStatus | "all");
                      setOpenStatus(false);
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARDS */}
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
              onViewDetail={setSelectedCampaign}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* MODALS */}
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
          onSave={() => {
            fetchCampaigns();
            setShowSocialModal(false);
          }}
        />
      )}

      {showEmailModal && (
        <EmailCampaignModal
          onClose={() => setShowEmailModal(false)}
          onSave={() => {
            fetchCampaigns();
            setShowEmailModal(false);
          }}
        />
      )}
    </div>
  );
}
