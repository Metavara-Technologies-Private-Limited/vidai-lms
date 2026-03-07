/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useEffect } from "react";
import "../styles/Campaign/campaigns.css";
import searchIcon from "../components/Layout/Campaign/Icons/search.png";
import CampaignHeader from "../components/Layout/Campaign/CampaignHeader";
import CampaignCard from "../components/Layout/Campaign/CampaignCard";
import AddNewCampaign from "../components/Layout/Campaign/AddNewCampaign";
import SocialCampaignModal from "../components/Layout/Campaign/SocialCampaignModal";
import CampaignDashboard from "../components/Layout/Campaign/CampaignDashboard";
import EmailCampaignModal from "../components/Layout/Campaign/EmailCampaignModal";
import { useSelector, useDispatch } from "react-redux";
import {selectCampaign,updateCampaignStatus,} from "../store/campaignSlice";
import type { AppDispatch } from "../store";
import EditCampaignModal from "../components/Layout/Campaign/EditCampaignModal";
import DuplicateCampaignModal from "../components/Layout/Campaign/DuplicateCampaignModal";
import type { CampaignStatus } from "../types/campaigns.types";
// import { setCampaigns } from "../store/campaignSlice"
// import { CampaignAPI } from "../services/campaign.api"
import { fetchCampaign } from "../store/campaignSlice";
import { toast } from "react-toastify";

type Tab = "all" | "social" | "email";

export default function CampaignsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const rawCampaigns = useSelector(selectCampaign);

  useEffect(() => {
    dispatch(fetchCampaign());
  }, [dispatch]);

 // AFTER ✅ — trusts Redux status first, falls back to API fields
const campaigns = (rawCampaigns || []).map((api: any) => {
  console.log("BACKEND STATUS:", api.status);
  console.log("BACKEND ACTIVE:", api.is_active);
  let status: CampaignStatus;

const backendStatus = (api.status || "").toLowerCase();

if (backendStatus === "scheduled") {
  status = "Scheduled";
}
else if (backendStatus === "draft") {
  status = "Draft";
}
else if (backendStatus === "stopped") {
  status = "Stopped";
}
else if (backendStatus === "completed") {
  status = "Stopped"; // or "Completed" if you support it
}
else if (backendStatus === "live") {
  status = "Live";
}
else if (api.is_active === true) {
  status = "Live";
}
else {
  status = "Draft";
}

    // ─── Resolve platforms ────────────────────────────────────────────────
    // campaign_mode: 1 = organic (social), 2 = paid (social), 3 = email
    // NEVER use campaign_mode === 2 as "email" — 2 is PAID ADVERTISING (social)
    let platforms: ("instagram" | "facebook" | "linkedin" | "gmail")[] = [];
    let type: "social" | "email";

    const isEmailCampaign =
      api.campaign_mode === 3 ||
      (Array.isArray(api.email) && api.email.length > 0);

    if (isEmailCampaign) {
      type = "email";
      platforms = ["gmail"] as ("instagram" | "facebook" | "linkedin" | "gmail")[];
    } else {
      // Social campaign (organic=1 or paid=2)
      type = "social";

      // Get platforms from social_media array (CampaignReadSerializer key)
      if (Array.isArray(api.social_media) && api.social_media.length > 0) {
        platforms = (api.social_media
          .filter((s: any) => s.is_active !== false)
          .map((s: any) => (s.platform_name ?? "").toLowerCase())
          .filter(Boolean)) as ("instagram" | "facebook" | "linkedin" | "gmail")[];
      }

      // Fallback: select_ad_accounts
      if (platforms.length === 0 && Array.isArray(api.select_ad_accounts)) {
        platforms = api.select_ad_accounts.map((p: string) => p.toLowerCase()) as ("instagram" | "facebook" | "linkedin" | "gmail")[];
      }

      // ⭐ FIX: handle platform_data (used by duplicate campaign)
if (platforms.length === 0 && api.platform_data) {
  platforms = Object.entries(api.platform_data)
    .filter(([, v]: any) => v?.is_active === true)
    .map(([key]) => key.toLowerCase()) as ("instagram" | "facebook" | "linkedin" | "gmail")[];
}

    }


    return {
      id: api.id,
      name: api.campaign_name ?? "",
      type,
      status,
      start: api.start_date,
      end: api.end_date,
      platforms,
      leads: 0,
      lead_generated: api.lead_generated ?? 0,
      scheduledAt: api.selected_start,
      objective: api.campaign_objective,
      budget_data: api.budget_data ?? {},
      image_url: api.image_url ?? "",
      platform_data: api.platform_data ?? {},
      campaign_content: api.campaign_content ?? "",
      total_spend: api.total_spend ?? 0,
      cpc: api.cpc ?? 0,
    };
  });

  /* ================= LOCAL UI STATE ================= */
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openStatus, setOpenStatus] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [duplicatingCampaign, setDuplicatingCampaign] = useState<any>(null);

 const handleStatusChange = (id: string, status: CampaignStatus) => {
  dispatch(updateCampaignStatus({ id, status })).unwrap().catch(() => {
    // API failed — re-fetch to revert UI back to real status
    dispatch(fetchCampaign());
    toast.error("Failed to update campaign status");
  });
};

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };

  const handleDuplicate = (campaign: any) => {
    setDuplicatingCampaign(campaign);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const tabOk = tab === "all" || c.type === tab;
      const searchOk = (c.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const statusOk = status === "all" || c.status === status;
      return tabOk && searchOk && statusOk;
    });
  }, [campaigns, tab, search, status]);

  const allCount = campaigns.length;
  const socialCount = campaigns.filter((c) => c.type === "social").length;
  const emailCount = campaigns.filter((c) => c.type === "email").length;

  if (selectedCampaign) {
    return (
      <CampaignDashboard
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  return (
    <div className="campaigns-page">
      <CampaignHeader onAddNew={() => setShowAddCampaign(true)} />
      <div className="filters-row">
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
                {(
                  [
                    "all",
                    "Live",
                    "Stopped",
                    "Draft",
                    "Scheduled",
                  ] as (CampaignStatus | "all")[]
                ).map((item) => (
                  <div
                    key={item}
                    className={`status-item ${
                      status === item ? "selected" : ""
                    }`}
                    onClick={() => {
                      setStatus(item);
                      setOpenStatus(false);
                    }}
                  >
                    {item === "all" ? "All Status" : item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="campaign-grid">
        {filteredCampaigns.length === 0 ? (
          <div className="empty-state">No campaigns found</div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign as any}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onViewDetail={setSelectedCampaign}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
            />
          ))
        )}
      </div>

      {/* ================= MODALS ================= */}
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
      setShowSocialModal(false);
      dispatch(fetchCampaign());
    }}
  />
)}
      {showEmailModal && (
  <EmailCampaignModal
    onClose={() => setShowEmailModal(false)}
    onSave={() => {
      setShowEmailModal(false);
      dispatch(fetchCampaign());
    }}
  />
)}
      {showEditModal && editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
          }}
        />
      )}
      {duplicatingCampaign && (
        <DuplicateCampaignModal
          campaign={duplicatingCampaign}
          onClose={() => setDuplicatingCampaign(null)}
          onSave={() => {
          setDuplicatingCampaign(null);
          dispatch(fetchCampaign());
        }}
        />
      )}
    </div>
  );
}