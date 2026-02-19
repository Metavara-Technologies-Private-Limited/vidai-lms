/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import "../styles/Campaign/campaigns.css";
import searchIcon from "../components/Layout/Campaign/Icons/search.png";
import CampaignHeader from "../components/Layout/Campaign/CampaignHeader";
import CampaignCard from "../components/Layout/Campaign/CampaignCard";
import AddNewCampaign from "../components/Layout/Campaign/AddNewCampaign";
import SocialCampaignModal from "../components/Layout/Campaign/SocialCampaignModal";
import CampaignDashboard from "../components/Layout/Campaign/CampaignDashboard";
import EmailCampaignModal from "../components/Layout/Campaign/EmailCampaignModal";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCampaign,
  updateCampaignStatus,
} from "../store/campaignSlice";
import type { AppDispatch } from "../store";
import EditCampaignModal from "../components/Layout/Campaign/EditCampaignModal";
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

export default function CampaignsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const rawCampaigns = useSelector(selectCampaign);

const campaigns = (rawCampaigns || []).map((api: any) => {
  let status: CampaignStatus;

if (api.status === "live" || api.is_active === true) {
  status = "Live";
} else if (api.status === "scheduled") {
  status = "Schedule";
} else if (api.status === "draft") {
  status = "Draft";
} else {
  status = "Stopped";
}

  return {
    id: api.id,
    name: api.campaign_name ?? "",
    type: api.campaign_mode === 1 ? "social" : "email",
    status,
    start: api.start_date,
    end: api.end_date,
    platforms:
      api.campaign_mode === 1
        ? api.social_media?.map((s: any) => s.platform_name) || []
        : ["gmail"],
    leads: 0,
    scheduledAt: api.selected_start,
    objective: api.campaign_objective,
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
  const handleStatusChange = (id: string, newStatus: CampaignStatus) => {
    dispatch(updateCampaignStatus({ id, status: newStatus }));   
  };

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
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
                {[
                  "all",
                  "Live",
                  "Stopped",
                  "Draft",
                  "Schedule",
                  "Completed",
                  "Failed",
                ].map((item) => (
                  <div
                    key={item}
                    className={`status-item ${
                      status === item ? "selected" : ""
                    }`}
                    onClick={() => {
                      setStatus(item as CampaignStatus | "all");
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
              campaign={campaign}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onViewDetail={setSelectedCampaign}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit} // ADD THIS
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
          onSave={() => setShowSocialModal(false)}
        />
      )}
      {showEmailModal && (
        <EmailCampaignModal
          onClose={() => setShowEmailModal(false)}
          onSave={() => setShowEmailModal(false)}
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
    </div>
  );
}
